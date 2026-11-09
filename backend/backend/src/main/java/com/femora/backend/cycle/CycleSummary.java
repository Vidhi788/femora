package com.femora.backend.cycle;

import java.time.LocalDate;
import java.util.List;

/** Everything the dashboard needs, calculated from the profile and the logged periods. */
public record CycleSummary(
        LocalDate lastPeriodDate,
        int cycleLength,
        int periodDuration,
        int cycleDay,
        String phase,
        LocalDate nextPeriodDate,
        int daysToNextPeriod,
        LocalDate ovulationDate,
        LocalDate fertileStartDate,
        LocalDate fertileEndDate,
        int daysToFertileWindow,
        boolean inFertileWindow,
        boolean lastPeriodStale,
        boolean regularCycles,
        Integer age,
        Double bmi,
        Double heightCm,
        Double weightKg,
        List<LocalDate> recentPeriods,
        String reminderType,
        String reminderMessage
) {
}