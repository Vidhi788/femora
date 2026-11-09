package com.femora.backend.reminder;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

/**
 * Sends reminders by email, using the same SMTP settings as the password reset code.
 * The sender address comes from femora.mail.from, which must be a sender verified in Brevo.
 * When a calendar file is given it is attached, so one tap adds the reminder to the
 * phone's calendar app.
 */
@Component
public class EmailReminderSender implements ReminderSender {

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String from;
    private final String fromName;

    public EmailReminderSender(ObjectProvider<JavaMailSender> mailSender,
                               @Value("${femora.mail.from:femoraadmin@gmail.com}") String from,
                               @Value("${femora.mail.from-name:Femora}") String fromName) {
        this.mailSender = mailSender;
        this.from = from;
        this.fromName = fromName;
    }

    @Override
    public boolean supports(ReminderSettings.Channel channel) {
        return channel == ReminderSettings.Channel.EMAIL;
    }

    @Override
    public void send(ReminderSettings.Channel channel, Recipient to, String message) throws Exception {
        send(channel, to, message, null);
    }

    @Override
    public void send(ReminderSettings.Channel channel, Recipient to, String message,
                     byte[] calendarFile) throws Exception {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null || from.isBlank()) {
            throw new IllegalStateException("Email is not configured on the server.");
        }
        if (to.email() == null || to.email().isBlank()) {
            throw new IllegalStateException("This account has no email address.");
        }

        boolean hasCalendar = calendarFile != null && calendarFile.length > 0;

        MimeMessage mime = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mime, hasCalendar, "UTF-8");
        helper.setFrom(new InternetAddress(from, fromName, "UTF-8"));
        helper.setTo(to.email());
        helper.setSubject("A gentle reminder from Femora");

        StringBuilder body = new StringBuilder(message).append("\n\n");
        if (hasCalendar) {
            body.append("Tap the attached femora-reminders.ics file to add your upcoming ")
                    .append("reminders to your phone's calendar, so you get an alert even if ")
                    .append("you do not open your email.\n\n");
        }
        body.append("You can turn these reminders off any time in Settings.\n")
                .append("Femora is an academic healthcare project.");

        helper.setText(body.toString(), false);

        if (hasCalendar) {
            helper.addAttachment("femora-reminders.ics",
                    new ByteArrayResource(calendarFile),
                    "text/calendar; charset=UTF-8; method=PUBLISH");
        }

        sender.send(mime);
    }
}