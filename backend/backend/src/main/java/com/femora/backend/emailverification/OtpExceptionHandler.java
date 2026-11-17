package com.femora.backend.emailverification;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class OtpExceptionHandler {

    // Both keys are returned: "error" for the OTP screen, "message" to match the rest of your API.
    @ExceptionHandler(OtpException.class)
    public ResponseEntity<Map<String, String>> handle(OtpException e) {
        return ResponseEntity.status(e.getStatus())
                .body(Map.of("error", e.getMessage(), "message", e.getMessage()));
    }
}