package com.femora.backend.cycle;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface PeriodLogRepository extends JpaRepository<PeriodLog, Long> {

    List<PeriodLog> findByUserIdOrderByStartDateDesc(Long userId);

    boolean existsByUserIdAndStartDate(Long userId, LocalDate startDate);
}