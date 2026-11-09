package com.femora.backend.symptom;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * General symptom checker. Order of steps (safety first):
 *   1. red flags      -> "seek urgent care", the model is never used for the answer
 *   2. input checks   -> at least 2 DIFFERENT symptoms, all known
 *   3. model          -> scores per condition group from the FastAPI service
 *   4. band           -> CLOSE_MATCH / POSSIBLE / UNCLEAR (never a percentage)
 * The history stores only that a check happened and its level, not the symptoms.
 */
@Service
public class GeneralCheckService {

    public record Request(Long userId, List<String> symptoms, List<String> redFlags) {
    }

    /** A problem the user can fix. The controller turns it into HTTP 400 with the message. */
    public static class BadInputException extends RuntimeException {
        public BadInputException(String message) {
            super(message);
        }
    }

    // Chosen from the Random Forest calibration table: >=0.70 was right ~99% of the time,
    // 0.50-0.70 about 88%, below 0.50 only about half. Keep in sync with train_general.py output.
    private static final double CLOSE_FROM = 0.70;
    private static final double POSSIBLE_FROM = 0.50;
    private static final double SHOW_ALSO_FROM = 0.10;

    // Ticked on the safety step of the screen
    private static final Set<String> RED_FLAGS =
            Set.of("chest_pain", "trouble_breathing", "fainting", "severe_bleeding", "sudden_weakness", "confusion");

    // Symptoms from the picker that also skip the model. VERIFY these names against general_symptoms.pkl.
    private static final Set<String> RED_SYMPTOMS = Set.of(
            "chest_pain", "breathlessness", "coma", "weakness_of_one_body_side",
            "altered_sensorium", "slurred_speech", "blood_in_sputum", "stomach_bleeding", "bloody_stool");

    // Conditions that must never be shown as a plain name without "see a doctor promptly"
    private static final Set<String> SERIOUS = Set.of("Heart attack", "Paralysis (brain hemorrhage)", "AIDS");

    private final GeneralMlClient ml;
    private final SymptomCheckHistoryRepository history;

    public GeneralCheckService(GeneralMlClient ml, SymptomCheckHistoryRepository history) {
        this.ml = ml;
        this.history = history;
    }

    public CheckResult check(Request req) {
        if (req.userId() == null) {
            throw new BadInputException("userId is required.");
        }
        List<String> symptoms = req.symptoms() == null ? List.of() : req.symptoms().stream()
                .filter(s -> s != null && !s.isBlank()).map(s -> s.trim().toLowerCase()).distinct().toList();
        List<String> flags = req.redFlags() == null ? List.of() : req.redFlags();

        // 1. Red flags
        boolean urgent = flags.stream().anyMatch(f -> f != null && RED_FLAGS.contains(f))
                || symptoms.stream().anyMatch(RED_SYMPTOMS::contains);
        if (urgent) {
            return finish(req.userId(), "URGENT", null, urgentResult());
        }

        // 2. Input checks
        if (symptoms.size() < 2) {
            throw new BadInputException("Please pick at least 2 symptoms. More detail gives a more useful result.");
        }

        // 3. Model
        GeneralMlClient.Prediction p = ml.predict(symptoms);
        if (!p.unknown().isEmpty()) {
            throw new BadInputException("Some symptoms were not recognised. Please pick them from the list.");
        }
        if (p.distinct() < 2) {
            throw new BadInputException("Those symptoms always appear together, so they count as one. "
                    + "Please add a different symptom.");
        }

        // 4. Band
        double top = p.top().get(0).probability();
        if (top < POSSIBLE_FROM) {
            return finish(req.userId(), "UNCLEAR", null, unclearResult());
        }

        List<String> shown = new ArrayList<>();
        shown.add(p.top().get(0).name());
        for (int i = 1; i < p.top().size(); i++) {
            if (p.top().get(i).probability() >= SHOW_ALSO_FROM) shown.add(p.top().get(i).name());
        }
        boolean serious = shown.stream().anyMatch(SERIOUS::contains);
        String level = top >= CLOSE_FROM ? "CLOSE_MATCH" : "POSSIBLE";

        return finish(req.userId(), level, top, matchResult(level, shown, serious, top));
    }

    private CheckResult finish(Long userId, String level, Double score, CheckResult result) {
        history.save(new SymptomCheckHistory(userId, "general", level, null, null));
        return result;
    }

    private CheckResult matchResult(String level, List<String> shown, boolean serious, double score) {
        String names = String.join(", ", shown);
        List<String> steps = new ArrayList<>();
        if (serious) {
            steps.add("See a doctor promptly. Some conditions on this list can be serious.");
        }
        steps.add("Talk to a doctor about these symptoms, especially if they last or get worse");
        steps.add("Note when the symptoms started and anything that makes them better or worse");

        if ("CLOSE_MATCH".equals(level)) {
            return new CheckResult(level, "Your symptoms are most often seen with: " + names,
                    "Many conditions share the same symptoms, so this is not a diagnosis. "
                            + "Only a doctor can tell what is going on, with an examination and tests.",
                    steps, CheckResult.DISCLAIMER, score);
        }
        return new CheckResult(level, "Several conditions could fit",
                "Your symptoms could match: " + names + ". The picture isn't clear, and many other things "
                        + "can cause the same symptoms. This is not a conclusion about you.",
                steps, CheckResult.DISCLAIMER, score);
    }

    private CheckResult unclearResult() {
        return new CheckResult("UNCLEAR", "We can't tell from these symptoms",
                "These symptoms don't point clearly to one condition, so we won't guess. "
                        + "Adding more symptoms may help, or a doctor can look at it properly.",
                List.of("Try again with any other symptoms you have",
                        "See a doctor if the symptoms continue or worry you"),
                CheckResult.DISCLAIMER, null);
    }

    private CheckResult urgentResult() {
        return new CheckResult("URGENT", "Please seek urgent care",
                "What you selected can be a sign of something that needs prompt medical attention. "
                        + "Please don't wait for a prediction. Contact a doctor or go to your nearest "
                        + "emergency department now.",
                List.of("Call your local emergency number (112 in India) or go to the nearest hospital",
                        "If someone can be with you, ask them to come"),
                CheckResult.DISCLAIMER, null);
    }
}