package com.femora.backend.symptom;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/symptom-check/general")
public class GeneralCheckController {

    private static final String UNAVAILABLE =
            "The symptom checker is temporarily unavailable. Please try again in a moment.";

    private final GeneralCheckService service;
    private final GeneralMlClient ml;

    public GeneralCheckController(GeneralCheckService service, GeneralMlClient ml) {
        this.service = service;
        this.ml = ml;
    }

    /** GET /api/symptom-check/general/symptoms -> [{name, label}, ...] for the picker */
    @GetMapping("/symptoms")
    public ResponseEntity<?> symptoms() {
        try {
            return ResponseEntity.ok(ml.symptoms());
        } catch (GeneralMlClient.MlUnavailableException e) {
            return ResponseEntity.status(503).body(Map.of("message", UNAVAILABLE));
        }
    }

    /** POST /api/symptom-check/general */
    @PostMapping
    public ResponseEntity<?> check(@RequestBody GeneralCheckService.Request request) {
        try {
            return ResponseEntity.ok(service.check(request));
        } catch (GeneralCheckService.BadInputException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (GeneralMlClient.MlUnavailableException e) {
            return ResponseEntity.status(503).body(Map.of("message", UNAVAILABLE));
        }
    }
}