package com.femora.backend.reminder;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Reminder endpoints. The user is always read from the login token (its subject is the user id).
 * Any userId sent by the browser is ignored, so nobody can read or change another user's settings.
 */
@RestController
@RequestMapping("/api/reminders")
public class ReminderController {

    private static final Pattern E164 = Pattern.compile("^\\+[1-9]\\d{9,14}$");
    private static final Pattern INDIA_10 = Pattern.compile("^[6-9]\\d{9}$");
    private static final Pattern INDIA_12 = Pattern.compile("^91[6-9]\\d{9}$");

    private final ReminderSettingsRepository repo;
    private final ReminderService service;

    public ReminderController(ReminderSettingsRepository repo, ReminderService service) {
        this.repo = repo;
        this.service = service;
    }

    public record ReminderDto(Long userId, String channel, String phoneNumber,
                              boolean enabled, boolean consent) {}

    @GetMapping
    public ReminderDto get(@AuthenticationPrincipal Jwt jwt) {
        Long userId = userId(jwt);

        return repo.findByUserId(userId)
                .map(this::toDto)
                .orElse(new ReminderDto(userId, "EMAIL", "", false, false));
    }

    @PutMapping
    public ResponseEntity<Object> save(@AuthenticationPrincipal Jwt jwt,
                                       @RequestBody ReminderDto body) {
        Long userId = userId(jwt);

        ReminderSettings.Channel channel;
        try {
            channel = ReminderSettings.Channel.valueOf(
                    String.valueOf(body.channel()).toUpperCase(Locale.ENGLISH));
        } catch (IllegalArgumentException e) {
            return bad("Choose email, SMS or WhatsApp.");
        }

        String phone;
        try {
            phone = normalizePhone(body.phoneNumber());
        } catch (IllegalArgumentException e) {
            return bad("Enter a valid mobile number, for example +919876543210.");
        }

        if (body.enabled()) {
            if (!body.consent()) {
                return bad("Please agree to receive reminders.");
            }
            if (channel != ReminderSettings.Channel.EMAIL && phone == null) {
                return bad("Add your mobile number to get SMS or WhatsApp reminders.");
            }
        }

        ReminderSettings settings = repo.findByUserId(userId)
                .orElseGet(ReminderSettings::new);

        settings.setUserId(userId);
        settings.setChannel(channel);
        settings.setPhoneNumber(phone);
        settings.setEnabled(body.enabled());

        if (body.consent()) {
            if (settings.getConsentAt() == null) {
                settings.setConsentAt(LocalDateTime.now());
            }
        } else {
            settings.setConsentAt(null);
        }

        return ResponseEntity.ok(toDto(repo.save(settings)));
    }

    @PostMapping("/test")
    public ResponseEntity<Object> test(@AuthenticationPrincipal Jwt jwt) {
        try {
            String via = service.sendTest(userId(jwt));
            return ResponseEntity.ok(Map.of("message", "Test reminder sent by " + via + "."));
        } catch (IllegalStateException e) {
            return bad(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of(
                    "message", "Could not send the test reminder: " + e.getMessage()));
        }
    }

    /** Downloads a calendar file (.ics) with the upcoming reminders. */
    @GetMapping("/calendar")
    public ResponseEntity<Object> calendar(@AuthenticationPrincipal Jwt jwt) {
        try {
            byte[] file = service.calendarFor(userId(jwt));

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"femora-reminders.ics\"")
                    .contentType(MediaType.parseMediaType("text/calendar; charset=UTF-8"))
                    .body(file);
        } catch (IllegalStateException e) {
            return bad(e.getMessage());
        }
    }

    // --------------------------------------------------

    private static Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }

    private ReminderDto toDto(ReminderSettings s) {
        return new ReminderDto(
                s.getUserId(),
                s.getChannel().name(),
                s.getPhoneNumber() == null ? "" : s.getPhoneNumber(),
                s.isEnabled(),
                s.getConsentAt() != null);
    }

    /** Returns +<country code><number>, null when empty, or throws when invalid. */
    private static String normalizePhone(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }

        String cleaned = raw.replaceAll("[\\s\\-()]", "");

        if (INDIA_10.matcher(cleaned).matches()) {
            return "+91" + cleaned;
        }
        if (INDIA_12.matcher(cleaned).matches()) {
            return "+" + cleaned;
        }
        if (E164.matcher(cleaned).matches()) {
            return cleaned;
        }
        throw new IllegalArgumentException("Invalid phone number");
    }

    private static ResponseEntity<Object> bad(String message) {
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}