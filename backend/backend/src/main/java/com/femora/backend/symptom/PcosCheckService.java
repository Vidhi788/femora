package com.femora.backend.symptom;

import com.femora.backend.profile.UserProfile;
import com.femora.backend.profile.UserProfileRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * PCOS checker logic. The ORDER of the steps is the safety design:
 *   1. red flags  -> "seek urgent care", the model is never called
 *   2. profile    -> needs age, height, weight
 *   3. age range  -> the model only learned from women aged 20-48
 *   4. model      -> score from the FastAPI service
 *   5. band       -> LOWER / POSSIBLE / HIGHER (we never show a percentage)
 * Every outcome is saved to history.
 */
@Service
public class PcosCheckService {

    /**
     * What React sends. userId is needed because login does not issue tokens yet.
     * Yes/no answers are Boolean (not boolean) so a missing answer simply means "no".
     */

    public record Request(
            Long userId,
            Boolean irregularCycle,   // optional: if missing, the profile's "regular cycles" answer is used
            Boolean weightGain,
            Boolean hairGrowth,
            Boolean skinDarkening,
            Boolean hairLoss,
            Boolean pimples,
            List<String> redFlags     // e.g. ["chest_pain"]
    ) {
    }

    // Model was trained on women aged 20-48 (keep in sync with ml-services/pcos-service/main.py)
    private static final int MIN_AGE = 20;
    private static final int MAX_AGE = 48;

    // Score bands, chosen from the training results: at 0.30 the model catches ~82% of PCOS cases
    private static final double POSSIBLE_FROM = 0.30;
    private static final double HIGHER_FROM = 0.60;

    private static final Set<String> RED_FLAGS =
            Set.of("severe_bleeding", "chest_pain", "fainting", "severe_pelvic_pain");

    private static final String DISCLAIMER = CheckResult.DISCLAIMER;

    private final UserProfileRepository profiles;
    private final SymptomCheckHistoryRepository history;
    private final PcosMlClient ml;

    public PcosCheckService(UserProfileRepository profiles,
                            SymptomCheckHistoryRepository history,
                            PcosMlClient ml) {
        this.profiles = profiles;
        this.history = history;
        this.ml = ml;
    }

    public CheckResult check(Request req) {
        if (req.userId() == null) {
            throw new CheckException(400, "userId is required.");
        }

        // 1. Red flags: safety first, before anything else
        List<String> flags = req.redFlags() == null ? List.of() : req.redFlags();
        List<String> matchedFlags = flags.stream()
                .filter(f -> f != null && RED_FLAGS.contains(f))
                .toList();
        if (!matchedFlags.isEmpty()) {
            return finish(req.userId(), "URGENT", null, String.join(",", matchedFlags));
        }

        // 2. Profile gives us age, height and weight
        UserProfile profile = profiles.findByUserId(req.userId())
                .orElseThrow(() -> new CheckException(404,
                        "Profile not found. Please complete your profile first."));

        Integer age = profile.getAge();
        Double height = profile.getHeightCm();
        Double weight = profile.getWeightKg();

        if (age == null || height == null || weight == null) {
            throw new CheckException(400,
                    "Please add your age, height and weight to your profile first.");
        }
        if (height < 100 || height > 220 || weight < 25 || weight > 200) {
            throw new CheckException(400,
                    "Your height or weight in your profile looks wrong. Please update it and try again.");
        }

        boolean irregular = req.irregularCycle() != null
                ? req.irregularCycle()
                : Boolean.FALSE.equals(profile.getRegularCycles());

        List<String> yes = new ArrayList<>();
        if (irregular) yes.add("irregular_cycle");
        if (isYes(req.weightGain())) yes.add("weight_gain");
        if (isYes(req.hairGrowth())) yes.add("hair_growth");
        if (isYes(req.skinDarkening())) yes.add("skin_darkening");
        if (isYes(req.hairLoss())) yes.add("hair_loss");
        if (isYes(req.pimples())) yes.add("pimples");
        String answers = String.join(",", yes);

        // 3. Age range: don't guess outside what the model has seen
        if (age < MIN_AGE || age > MAX_AGE) {
            return finish(req.userId(), "OUT_OF_RANGE", null, answers);
        }

        // 4. Ask the model (keys must match ml-services/pcos-service/main.py)
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("age", age);
        payload.put("height_cm", height);
        payload.put("weight_kg", weight);
        payload.put("irregular_cycle", irregular);
        payload.put("weight_gain", isYes(req.weightGain()));
        payload.put("hair_growth", isYes(req.hairGrowth()));
        payload.put("skin_darkening", isYes(req.skinDarkening()));
        payload.put("hair_loss", isYes(req.hairLoss()));
        payload.put("pimples", isYes(req.pimples()));

        double score = ml.predict(payload);

        // 5. Turn the score into a band
        String level = score >= HIGHER_FROM ? "HIGHER"
                : score >= POSSIBLE_FROM ? "POSSIBLE"
                : "LOWER";

        return finish(req.userId(), level, Math.round(score * 100) / 100.0, answers);
    }

    /** A missing (null) answer counts as "no". */
    private static boolean isYes(Boolean answer) {
        return Boolean.TRUE.equals(answer);
    }

    /** Saves the outcome to history, then builds the response. */
    private CheckResult finish(Long userId, String level, Double score, String answers) {
        history.save(new SymptomCheckHistory(userId, "pcos", level, score, answers));
        return resultFor(level, score);
    }

    private CheckResult resultFor(String level, Double score) {
        return switch (level) {
            case "URGENT" -> new CheckResult(level,
                    "Please seek urgent care",
                    "What you selected can be a sign of something that needs prompt medical attention. "
                            + "Please don't wait for a prediction. Contact a doctor or go to your nearest "
                            + "emergency department now.",
                    List.of("Call your local emergency number (112 in India) or go to the nearest hospital",
                            "If someone can be with you, ask them to come"),
                    DISCLAIMER, null);

            case "OUT_OF_RANGE" -> new CheckResult(level,
                    "This checker isn't built for your age",
                    "This checker learned from women aged " + MIN_AGE + " to " + MAX_AGE
                            + ", so it can't give a reliable result for your age. "
                            + "If you're worried about your periods or other symptoms, a doctor can help.",
                    List.of("Talk to a doctor or gynaecologist about your symptoms",
                            "Browse our articles for your life stage"),
                    DISCLAIMER, null);

            case "HIGHER" -> new CheckResult(level,
                    "Your answers closely match the PCOS pattern",
                    "Several of your answers are commonly seen together in PCOS. This is not a diagnosis. "
                            + "Only a doctor can confirm it, with an examination and tests. "
                            + "It's a good idea to get checked.",
                    List.of("Book a visit with a gynaecologist",
                            "A doctor may suggest a pelvic ultrasound and blood tests "
                                    + "(hormones, thyroid, blood sugar)",
                            "Bring your cycle log from the tracker"),
                    DISCLAIMER, score);

            case "POSSIBLE" -> new CheckResult(level,
                    "Some of your answers match the PCOS pattern",
                    "A few of your answers are commonly seen in PCOS, but the picture isn't clear. "
                            + "Many other things can cause the same signs, so this is not a conclusion "
                            + "about you. A doctor can look into it properly.",
                    List.of("Consider booking a visit with a gynaecologist",
                            "A doctor may suggest a pelvic ultrasound and blood tests "
                                    + "(hormones, thyroid, blood sugar)",
                            "Keep logging your periods so you can show your cycle pattern"),
                    DISCLAIMER, score);

            default -> new CheckResult("LOWER",
                    "Your answers don't strongly match the PCOS pattern",
                    "Based on what you shared, your answers don't strongly match the pattern often seen "
                            + "in PCOS. This doesn't rule it out, because only a doctor can check for it "
                            + "properly. If your symptoms continue or worry you, it's worth a visit.",
                    List.of("Keep logging your periods in the cycle tracker",
                            "See a doctor if your cycles stay irregular or your symptoms continue"),
                    DISCLAIMER, score);
        };
    }
}