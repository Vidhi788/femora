package com.femora.backend.symptom;

import com.femora.backend.cycle.CycleService;
import com.femora.backend.cycle.CycleSummary;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

/**
 * Pregnancy-concern guide. Rules only, no machine learning: a pregnancy test answers
 * the real question, so this checker just says what to do next and when to see a doctor.
 *
 * Tone: calm, factual, no assumptions about her circumstances or what she wants.
 * Test-timing advice follows NHS guidance. The "3 months" rule follows the usual
 * medical advice to see a doctor after three missed periods in a row.
 *
 * Order of steps:
 *   1. red flags     -> urgent care
 *   2. positive test -> see a doctor
 *   3. 3+ months     -> see a doctor
 *   4. "no chance"   -> other causes / nothing pointing to pregnancy
 *   5. otherwise     -> when to test / test again
 */
@Service
public class PregnancyCheckService {

    /** What React sends. chance: YES|NO|NOT_SURE, period: NOT_LATE|LATE|MISSED_MONTHS|NOT_SURE, test: NONE|NEGATIVE|POSITIVE. */
    public record Request(
            Long userId,
            String chance,
            String period,
            String test,
            List<String> redFlags
    ) {
    }

    private enum Status {NOT_LATE, LATE, MISSED, UNKNOWN}

    private static final Set<String> CHANCES = Set.of("YES", "NO", "NOT_SURE");
    private static final Set<String> PERIODS = Set.of("NOT_LATE", "LATE", "MISSED_MONTHS", "NOT_SURE");
    private static final Set<String> TESTS = Set.of("NONE", "NEGATIVE", "POSITIVE");

    // Keep in sync with RED_FLAGS in PregnancyChecker.jsx
    private static final Set<String> RED_FLAGS = Set.of(
            "severe_bleeding", "severe_pelvic_pain", "shoulder_pain",
            "fainting", "chest_pain", "cant_keep_fluids");

    private static final int MISSED_MONTHS_DAYS = 90;
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("d MMM", Locale.ENGLISH);
    private static final String DISCLAIMER = CheckResult.DISCLAIMER;

    private final CycleService cycles;
    private final SymptomCheckHistoryRepository history;

    public PregnancyCheckService(CycleService cycles, SymptomCheckHistoryRepository history) {
        this.cycles = cycles;
        this.history = history;
    }

    public CheckResult check(Request req) {
        if (req.userId() == null) {
            throw new CheckException(400, "userId is required.");
        }

        // 1. Red flags: safety first, before anything else
        List<String> flags = req.redFlags() == null ? List.of() : req.redFlags();
        boolean urgent = flags.stream().anyMatch(f -> f != null && RED_FLAGS.contains(f));
        if (urgent) {
            return finish(req.userId(), "URGENT", "", "");
        }

        // 2. All three answers are needed
        String chance = clean(req.chance());
        String period = clean(req.period());
        String test = clean(req.test());
        if (!CHANCES.contains(chance) || !PERIODS.contains(period) || !TESTS.contains(test)) {
            throw new CheckException(400, "Please answer all the questions.");
        }

        // 3. Cycle log: only used when she is "not sure", and to show where the dates came from.
        //    recentPeriods(0) is the latest REAL logged start (nextPeriodDate is rolled forward
        //    on the dashboard, so it is not used here).
        LocalDate lastStart = null;
        Long daysSince = null;
        Long daysLate = null;

        Optional<CycleSummary> summary = cycles.summaryFor(req.userId());
        if (summary.isPresent()) {
            CycleSummary s = summary.get();
            lastStart = s.recentPeriods().isEmpty() ? s.lastPeriodDate() : s.recentPeriods().get(0);
            if (lastStart != null) {
                daysSince = ChronoUnit.DAYS.between(lastStart, LocalDate.now());
                daysLate = daysSince - s.cycleLength();
            }
        }

        // What she tells us wins over the log. The log is the fallback for "not sure".
        Status status = switch (period) {
            case "NOT_LATE" -> Status.NOT_LATE;
            case "LATE" -> Status.LATE;
            case "MISSED_MONTHS" -> Status.MISSED;
            default -> statusFromLog(daysSince, daysLate);
        };

        String logNote = "";
        boolean lateish = status == Status.LATE || status == Status.MISSED;
        if (lateish && lastStart != null && daysLate != null && daysLate > 0) {
            logNote = " Your cycle log shows your last period started on " + lastStart.format(DAY) + ".";
        }

        boolean possible = !chance.equals("NO");
        Long userId = req.userId();

        // 4. Decide
        if (test.equals("POSITIVE")) {
            return finish(userId, "POSITIVE_TEST", test, logNote);
        }
        if (status == Status.MISSED) {
            return finish(userId, "SEE_DOCTOR", test, logNote);
        }
        if (!possible) {
            return finish(userId, status == Status.LATE ? "OTHER_CAUSES" : "NOT_INDICATED", test, logNote);
        }
        if (test.equals("NEGATIVE")) {
            return finish(userId, status == Status.NOT_LATE ? "TOO_EARLY" : "RETEST", test, logNote);
        }
        return finish(userId, status == Status.LATE ? "TEST_NOW" : "TOO_EARLY", test, logNote);
    }

    private static String clean(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private static Status statusFromLog(Long daysSince, Long daysLate) {
        if (daysSince == null || daysLate == null) {
            return Status.UNKNOWN;
        }
        if (daysSince >= MISSED_MONTHS_DAYS) {
            return Status.MISSED;
        }
        return daysLate > 0 ? Status.LATE : Status.NOT_LATE;
    }

    /**
     * Privacy: history only records THAT a pregnancy check happened (date + category).
     * Neither her answers nor the outcome are stored, because the history list can be read by user id.
     */
    private CheckResult finish(Long userId, String level, String test, String logNote) {
        history.save(new SymptomCheckHistory(userId, "pregnancy", "COMPLETED", null, ""));
        return resultFor(level, test, logNote);
    }

    private CheckResult resultFor(String level, String test, String logNote) {
        return switch (level) {
            case "URGENT" -> new CheckResult(level,
                    "Please seek urgent care",
                    "What you selected can be a sign of something that needs prompt medical attention, "
                            + "and that is true whether or not you are pregnant. Please contact a doctor "
                            + "or go to your nearest emergency department now.",
                    List.of("Call your local emergency number (112 in India) or go to the nearest hospital",
                            "If someone can be with you, ask them to come"),
                    DISCLAIMER, null);

            case "POSITIVE_TEST" -> new CheckResult(level,
                    "Your test is positive",
                    "A positive home test is almost certainly correct. The next step is to see a doctor, "
                            + "who can confirm it and talk through what comes next, including all the options "
                            + "open to you, whatever you decide.",
                    List.of("Book a visit with a doctor or gynaecologist",
                            "Note the date your last period started, since the doctor will ask",
                            "If you take regular medicines, ask the doctor whether they are still right for you",
                            "Get urgent care if you have severe belly pain, heavy bleeding or feel faint"),
                    DISCLAIMER, null);

            case "SEE_DOCTOR" -> new CheckResult(level,
                    "It's worth getting your periods checked",
                    "Going about three months or more without a period is something a doctor should look at, "
                            + "whether or not pregnancy is possible. There are several common and treatable "
                            + "reasons, and a doctor can help find which one applies to you." + logNote,
                    List.of("See a doctor or gynaecologist",
                            "If there is any chance you could be pregnant, a home test is a quick first step",
                            "Our PCOS checker can show whether your answers match that pattern"),
                    DISCLAIMER, null);

            case "OTHER_CAUSES" -> new CheckResult(level,
                    "A late period can have many causes",
                    "Stress, changes in weight, hormonal conditions such as PCOS and changes in contraception "
                            + "can all delay a period. If it stays away, or this keeps happening, a doctor "
                            + "can look into it." + logNote,
                    List.of("Keep logging your periods so you can see your pattern",
                            "Try our PCOS checker if your cycles are often irregular",
                            "See a doctor if your period doesn't come or this keeps happening",
                            "A pregnancy test can rule pregnancy out if you would like to be certain"),
                    DISCLAIMER, null);

            case "NOT_INDICATED" -> new CheckResult(level,
                    "Nothing here points to pregnancy",
                    "Based on your answers, there is nothing to suggest pregnancy right now. "
                            + "If your period is late or something changes, you can check again.",
                    List.of("Keep logging your periods in the cycle tracker",
                            "See a doctor if your periods change a lot or you have symptoms that worry you"),
                    DISCLAIMER, null);

            case "RETEST" -> new CheckResult(level,
                    "Test again in a few days",
                    "A negative result is less reliable than a positive one, especially if the test was "
                            + "taken early or the instructions were not followed exactly. If your period "
                            + "still hasn't come, wait a few days and test again." + logNote,
                    List.of("Wait a few days, then repeat the test following the instructions on the pack",
                            "If the second test is negative and your period still hasn't arrived, see a doctor",
                            "Stress, weight changes and hormonal conditions can also delay periods"),
                    DISCLAIMER, null);

            case "TEST_NOW" -> new CheckResult(level,
                    "A pregnancy test is the next step",
                    "Your period is late and there is a chance you could be pregnant, so a home test is "
                            + "the quickest way to find out. Most tests work from the first day of a "
                            + "missed period." + logNote,
                    List.of("Buy a test from a pharmacy, or ask a clinic for one",
                            "If it is positive, see a doctor to confirm",
                            "If it is negative and your period still hasn't come, wait a few days and test again"),
                    DISCLAIMER, null);

            default -> new CheckResult("TOO_EARLY",
                    test.equals("NEGATIVE") ? "A negative test this early may be wrong" : "It's too early to be sure",
                    test.equals("NEGATIVE")
                            ? "Your period isn't late yet, so a negative test now may be wrong. Test again "
                            + "from the first day of a missed period. If you aren't sure when it is due, "
                            + "test at least 21 days after the last time you could have conceived."
                            : "Your period isn't late yet, or we can't tell if it is. Most tests work from "
                            + "the first day of a missed period, and some very sensitive ones can be used a "
                            + "little earlier. If you aren't sure when your period is due, test at least "
                            + "21 days after the last time you could have conceived.",
                    List.of("Log your next period in the tracker, even if it is late",
                            "Test again from the first day of a missed period",
                            "See a doctor if you have symptoms that worry you"),
                    DISCLAIMER, null);
        };
    }
}