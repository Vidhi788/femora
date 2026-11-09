package com.femora.backend.cycle;

import com.femora.backend.profile.UserProfile;
import com.femora.backend.profile.UserProfileRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.TreeSet;

@Service
public class CycleService {

    private final UserProfileRepository profiles;
    private final PeriodLogRepository logs;

    public CycleService(UserProfileRepository profiles, PeriodLogRepository logs) {
        this.profiles = profiles;
        this.logs = logs;
    }

    /** Empty when the user has not completed the wellness profile yet. */
    public Optional<CycleSummary> summaryFor(Long userId) {
        Optional<UserProfile> found = profiles.findByUserId(userId);

        if (found.isEmpty() || found.get().getLastPeriodDate() == null) {
            return Optional.empty();
        }

        UserProfile profile = found.get();
        LocalDate today = LocalDate.now();

        // Every known period start: the date from onboarding plus each logged one.
        TreeSet<LocalDate> starts = new TreeSet<>();
        starts.add(LocalDate.parse(String.valueOf(profile.getLastPeriodDate())));
        logs.findByUserIdOrderByStartDateDesc(userId).forEach(log -> starts.add(log.getStartDate()));

        List<LocalDate> ascending = new ArrayList<>(starts);
        LocalDate latest = ascending.stream()
                .filter(date -> !date.isAfter(today))
                .max(LocalDate::compareTo)
                .orElse(ascending.get(0));

        // Learn the average cycle length from the gaps between logged periods.
        List<Integer> gaps = new ArrayList<>();
        for (int i = 1; i < ascending.size(); i++) {
            long gap = ChronoUnit.DAYS.between(ascending.get(i - 1), ascending.get(i));
            if (gap >= 18 && gap <= 60) {
                gaps.add((int) gap);
            }
        }

        Integer cycleLength = profile.getAverageCycleLength();
        if (!gaps.isEmpty()) {
            List<Integer> recent = gaps.subList(Math.max(0, gaps.size() - 6), gaps.size());
            cycleLength = (int) Math.round(recent.stream().mapToInt(Integer::intValue).average().orElse(28));
        }

        List<LocalDate> recentPeriods = new ArrayList<>();
        for (int i = ascending.size() - 1; i >= 0 && recentPeriods.size() < 5; i--) {
            if (!ascending.get(i).isAfter(today)) {
                recentPeriods.add(ascending.get(i));
            }
        }

        return Optional.of(CycleCalculator.calculate(
                latest,
                cycleLength,
                profile.getPeriodDuration(),
                Boolean.TRUE.equals(profile.getRegularCycles()),
                profile.getAge(),
                profile.getHeightCm(),
                profile.getWeightKg(),
                today,
                recentPeriods));
    }
}