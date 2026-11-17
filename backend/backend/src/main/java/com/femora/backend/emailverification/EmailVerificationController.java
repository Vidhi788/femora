package com.femora.backend.emailverification;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/email-otp")
public class EmailVerificationController {

    private final EmailVerificationService service;

    public EmailVerificationController(EmailVerificationService service) {
        this.service = service;
    }

    @PostMapping("/request")
    public Map<String, Object> request(@RequestBody Map<String, String> body) {
        service.request(body.get("email"));
        return Map.of("sent", true);
    }

    @PostMapping("/verify")
    public Map<String, Object> verify(@RequestBody Map<String, String> body) {
        service.verify(body.get("email"), body.get("code"));
        return Map.of("verified", true);
    }
}