package com.femora.backend.journal;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;

/**
 * Saves and reads journal notes. Every method takes the user's id from the login token,
 * never from the request, so people can only touch their own notes.
 */
@Service
public class JournalService {

    public static final Set<String> MOODS =
            Set.of("Calm", "Bright", "Tired", "Thoughtful", "Energized");

    public static final Set<String> SYMPTOMS = Set.of(
            "Cramps", "Headache", "Bloating", "Fatigue", "Mood swings",
            "Acne", "Back pain", "Nausea", "Cravings", "Poor sleep");

    private static final int MAX_NOTE = 500;
    private static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");
    private static final int DEFAULT_CYCLE_DAYS = 28;
    private static final int DEFAULT_PERIOD_DAYS = 5;

    private final JournalRepository repo;
    private final JdbcTemplate jdbc;

    public JournalService(JournalRepository repo, JdbcTemplate jdbc) {
        this.repo = repo;
        this.jdbc = jdbc;
    }

    public record Input(LocalDate date, String mood, List<String> symptoms, String note) {}

    private record CycleInfo(Integer day, String phase) {}

    // --------------------------------------------------
    // READ
    // --------------------------------------------------

    /** Newest first. When days is null or zero, everything is returned. */
    public List<JournalEntry> list(Long userId, Integer days) {
        if (days == null || days <= 0) {
            return repo.findByUserIdOrderByEntryDateDescIdDesc(userId);
        }

        LocalDate from = LocalDate.now(ZONE).minusDays(Math.min(days, 3650));
        return repo.findByUserIdAndEntryDateGreaterThanEqualOrderByEntryDateDescIdDesc(userId, from);
    }

    // --------------------------------------------------
    // WRITE
    // --------------------------------------------------

    public JournalEntry create(Long userId, Input input) {
        Input clean = validate(input);

        JournalEntry entry = new JournalEntry();
        entry.setUserId(userId);
        apply(entry, clean);

        return repo.save(entry);
    }

    public JournalEntry update(Long userId, Long id, Input input) {
        Input clean = validate(input);

        JournalEntry entry = repo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NoSuchElementException("That note was not found."));

        apply(entry, clean);

        return repo.save(entry);
    }

    public void delete(Long userId, Long id) {
        JournalEntry entry = repo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NoSuchElementException("That note was not found."));

        repo.delete(entry);
    }

    /** The dashboard's "How are you feeling today?" buttons: one mood entry per day. */
    public JournalEntry checkin(Long userId, LocalDate date, String mood) {
        if (mood == null || !MOODS.contains(mood)) {
            throw new IllegalArgumentException("Choose one of the moods.");
        }
        checkDate(date);

        JournalEntry entry = repo.findFirstByUserIdAndEntryDateOrderByIdAsc(userId, date)
                .orElseGet(() -> {
                    JournalEntry fresh = new JournalEntry();
                    fresh.setUserId(userId);
                    fresh.setEntryDate(date);
                    return fresh;
                });

        entry.setMood(mood);

        CycleInfo info = cycleInfo(userId, date);
        entry.setCycleDay(info.day());
        entry.setPhase(info.phase());
        entry.setUpdatedAt(LocalDateTime.now());

        return repo.save(entry);
    }

    // --------------------------------------------------
    // HELPERS
    // --------------------------------------------------

    public static List<String> splitSymptoms(String stored) {
        if (stored == null || stored.isBlank()) {
            return List.of();
        }
        return Arrays.asList(stored.split(","));
    }

    private void apply(JournalEntry entry, Input input) {
        entry.setEntryDate(input.date());
        entry.setMood(input.mood());
        entry.setSymptoms(input.symptoms().isEmpty() ? null : String.join(",", input.symptoms()));
        entry.setNote(input.note());

        CycleInfo info = cycleInfo(entry.getUserId(), input.date());
        entry.setCycleDay(info.day());
        entry.setPhase(info.phase());
        entry.setUpdatedAt(LocalDateTime.now());
    }

    private Input validate(Input input) {
        if (input == null) {
            throw new IllegalArgumentException("Nothing to save.");
        }

        checkDate(input.date());

        String mood = blankToNull(input.mood());
        if (mood != null && !MOODS.contains(mood)) {
            throw new IllegalArgumentException("Choose one of the moods.");
        }

        List<String> symptoms = new ArrayList<>();
        if (input.symptoms() != null) {
            for (String raw : input.symptoms()) {
                if (raw == null || raw.isBlank()) {
                    continue;
                }
                String name = raw.trim();
                if (!SYMPTOMS.contains(name)) {
                    throw new IllegalArgumentException("Choose symptoms from the list.");
                }
                if (!symptoms.contains(name)) {
                    symptoms.add(name);
                }
            }
        }

        String note = blankToNull(input.note());
        if (note != null && note.length() > MAX_NOTE) {
            throw new IllegalArgumentException("Notes can be up to 500 characters.");
        }

        if (mood == null && symptoms.isEmpty() && note == null) {
            throw new IllegalArgumentException("Pick a mood, a symptom or write a note.");
        }

        return new Input(input.date(), mood, symptoms, note);
    }

    private static void checkDate(LocalDate date) {
        if (date == null) {
            throw new IllegalArgumentException("Choose a date.");
        }

        LocalDate today = LocalDate.now(ZONE);

        if (date.isAfter(today.plusDays(1))) {
            throw new IllegalArgumentException("That date is in the future.");
        }
        if (date.isBefore(today.minusYears(5))) {
            throw new IllegalArgumentException("That date is too far back.");
        }
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    // --------------------------------------------------
    // CYCLE DAY AND PHASE FOR A GIVEN DATE
    // --------------------------------------------------

    private CycleInfo cycleInfo(Long userId, LocalDate date) {
        String sql = """
                SELECT p.average_cycle_length, p.period_duration, p.last_period_date,
                       (SELECT MAX(l.start_date) FROM period_logs l
                         WHERE l.user_id = p.user_id AND l.start_date <= ?) AS log_start
                FROM user_profiles p
                WHERE p.user_id = ?
                """;

        try {
            CycleInfo info = jdbc.query(sql, (ResultSetExtractor<CycleInfo>) rs -> {
                if (!rs.next()) {
                    return null;
                }

                int cycle = rs.getInt("average_cycle_length");
                if (rs.wasNull() || cycle < 15) {
                    cycle = DEFAULT_CYCLE_DAYS;
                }

                int period = rs.getInt("period_duration");
                if (rs.wasNull() || period < 1) {
                    period = DEFAULT_PERIOD_DAYS;
                }

                LocalDate start = null;

                java.sql.Date logStart = rs.getDate("log_start");
                java.sql.Date profileStart = rs.getDate("last_period_date");

                if (logStart != null) {
                    start = logStart.toLocalDate();
                } else if (profileStart != null && !profileStart.toLocalDate().isAfter(date)) {
                    start = profileStart.toLocalDate();
                }

                if (start == null) {
                    return null;
                }

                long diff = ChronoUnit.DAYS.between(start, date);
                int day = (int) (diff % cycle) + 1;

                return new CycleInfo(day, phaseFor(day, cycle, period));
            }, java.sql.Date.valueOf(date), userId);

            return info == null ? new CycleInfo(null, null) : info;
        } catch (Exception e) {
            return new CycleInfo(null, null);
        }
    }

    private static String phaseFor(int day, int cycle, int period) {
        int ovulation = cycle - 14;

        if (day <= period) {
            return "Menstrual";
        }
        if (day < ovulation - 1) {
            return "Follicular";
        }
        if (day <= ovulation + 1) {
            return "Ovulation";
        }
        return "Luteal";
    }
}