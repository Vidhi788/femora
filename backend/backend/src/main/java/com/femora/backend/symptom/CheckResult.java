package com.femora.backend.symptom;

import java.util.List;

/** What every symptom checker returns to React, so one result screen shape fits them all. */
public record CheckResult(
        String level,             // checker-specific code, e.g. URGENT, HIGHER, TEST_NOW
        String title,
        String message,
        List<String> nextSteps,
        String disclaimer,
        Double score              // only the ML checkers fill this; never show it as a percentage
) {

    public static final String DISCLAIMER = "Not a medical diagnosis — consult a doctor.";
}