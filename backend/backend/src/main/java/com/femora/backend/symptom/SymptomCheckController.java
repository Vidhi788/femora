package com.femora.backend.symptom;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

@RestController
@RequestMapping("/api/symptom-check")
public class SymptomCheckController {

    private static final Logger log = LoggerFactory.getLogger(SymptomCheckController.class);

    private final PcosCheckService pcosService;
    private final PregnancyCheckService pregnancyService;
    private final SymptomCheckHistoryRepository historyRepository;

    public SymptomCheckController(PcosCheckService pcosService,
                                  PregnancyCheckService pregnancyService,
                                  SymptomCheckHistoryRepository historyRepository) {
        this.pcosService = pcosService;
        this.pregnancyService = pregnancyService;
        this.historyRepository = historyRepository;
    }

    /** POST /api/symptom-check/pcos */
    @PostMapping("/pcos")
    public ResponseEntity<?> pcos(@RequestBody PcosCheckService.Request request) {
        return run(() -> pcosService.check(request));
    }

    /** POST /api/symptom-check/pregnancy */
    @PostMapping("/pregnancy")
    public ResponseEntity<?> pregnancy(@RequestBody PregnancyCheckService.Request request) {
        return run(() -> pregnancyService.check(request));
    }

    /** GET /api/symptom-check/history?userId=1  (latest 10 checks, newest first) */
    @GetMapping("/history")
    public ResponseEntity<?> history(@RequestParam Long userId) {
        List<Map<String, Object>> rows = new ArrayList<>();

        for (SymptomCheckHistory h : historyRepository.findTop10ByUserIdOrderByCreatedAtDesc(userId)) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", h.getId());
            row.put("category", h.getCategory());
            row.put("level", h.getResultLevel());
            row.put("answers", h.getAnswers());
            row.put("createdAt", h.getCreatedAt().toString());
            rows.add(row);
        }
        return ResponseEntity.ok(rows);
    }

    /** Same error handling for every checker. Add new checkers as one-line endpoints above. */
    private ResponseEntity<?> run(Supplier<CheckResult> check) {
        try {
            return ResponseEntity.ok(check.get());

        } catch (CheckException e) {
            return ResponseEntity.status(e.getStatus()).body(Map.of("message", e.getMessage()));

        } catch (PcosMlClient.MlUnavailableException e) {
            log.warn("ML service call failed: {}", e.getMessage(), e);
            return ResponseEntity.status(503).body(Map.of(
                    "message", "The symptom checker is temporarily unavailable. Please try again in a moment."));
        }
    }
}