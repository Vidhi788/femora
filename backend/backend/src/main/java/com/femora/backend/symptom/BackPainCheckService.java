package com.femora.backend.symptom;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

/**
 * Back pain checker. Rules only, no ML (the public back-pain dataset holds X-ray measurements
 * that a user cannot enter). Order of steps:
 *   1. red flags  -> "seek urgent care"
 *   2. answers    -> all three questions must be answered
 *   3. rules      -> SEE_DOCTOR / PERIOD_RELATED / SELF_CARE
 * Only the level is saved to history. Check the wording against current NHS / ACOG guidance.
 */
@Service
public class BackPainCheckService {

    public record Request(
            Long userId,
            String duration,        // SHORT (< 2 weeks), MEDIUM (2-6 weeks), LONG (> 6 weeks)
            String spread,          // BACK_ONLY or BELOW_KNEE (pain or tingling below the knee)
            Boolean withPeriod,     // gets worse around her period
            List<String> redFlags
    ) {
    }

    public static class BadInputException extends RuntimeException {
        public BadInputException(String message) {
            super(message);
        }
    }

    private static final Set<String> RED_FLAGS =
            Set.of("saddle_numbness", "bladder_bowel", "leg_weakness", "fever", "injury");
    private static final Set<String> DURATIONS = Set.of("SHORT", "MEDIUM", "LONG");
    private static final Set<String> SPREADS = Set.of("BACK_ONLY", "BELOW_KNEE");

    private final SymptomCheckHistoryRepository history;

    public BackPainCheckService(SymptomCheckHistoryRepository history) {
        this.history = history;
    }

    public CheckResult check(Request req) {
        if (req.userId() == null) {
            throw new BadInputException("userId is required.");
        }

        // 1. Red flags first
        List<String> flags = req.redFlags() == null ? List.of() : req.redFlags();
        if (flags.stream().anyMatch(f -> f != null && RED_FLAGS.contains(f))) {
            return finish(req.userId(), "URGENT", urgent());
        }

        // 2. Answers
        if (!DURATIONS.contains(req.duration()) || !SPREADS.contains(req.spread()) || req.withPeriod() == null) {
            throw new BadInputException("Please answer all the questions.");
        }

        // 3. Rules
        if ("LONG".equals(req.duration()) || "BELOW_KNEE".equals(req.spread())) {
            return finish(req.userId(), "SEE_DOCTOR", seeDoctor());
        }
        if (req.withPeriod()) {
            return finish(req.userId(), "PERIOD_RELATED", periodRelated());
        }
        return finish(req.userId(), "SELF_CARE", selfCare());
    }

    private CheckResult finish(Long userId, String level, CheckResult result) {
        history.save(new SymptomCheckHistory(userId, "backpain", level, null, null));
        return result;
    }

    private CheckResult urgent() {
        return new CheckResult("URGENT", "Please seek urgent care",
                "What you selected can be a sign of a problem that needs prompt medical attention. "
                        + "Please contact a doctor or go to your nearest emergency department now.",
                List.of("Call your local emergency number (112 in India) or go to the nearest hospital",
                        "If someone can be with you, ask them to come"),
                CheckResult.DISCLAIMER, null);
    }

    private CheckResult seeDoctor() {
        return new CheckResult("SEE_DOCTOR", "It's a good idea to see a doctor",
                "Back pain that lasts more than 6 weeks, or pain or tingling that travels below the knee, "
                        + "should be looked at by a doctor. This is not a diagnosis, and it is often treatable.",
                List.of("Book a visit with a doctor or a physiotherapist",
                        "Note when it started, what makes it better or worse, and any tingling or weakness",
                        "Seek urgent care if you get numbness around the groin, trouble controlling your bladder "
                                + "or bowels, or new leg weakness"),
                CheckResult.DISCLAIMER, null);
    }

    private CheckResult periodRelated() {
        return new CheckResult("PERIOD_RELATED", "Your back pain may be linked to your period",
                "Lower back pain around a period is common and often comes from the same cramping as period pain. "
                        + "If it is severe, stops you doing normal things, or keeps getting worse, it is worth "
                        + "seeing a doctor.",
                List.of("Heat on your lower back or belly can help",
                        "Gentle movement and stretching often ease it. Try our period pain yoga",
                        "Log your periods and note the pain, so you can show a doctor the pattern",
                        "See a doctor if it is severe or getting worse"),
                CheckResult.DISCLAIMER, null);
    }

    private CheckResult selfCare() {
        return new CheckResult("SELF_CARE", "This looks like common back pain",
                "Most back pain from muscles or posture eases within a few weeks. Staying gently active usually "
                        + "helps more than resting in bed. This is not a diagnosis.",
                List.of("Use heat on the sore area for about 15 to 20 minutes at a time",
                        "Keep moving with short walks and gentle stretches",
                        "Change position often, and avoid sitting for long stretches",
                        "Ask a pharmacist before taking any pain relief",
                        "See a doctor if it isn't improving in 2 weeks or gets worse"),
                CheckResult.DISCLAIMER, null);
    }
}