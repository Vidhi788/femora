package com.femora.backend.dashboard;

import com.femora.backend.checkin.CheckInRepository;
import com.femora.backend.checkin.WellnessCheckIn;
import com.femora.backend.cycle.CycleRecord;
import com.femora.backend.cycle.CycleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api" )
@CrossOrigin(origins = "http://localhost:5173" )
public class DashboardActionsController {

    private final CycleRepository cycleRepository;
    private final CheckInRepository checkInRepository;

    public DashboardActionsController(
            CycleRepository cycleRepository,
            CheckInRepository checkInRepository
    ) {
        this.cycleRepository = cycleRepository;
        this.checkInRepository = checkInRepository;
    }

    public record CycleRequest(
            Long userId,
            LocalDate startDate,
            Integer cycleLength
    ) {
    }

    public record CheckInRequest(
            Long userId,
            String mood,
            Integer hydrationCups,
            Double sleepHours
    ) {
    }

    @PostMapping("/cycle/start")
    public ResponseEntity<?> startCycle(
            @RequestBody CycleRequest request
    ) {
        if (request.userId() == null ||
                request.startDate() == null) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            "userId and startDate are required"
                    ));
        }

        int cycleLength = request.cycleLength() == null
                ? 28
                : request.cycleLength();

        CycleRecord cycle = new CycleRecord(
                request.userId(),
                request.startDate(),
                cycleLength
        );

        CycleRecord savedCycle = cycleRepository.save(cycle);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(Map.of(
                        "id", savedCycle.getId(),
                        "message", "Cycle started successfully"
                ));
    }

    @PostMapping("/checkins")
    public ResponseEntity<?> saveCheckIn(
            @RequestBody CheckInRequest request
    ) {
        if (request.userId() == null ||
                request.mood() == null ||
                request.mood().isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            "userId and mood are required"
                    ));
        }

        WellnessCheckIn checkIn = checkInRepository
                .findByUserIdAndDate(
                        request.userId(),
                        LocalDate.now()
                )
                .orElseGet(WellnessCheckIn::new);

        checkIn.setUserId(request.userId());
        checkIn.setDate(LocalDate.now());
        checkIn.setMood(request.mood());
        checkIn.setHydrationCups(request.hydrationCups());
        checkIn.setSleepHours(request.sleepHours());

        checkInRepository.save(checkIn);

        return ResponseEntity.ok(
                Map.of("message", "Today's check-in saved")
        );
    }
}
