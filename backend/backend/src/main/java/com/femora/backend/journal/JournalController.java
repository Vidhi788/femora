package com.femora.backend.journal;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.function.Supplier;

/**
 * Journal endpoints. The user is always read from the login token (the token's subject is
 * the user id), so there is no userId in the URL or body that someone could change.
 */
@RestController
@RequestMapping("/api/journal")
public class JournalController {

    private final JournalService service;

    public JournalController(JournalService service) {
        this.service = service;
    }

    public record JournalRequest(String entryDate, String mood, List<String> symptoms, String note) {}

    public record CheckinRequest(String entryDate, String mood) {}

    public record JournalResponse(Long id, String entryDate, String mood, List<String> symptoms,
                                  String note, Integer cycleDay, String phase) {}

    @GetMapping
    public List<JournalResponse> list(@AuthenticationPrincipal Jwt jwt,
                                      @RequestParam(required = false) Integer days) {
        return service.list(userId(jwt), days).stream()
                .map(JournalController::toResponse)
                .toList();
    }

    @PostMapping
    public ResponseEntity<Object> create(@AuthenticationPrincipal Jwt jwt,
                                         @RequestBody JournalRequest body) {
        return run(() -> toResponse(service.create(userId(jwt), toInput(body))));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> update(@AuthenticationPrincipal Jwt jwt,
                                         @PathVariable Long id,
                                         @RequestBody JournalRequest body) {
        return run(() -> toResponse(service.update(userId(jwt), id, toInput(body))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return run(() -> {
            service.delete(userId(jwt), id);
            return Map.of("message", "Deleted.");
        });
    }

    @PostMapping("/checkin")
    public ResponseEntity<Object> checkin(@AuthenticationPrincipal Jwt jwt,
                                          @RequestBody CheckinRequest body) {
        return run(() -> toResponse(
                service.checkin(userId(jwt), parseDate(body.entryDate()), body.mood())));
    }

    // --------------------------------------------------

    private static Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }

    private static JournalService.Input toInput(JournalRequest body) {
        return new JournalService.Input(
                parseDate(body.entryDate()), body.mood(), body.symptoms(), body.note());
    }

    private static LocalDate parseDate(String value) {
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException | NullPointerException e) {
            throw new IllegalArgumentException("Choose a valid date.");
        }
    }

    private static JournalResponse toResponse(JournalEntry entry) {
        return new JournalResponse(
                entry.getId(),
                entry.getEntryDate().toString(),
                entry.getMood(),
                JournalService.splitSymptoms(entry.getSymptoms()),
                entry.getNote(),
                entry.getCycleDay(),
                entry.getPhase());
    }

    private static ResponseEntity<Object> run(Supplier<Object> action) {
        try {
            return ResponseEntity.ok(action.get());
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}