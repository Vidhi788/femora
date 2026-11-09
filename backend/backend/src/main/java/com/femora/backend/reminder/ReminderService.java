package com.femora.backend.reminder;

import com.femora.backend.reminder.ReminderSender.Recipient;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Sends "your period is expected in N days" reminders and builds the calendar file.
 *
 * Runs once a day (default 9:00 AM India time). The next period date is worked out from the
 * latest logged period (or the profile's last period date) plus the average cycle length,
 * using the same tables the dashboard already uses: users, user_profiles and period_logs.
 */
@Service
public class ReminderService {

    private static final Logger log = LoggerFactory.getLogger(ReminderService.class);

    private static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");
    private static final int DEFAULT_CYCLE_DAYS = 28;
    /** Stop reminding if the user has not logged a period for this many cycles. */
    private static final int MAX_STALE_CYCLES = 6;

    private final ReminderSettingsRepository repo;
    private final JdbcTemplate jdbc;
    private final List<ReminderSender> senders;
    private final int daysBefore;
    private final int calendarCycles;
    private final boolean calendarDiscreet;

    public ReminderService(ReminderSettingsRepository repo,
                           JdbcTemplate jdbc,
                           List<ReminderSender> senders,
                           @Value("${femora.reminder.days-before:2}") int daysBefore,
                           @Value("${femora.reminder.calendar-cycles:3}") int calendarCycles,
                           @Value("${femora.reminder.calendar-discreet:true}") boolean calendarDiscreet) {
        this.repo = repo;
        this.jdbc = jdbc;
        this.senders = senders;
        this.daysBefore = daysBefore;
        this.calendarCycles = calendarCycles;
        this.calendarDiscreet = calendarDiscreet;
    }

    private record Person(String email, String name, LocalDate nextPeriod, int cycleDays) {}

    // --------------------------------------------------
    // DAILY JOB
    // --------------------------------------------------

    @Scheduled(cron = "${femora.reminder.cron:0 0 9 * * *}", zone = "Asia/Kolkata")
    public void sendDueReminders() {
        LocalDate today = LocalDate.now(ZONE);
        int sent = 0;

        for (ReminderSettings settings : repo.findByEnabledTrue()) {
            try {
                if (processOne(settings, today)) {
                    sent++;
                }
            } catch (Exception e) {
                log.warn("Reminder failed for user {}: {}", settings.getUserId(), e.getMessage());
            }
        }

        log.info("Reminder job finished: {} reminder(s) sent.", sent);
    }

    private boolean processOne(ReminderSettings settings, LocalDate today) throws Exception {
        Person person = loadPerson(settings.getUserId(), today);
        if (person == null) {
            return false;
        }

        // Only remind exactly N days before, and only once per predicted date.
        if (!today.plusDays(daysBefore).equals(person.nextPeriod())) {
            return false;
        }
        if (person.nextPeriod().equals(settings.getLastReminderForDate())) {
            return false;
        }

        deliver(settings, person.email(), person.name(), reminderText(person),
                calendarFor(settings.getUserId(), person, today));

        settings.setLastReminderForDate(person.nextPeriod());
        repo.save(settings);
        return true;
    }

    // --------------------------------------------------
    // CALENDAR FILE
    // --------------------------------------------------

    /** The .ics file the user downloads from Settings. */
    public byte[] calendarFor(Long userId) {
        LocalDate today = LocalDate.now(ZONE);
        Person person = loadPerson(userId, today);

        if (person == null) {
            throw new IllegalStateException(
                    "We need your profile and a logged period before we can predict your next one.");
        }
        return calendarFor(userId, person, today);
    }

    private byte[] calendarFor(Long userId, Person person, LocalDate today) {
        return CalendarFileBuilder.build(userId, today, person.nextPeriod(), person.cycleDays(),
                daysBefore, calendarCycles, calendarDiscreet);
    }

    // --------------------------------------------------
    // TEST BUTTON
    // --------------------------------------------------

    /** Sends a test message right now. Returns the channel that was actually used. */
    public String sendTest(Long userId) throws Exception {
        ReminderSettings settings = repo.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException(
                        "Save your reminder settings first, then send a test."));

        Map<String, Object> user;
        try {
            user = jdbc.queryForMap("SELECT email, name FROM users WHERE id = ?", userId);
        } catch (Exception e) {
            throw new IllegalStateException("Account not found.");
        }

        LocalDate today = LocalDate.now(ZONE);
        Person person = loadPerson(userId, today);
        byte[] calendar = person == null ? null : calendarFor(userId, person, today);

        String name = (String) user.get("name");
        String message = "Hi " + firstName(name) + ", this is a test reminder from Femora. "
                + "Your real reminders will arrive " + daysBefore
                + (daysBefore == 1 ? " day" : " days") + " before your expected period. - Femora";

        ReminderSettings.Channel used =
                deliver(settings, (String) user.get("email"), name, message, calendar);

        return used.name().toLowerCase(Locale.ENGLISH);
    }

    // --------------------------------------------------
    // DELIVERY
    // --------------------------------------------------

    private ReminderSettings.Channel deliver(ReminderSettings settings, String email, String name,
                                             String message, byte[] calendar) throws Exception {
        Recipient to = new Recipient(email, name, settings.getPhoneNumber());
        ReminderSettings.Channel wanted = settings.getChannel();

        try {
            senderFor(wanted).send(wanted, to, message, calendar);
            return wanted;
        } catch (Exception e) {
            if (wanted == ReminderSettings.Channel.EMAIL) {
                throw e;
            }
            log.warn("{} reminder failed ({}). Falling back to email.", wanted, e.getMessage());
            senderFor(ReminderSettings.Channel.EMAIL)
                    .send(ReminderSettings.Channel.EMAIL, to, message, calendar);
            return ReminderSettings.Channel.EMAIL;
        }
    }

    private ReminderSender senderFor(ReminderSettings.Channel channel) {
        return senders.stream()
                .filter(sender -> sender.supports(channel))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No sender for " + channel));
    }

    // --------------------------------------------------
    // PREDICTION
    // --------------------------------------------------

    private Person loadPerson(Long userId, LocalDate today) {
        String sql = """
                SELECT u.email, u.name, p.average_cycle_length,
                       COALESCE((SELECT MAX(l.start_date) FROM period_logs l WHERE l.user_id = u.id),
                                p.last_period_date) AS last_start
                FROM users u
                JOIN user_profiles p ON p.user_id = u.id
                WHERE u.id = ?
                """;

        return jdbc.query(sql, (ResultSetExtractor<Person>) rs -> {
            if (!rs.next()) {
                return null;
            }

            java.sql.Date lastStart = rs.getDate("last_start");
            if (lastStart == null) {
                return null;
            }

            int cycle = rs.getInt("average_cycle_length");
            if (rs.wasNull() || cycle < 15) {
                cycle = DEFAULT_CYCLE_DAYS;
            }

            LocalDate last = lastStart.toLocalDate();
            if (last.plusDays((long) cycle * MAX_STALE_CYCLES).isBefore(today)) {
                return null;
            }

            LocalDate next = last.plusDays(cycle);
            while (next.isBefore(today)) {
                next = next.plusDays(cycle);
            }

            return new Person(rs.getString("email"), rs.getString("name"), next, cycle);
        }, userId);
    }

    // --------------------------------------------------
    // TEXT
    // --------------------------------------------------

    private String reminderText(Person person) {
        String date = person.nextPeriod()
                .format(DateTimeFormatter.ofPattern("EEE, d MMM", Locale.ENGLISH));

        return "Hi " + firstName(person.name()) + ", your period is expected in " + daysBefore
                + (daysBefore == 1 ? " day" : " days") + " (" + date + "). "
                + "Keep supplies handy and stay hydrated. - Femora";
    }

    private static String firstName(String name) {
        if (name == null || name.isBlank()) {
            return "there";
        }
        return name.trim().split("\\s+")[0];
    }
}