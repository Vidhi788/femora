package com.femora.backend.passwordreset;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

/**
 * Sends the reset code by email. It sends in the background so the reply time does not reveal
 * whether an email address has an account.
 *
 * The sender shows up in the inbox as "Femora" (femora.mail.from-name). The address comes from
 * femora.mail.from, which must be a sender verified in Brevo.
 *
 * Without mail settings nothing is sent. For local testing set femora.otp.log-code=true and the
 * code is printed in the backend console instead. Never leave that on in a real deployment.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String from;
    private final String fromName;
    private final boolean logCode;

    public EmailService(ObjectProvider<JavaMailSender> mailSender,
                        @Value("${femora.mail.from:femoraadmin@gmail.com}") String from,
                        @Value("${femora.mail.from-name:Femora}") String fromName,
                        @Value("${femora.otp.log-code:false}") boolean logCode) {
        this.mailSender = mailSender;
        this.from = from;
        this.fromName = fromName;
        this.logCode = logCode;
    }

    public void sendResetCode(String to, String code) {
        if (logCode) {
            log.warn("DEV ONLY - password reset code for {} is {}", to, code);
        }

        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null || from.isBlank()) {
            log.warn("Mail is not configured, so no email was sent.");
            return;
        }

        CompletableFuture.runAsync(() -> {
            try {
                MimeMessage message = sender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");

                helper.setFrom(new InternetAddress(from, fromName, "UTF-8"));
                helper.setTo(to);
                helper.setSubject("Your Femora password reset code");
                helper.setText("Your Femora code is " + code + ".\n\n"
                        + "It expires in 10 minutes. If you did not ask to reset your password, "
                        + "you can ignore this email and your password will stay the same.\n\n"
                        + "Femora is an academic healthcare project.", false);

                sender.send(message);
            } catch (Exception e) {
                log.warn("Could not send the reset email: {}", e.getMessage());
            }
        });
    }
}