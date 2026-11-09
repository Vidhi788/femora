package com.femora.backend.cycle;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "cycle_records")
public class CycleRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private Integer cycleLength = 28;

    public CycleRecord() {
    }

    public CycleRecord(
            Long userId,
            LocalDate startDate,
            Integer cycleLength
    ) {
        this.userId = userId;
        this.startDate = startDate;
        this.cycleLength = cycleLength;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public Integer getCycleLength() {
        return cycleLength;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public void setCycleLength(Integer cycleLength) {
        this.cycleLength = cycleLength;
    }
}
