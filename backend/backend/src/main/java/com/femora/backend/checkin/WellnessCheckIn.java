package com.femora.backend.checkin;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(
        name = "wellness_checkins",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {"userId", "date"}
                )
        }
)
public class WellnessCheckIn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private String mood;

    private Integer hydrationCups;

    private Double sleepHours;

    public WellnessCheckIn() {
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public LocalDate getDate() {
        return date;
    }

    public String getMood() {
        return mood;
    }

    public Integer getHydrationCups() {
        return hydrationCups;
    }

    public Double getSleepHours() {
        return sleepHours;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public void setMood(String mood) {
        this.mood = mood;
    }

    public void setHydrationCups(Integer hydrationCups) {
        this.hydrationCups = hydrationCups;
    }

    public void setSleepHours(Double sleepHours) {
        this.sleepHours = sleepHours;
    }
}
