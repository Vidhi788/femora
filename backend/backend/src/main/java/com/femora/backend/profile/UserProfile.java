package com.femora.backend.profile;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(
        name = "user_profiles",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "userId")
        }
)
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false)
    private Integer age;

    private Double heightCm;

    private Double weightKg;

    @Column(nullable = false)
    private LocalDate lastPeriodDate;

    @Column(nullable = false)
    private Integer averageCycleLength = 28;

    @Column(nullable = false)
    private Integer periodDuration = 5;

    @Column(nullable = false)
    private Boolean regularCycles = true;

    public UserProfile() {
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public Integer getAge() {
        return age;
    }

    public Double getHeightCm() {
        return heightCm;
    }

    public Double getWeightKg() {
        return weightKg;
    }

    public LocalDate getLastPeriodDate() {
        return lastPeriodDate;
    }

    public Integer getAverageCycleLength() {
        return averageCycleLength;
    }

    public Integer getPeriodDuration() {
        return periodDuration;
    }

    public Boolean getRegularCycles() {
        return regularCycles;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public void setHeightCm(Double heightCm) {
        this.heightCm = heightCm;
    }

    public void setWeightKg(Double weightKg) {
        this.weightKg = weightKg;
    }

    public void setLastPeriodDate(LocalDate lastPeriodDate) {
        this.lastPeriodDate = lastPeriodDate;
    }

    public void setAverageCycleLength(Integer averageCycleLength) {
        this.averageCycleLength = averageCycleLength;
    }

    public void setPeriodDuration(Integer periodDuration) {
        this.periodDuration = periodDuration;
    }

    public void setRegularCycles(Boolean regularCycles) {
        this.regularCycles = regularCycles;
    }
}
