package com.femora.backend.passwordreset;

import com.femora.backend.entity.User;
import com.femora.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;

/**
 * Forgot-password with an emailed one-time code.
 *   requestCode:   always looks the same from outside, whether or not the email has an account
 *   resetPassword: needs the right code, within 10 minutes, with at most 5 wrong tries
 * The code is stored hashed (like a password) and works once.
 */
@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    /** A problem the user can fix. The controller turns it into HTTP 400. */
    public static class BadRequestException extends RuntimeException {
        public BadRequestException(String message) {
            super(message);
        }
    }

    private static final Duration CODE_LIFETIME = Duration.ofMinutes(10);
    private static final Duration RESEND_WAIT = Duration.ofSeconds(60);
    private static final Duration WINDOW = Duration.ofHours(1);
    private static final int MAX_SENDS_PER_WINDOW = 3;
    private static final int MAX_WRONG_TRIES = 5;

    private static final String INVALID_CODE = "That code is invalid or has expired. Please request a new one.";

    private final SecureRandom random = new SecureRandom();

    private final UserRepository users;
    private final PasswordResetOtpRepository otps;
    private final PasswordEncoder passwordEncoder;
    private final EmailService email;

    public PasswordResetService(UserRepository users, PasswordResetOtpRepository otps,
                                PasswordEncoder passwordEncoder, EmailService email) {
        this.users = users;
        this.otps = otps;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
    }

    /**
     * Sends a code if the email has an account. Too-soon or too-many requests are ignored quietly,
     * so the reply never shows whether an account exists.
     */
    @Transactional
    public void requestCode(String rawEmail) {
        String address = normalise(rawEmail);
        if (address == null) {
            throw new BadRequestException("Please enter a valid email address.");
        }

        Optional<User> user = users.findByEmail(address);
        if (user.isEmpty()) {
            return;
        }

        Instant now = Instant.now();
        PasswordResetOtp row = otps.findByEmail(address).orElse(null);

        if (row == null) {
            row = new PasswordResetOtp();
            row.setEmail(address);
            row.setWindowStart(now);
            row.setSendCount(0);
        } else {
            if (Duration.between(row.getLastSentAt(), now).compareTo(RESEND_WAIT) < 0) {
                log.info("Reset code requested again too soon, ignored.");
                return;
            }
            if (Duration.between(row.getWindowStart(), now).compareTo(WINDOW) > 0) {
                row.setWindowStart(now);
                row.setSendCount(0);
            } else if (row.getSendCount() >= MAX_SENDS_PER_WINDOW) {
                log.info("Too many reset codes requested this hour, ignored.");
                return;
            }
        }

        String code = String.format("%06d", random.nextInt(1_000_000));
        row.setCodeHash(passwordEncoder.encode(code));
        row.setExpiresAt(now.plus(CODE_LIFETIME));
        row.setAttempts(0);
        row.setLastSentAt(now);
        row.setSendCount(row.getSendCount() + 1);
        otps.save(row);

        email.sendResetCode(user.get().getEmail(), code);
    }

    /**
     * noRollbackFor matters: a wrong guess throws BadRequestException, and without it the
     * "wrong tries" counter would be rolled back and the limit would never apply.
     */
    @Transactional(noRollbackFor = BadRequestException.class)
    public void resetPassword(String rawEmail, String code, String newPassword) {
        checkNewPassword(newPassword);

        String address = normalise(rawEmail);
        if (address == null || code == null || !code.matches("\\d{6}")) {
            throw new BadRequestException(INVALID_CODE);
        }

        PasswordResetOtp row = otps.findByEmail(address).orElseThrow(() -> new BadRequestException(INVALID_CODE));

        if (Instant.now().isAfter(row.getExpiresAt()) || row.getAttempts() >= MAX_WRONG_TRIES) {
            otps.delete(row);
            throw new BadRequestException(INVALID_CODE);
        }

        if (!passwordEncoder.matches(code, row.getCodeHash())) {
            row.setAttempts(row.getAttempts() + 1);
            otps.save(row);
            throw new BadRequestException(INVALID_CODE);
        }

        User user = users.findByEmail(address).orElseThrow(() -> new BadRequestException(INVALID_CODE));
        user.setPassword(passwordEncoder.encode(newPassword));
        users.save(user);
        otps.delete(row);
    }

    private static void checkNewPassword(String password) {
        if (password == null || password.length() < 8) {
            throw new BadRequestException("Your new password must be at least 8 characters.");
        }
        if (password.length() > 72) {
            throw new BadRequestException("Your new password must be 72 characters or fewer.");
        }
    }

    private static String normalise(String raw) {
        if (raw == null) return null;
        String value = raw.trim().toLowerCase(Locale.ROOT);
        return value.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$") ? value : null;
    }
}