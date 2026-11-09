package com.femora.backend.cycle;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/cycle")
public class CycleSummaryController {

    private final CycleService cycleService;

    public CycleSummaryController(CycleService cycleService) {
        this.cycleService = cycleService;
    }

    @GetMapping("/summary")
    public ResponseEntity<?> summary(@RequestParam Long userId) {
        return cycleService.summaryFor(userId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("message", "Profile not found")));
    }
}