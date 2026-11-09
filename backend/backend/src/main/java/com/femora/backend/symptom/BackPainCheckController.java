package com.femora.backend.symptom;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/symptom-check/backpain")
public class BackPainCheckController {

    private final BackPainCheckService service;

    public BackPainCheckController(BackPainCheckService service) {
        this.service = service;
    }

    /** POST /api/symptom-check/backpain */
    @PostMapping
    public ResponseEntity<?> check(@RequestBody BackPainCheckService.Request request) {
        try {
            return ResponseEntity.ok(service.check(request));
        } catch (BackPainCheckService.BadInputException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}