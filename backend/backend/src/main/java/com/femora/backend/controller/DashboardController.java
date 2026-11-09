package com.femora.backend.dashboard;

import com.femora.backend.checkin.CheckInRepository;
import com.femora.backend.checkin.WellnessCheckIn;
import com.femora.backend.cycle.CycleRecord;
import com.femora.backend.cycle.CycleRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard" )
@CrossOrigin(origins = "http://localhost:5173" )
public class DashboardController {

    private final CycleRepository cycleRepository;
    private final CheckInRepository checkInRepository;

    public DashboardController(
            CycleRepository cycleRepository,
            CheckInRepository checkInRepository
    ) {
        this.cycleRepository = cycleRepository;
        this.checkInRepository = checkInRepository;
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getDashboardSummary(
            @RequestParam Long userId
    ) {
        CycleRecord cycle = cycleRepository
                .findTopByUserIdOrderByStartDateDesc(userId)
                .orElse(null);

        WellnessCheckIn todayCheckIn = checkInRepository
                .findByUserIdAndDate(userId, LocalDate.now())
                .orElse(null);

        int cycleLength = cycle == null
                ? 28
                : cycle.getCycleLength();

        int cycleDay = 1;

        if (cycle != null) {
            long daysPassed = ChronoUnit.DAYS.between(
                    cycle.getStartDate(),
                    LocalDate.now()
            );

            cycleDay = (int) (daysPassed % cycleLength) + 1;
        }

        int nextPeriodInDays = cycle == null
                ? 28
                : Math.max(cycleLength - cycleDay, 0);

        int fertileWindowInDays = Math.max(1, 16 - cycleDay);

        String phase = calculatePhase(cycleDay);

        int hydrationCups = 0;
        double sleepHours = 0;
        String mood = "";

        if (todayCheckIn != null) {
            if (todayCheckIn.getHydrationCups() != null) {
                hydrationCups = todayCheckIn.getHydrationCups();
            }

            if (todayCheckIn.getSleepHours() != null) {
                sleepHours = todayCheckIn.getSleepHours();
            }

            if (todayCheckIn.getMood() != null) {
                mood = todayCheckIn.getMood();
            }
        }

        Map<String, Object> response = Map.of(
                "cycleDay", cycleDay,
                "cycleLength", cycleLength,
                "phase", phase,
                "nextPeriodInDays", nextPeriodInDays,
                "fertileWindowInDays", fertileWindowInDays,
                "hydrationCups", hydrationCups,
                "sleepHours", sleepHours,
                "mood", mood
        );

        return ResponseEntity.ok(response);
    }

    private String calculatePhase(int cycleDay) {
        if (cycleDay <= 5) {
            return "Menstrual";
        }

        if (cycleDay <= 13) {
            return "Follicular";
        }

        if (cycleDay <= 16) {
            return "Ovulation";
        }

        return "Luteal";
    }
}
