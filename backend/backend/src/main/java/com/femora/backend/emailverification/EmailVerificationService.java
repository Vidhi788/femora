package com.femora.backend.emailverification;

import com.femora.backend.passwordreset.EmailService;
import com.femora.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class EmailVerificationService {

    private final EmailVerificationOtpRepository repo;
    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final EmailService emailService;
    private final SecureRandom random = new SecureRandom();

    public EmailVerificationService(EmailVerificationOtpRepository repo,
                                    UserRepository userRepository,
                                    PasswordEncoder encoder,
                                    EmailService emailService) {
        this.repo = repo;
        this.userRepository = userRepository;
        this.encoder = encoder;
        this.emailService = emailService;
    }

    /** Step 1: generate a code and email it. */
    public void request(String rawEmail) {
        String email = normalize(rawEmail);

        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new OtpException(HttpStatus.BAD_REQUEST, "Enter a valid email address.");
        }
        if (userRepository.existsByEmail(email)) {
            throw new OtpException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }

        EmailVerificationOtp rec = repo.findByEmail(email).orElseGet(EmailVerificationOtp::new);

        if (rec.getLastSentAt() != null
                && Duration.between(rec.getLastSentAt(), Instant.now()).getSeconds() < 60) {
            throw new OtpException(HttpStatus.TOO_MANY_REQUESTS, "Please wait a minute before asking for another code.");
        }

        String otp = String.format("%06d", random.nextInt(1_000_000));

        rec.setEmail(email);
        rec.setOtpHash(encoder.encode(otp));
        rec.setExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));
        rec.setLastSentAt(Instant.now());
        rec.setAttempts(0);
        rec.setVerified(false);
        rec.setVerifiedAt(null);
        repo.save(rec);

        emailService.sendVerificationCode(email, otp);
    }

    /** Step 2: check the code the person typed. */
    public void verify(String rawEmail, String code) {
        String email = normalize(rawEmail);

        EmailVerificationOtp rec = repo.findByEmail(email)
                .orElseThrow(() -> new OtpException(HttpStatus.BAD_REQUEST, "Please request a code first."));

        if (rec.getExpiresAt() == null || rec.getExpiresAt().isBefore(Instant.now())) {
            throw new OtpException(HttpStatus.BAD_REQUEST, "This code has expired. Please request a new one.");
        }
        if (rec.getAttempts() >= 5) {
            throw new OtpException(HttpStatus.TOO_MANY_REQUESTS, "Too many wrong attempts. Please request a new code.");
        }
        if (code == null || !encoder.matches(code.trim(), rec.getOtpHash())) {
            rec.setAttempts(rec.getAttempts() + 1);
            repo.save(rec);
            throw new OtpException(HttpStatus.BAD_REQUEST, "That code is not correct.");
        }

        rec.setVerified(true);
        rec.setVerifiedAt(Instant.now());
        repo.save(rec);
    }

    /** Called by register. Throws 403 unless this email was verified in the last 30 minutes. */
    public void consumeVerification(String rawEmail) {
        String email = normalize(rawEmail);

        EmailVerificationOtp rec = repo.findByEmail(email)
                .orElseThrow(() -> new OtpException(HttpStatus.FORBIDDEN, "Please verify your email first."));

        if (!rec.isVerified()
                || rec.getVerifiedAt() == null
                || rec.getVerifiedAt().isBefore(Instant.now().minus(30, ChronoUnit.MINUTES))) {
            throw new OtpException(HttpStatus.FORBIDDEN, "Please verify your email first.");
        }

        repo.delete(rec); // single use
    }

    private String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}