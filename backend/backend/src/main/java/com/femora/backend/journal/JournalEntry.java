package com.femora.backend.journal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * One private journal note: a mood, some symptoms and a short note for a given day.
 * The cycle day and phase are saved with it so the journal stays meaningful later.
 * The table is created automatically by spring.jpa.hibernate.ddl-auto=update.
 */
@Entity
@Table(name = "journal_entries",
        indexes = @Index(name = "idx_journal_user_date", columnList = "user_id, entry_date"))
public class JournalEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Column(length = 20)
    private String mood;

    /** Symptom names separated by commas, for example "Cramps,Headache". */
    @Column(length = 255)
    private String symptoms;

    @Column(length = 1000)
    private String note;

    @Column(name = "cycle_day")
    private Integer cycleDay;

    @Column(length = 20)
    private String phase;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() { return id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public LocalDate getEntryDate() { return entryDate; }
    public void setEntryDate(LocalDate entryDate) { this.entryDate = entryDate; }

    public String getMood() { return mood; }
    public void setMood(String mood) { this.mood = mood; }

    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String symptoms) { this.symptoms = symptoms; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public Integer getCycleDay() { return cycleDay; }
    public void setCycleDay(Integer cycleDay) { this.cycleDay = cycleDay; }

    public String getPhase() { return phase; }
    public void setPhase(String phase) { this.phase = phase; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}