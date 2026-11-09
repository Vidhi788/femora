package com.femora.backend.passwordreset;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Public endpoints (SecurityConfig already allows /api/auth/**). */
@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    public record ForgotRequest(String email) {
    }

    public record ResetRequest(String email, String code, String newPassword) {
    }

    private final PasswordResetService service;

    public PasswordResetController(PasswordResetService service) {
        this.service = service;
    }

    /** POST /api/auth/forgot-password  { "email": "..." } */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgot(@RequestBody ForgotRequest request) {
        try {
            service.requestCode(request.email());
        } catch (PasswordResetService.BadRequestException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
        // Same reply whether or not the email has an account.
        return ResponseEntity.ok(Map.of("message",
                "If this email is registered, we've sent a 6-digit code. It expires in 10 minutes."));
    }

    /** POST /api/auth/reset-password  { "email": "...", "code": "123456", "newPassword": "..." } */
    @PostMapping("/reset-password")
    public ResponseEntity<?> reset(@RequestBody ResetRequest request) {
        try {
            service.resetPassword(request.email(), request.code(), request.newPassword());
        } catch (PasswordResetService.BadRequestException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
        return ResponseEntity.ok(Map.of("message", "Your password has been updated. You can sign in now."));
    }
}