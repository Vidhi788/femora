package com.femora.backend.cycle;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;

/** Pure date math: no database, easy to unit test with JUnit. */
public final class CycleCalculator {

    private CycleCalculator() {
    }

    public static CycleSummary calculate(
            LocalDate lastPeriod,
            Integer averageCycleLength,
            Integer periodDurationDays,
            boolean regularCycles,
            Integer age,
            Double heightCm,
            Double weightKg,
            LocalDate today,
            List<LocalDate> recentPeriods) {

        int cycleLength = clamp(averageCycleLength == null ? 28 : averageCycleLength, 21, 45);
        int periodDuration = clamp(periodDurationDays == null ? 5 : periodDurationDays, 2, 10);

        long daysSince = Math.max(0, ChronoUnit.DAYS.between(lastPeriod, today));
        long cyclesPassed = daysSince / cycleLength;
        int cycleDay = (int) (daysSince % cycleLength) + 1;

        // Start of the cycle we are in right now (projected forward if the user has not logged a newer period).
        LocalDate cycleStart = lastPeriod.plusDays(cyclesPassed * cycleLength);
        LocalDate nextPeriod = cycleStart.plusDays(cycleLength);

        // Luteal phase is about 14 days, so ovulation is roughly 14 days before the next period.
        int ovulationDay = Math.max(cycleLength - 14, periodDuration + 2);
        int fertileStartDay = Math.max(1, ovulationDay - 5);
        int fertileEndDay = ovulationDay + 1;

        String phase;
        if (cycleDay <= periodDuration) {
            phase = "Menstrual";
        } else if (cycleDay < ovulationDay) {
            phase = "Follicular";
        } else if (cycleDay <= ovulationDay + 2) {
            phase = "Ovulation";
        } else {
            phase = "Luteal";
        }

        boolean inFertileWindow = cycleDay >= fertileStartDay && cycleDay <= fertileEndDay;

        int daysToFertile;
        if (inFertileWindow) {
            daysToFertile = 0;
        } else if (cycleDay < fertileStartDay) {
            daysToFertile = fertileStartDay - cycleDay;
        } else {
            daysToFertile = (cycleLength - cycleDay) + fertileStartDay;
        }

        // After this cycle's window has passed, show the dates for the next cycle.
        int shift = cycleDay > fertileEndDay ? cycleLength : 0;
        LocalDate ovulationDate = cycleStart.plusDays(ovulationDay - 1L + shift);
        LocalDate fertileStart = cycleStart.plusDays(fertileStartDay - 1L + shift);
        LocalDate fertileEnd = cycleStart.plusDays(fertileEndDay - 1L + shift);

        Double bmi = null;
        if (heightCm != null && weightKg != null && heightCm > 0 && weightKg > 0) {
            double meters = heightCm / 100.0;
            bmi = Math.round(weightKg / (meters * meters) * 10.0) / 10.0;
        }

        // Reminders shown in the app: no push service needed.
        int daysToNext = (int) ChronoUnit.DAYS.between(today, nextPeriod);
        String reminderType = null;
        String reminderMessage = null;

        if (daysSince >= cycleLength) {
            reminderType = "log";
            reminderMessage = "Your period may have started. Log it to keep your predictions accurate.";
        } else if (daysToNext <= 3) {
            reminderType = "period";
            reminderMessage = "Your period is expected in " + daysToNext + (daysToNext == 1 ? " day." : " days.");
        } else if (inFertileWindow) {
            reminderType = "fertile";
            reminderMessage = "Your fertile window is open until "
                    + fertileEnd.format(DateTimeFormatter.ofPattern("d MMM", Locale.ENGLISH)) + ".";
        } else if (daysToFertile <= 2) {
            reminderType = "fertile";
            reminderMessage = "Your fertile window starts in " + daysToFertile
                    + (daysToFertile == 1 ? " day." : " days.");
        }

        return new CycleSummary(
                lastPeriod,
                cycleLength,
                periodDuration,
                cycleDay,
                phase,
                nextPeriod,
                (int) ChronoUnit.DAYS.between(today, nextPeriod),
                ovulationDate,
                fertileStart,
                fertileEnd,
                daysToFertile,
                inFertileWindow,
                daysSince >= cycleLength,
                regularCycles,
                age,
                bmi,
                heightCm,
                weightKg,
                recentPeriods,
                reminderType,
                reminderMessage);
    }

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }
}