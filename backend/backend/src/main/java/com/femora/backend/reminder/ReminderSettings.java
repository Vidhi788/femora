package com.femora.backend.reminder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * One row per user: how they want to be reminded before their next period.
 * The table is created automatically by spring.jpa.hibernate.ddl-auto=update.
 */
@Entity
@Table(name = "reminder_settings")
public class ReminderSettings {

    public enum Channel { EMAIL, SMS, WHATSAPP }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Channel channel = Channel.EMAIL;

    /** Stored in international format, for example +919876543210. */
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(nullable = false)
    private boolean enabled;

    /** When the user agreed to receive reminders. Null means no consent. */
    @Column(name = "consent_at")
    private LocalDateTime consentAt;

    /** The predicted period date we already reminded about, so nobody gets it twice. */
    @Column(name = "last_reminder_for_date")
    private LocalDate lastReminderForDate;

    public Long getId() { return id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Channel getChannel() { return channel; }
    public void setChannel(Channel channel) { this.channel = channel; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public LocalDateTime getConsentAt() { return consentAt; }
    public void setConsentAt(LocalDateTime consentAt) { this.consentAt = consentAt; }

    public LocalDate getLastReminderForDate() { return lastReminderForDate; }
    public void setLastReminderForDate(LocalDate lastReminderForDate) {
        this.lastReminderForDate = lastReminderForDate;
    }
}
