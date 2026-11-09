
package com.femora.backend.cycle;

import jakarta.persistence.*;
import java.time.LocalDate;

/**
 * One logged period: the first day of a period for a user.
 */
@Entity
@Table(
        name = "period_logs",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"user_id", "start_date"}
        )
)
public class PeriodLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    protected PeriodLog() {
    }

    public PeriodLog(Long userId, LocalDate startDate) {
        this.userId = userId;
        this.startDate = startDate;
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

    // Added setter
    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }
}
