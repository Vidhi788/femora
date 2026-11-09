package com.femora.backend.cycle;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/cycle")
public class PeriodLogController {

    public record LogRequest(Long userId, LocalDate startDate) {
    }

    private final PeriodLogRepository logs;
    private final CycleService cycleService;

    public PeriodLogController(PeriodLogRepository logs, CycleService cycleService) {
        this.logs = logs;
        this.cycleService = cycleService;
    }

    /** Saves a new period start date and returns the freshly calculated summary. */
    @PostMapping("/log")
    public ResponseEntity<?> log(@RequestBody LogRequest request) {
        if (request.userId() == null || request.startDate() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please choose a date."));
        }

        LocalDate today = LocalDate.now();

        if (request.startDate().isAfter(today)) {
            return ResponseEntity.badRequest().body(Map.of("message", "The date cannot be in the future."));
        }

        if (request.startDate().isBefore(today.minusYears(1))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please choose a date within the last year."));
        }

        if (cycleService.summaryFor(request.userId()).isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Profile not found"));
        }

        if (!logs.existsByUserIdAndStartDate(request.userId(), request.startDate())) {
            logs.save(new PeriodLog(request.userId(), request.startDate()));
        }

        return ResponseEntity.ok(cycleService.summaryFor(request.userId()).orElseThrow());
    }
}