package com.femora.backend.checkin;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface CheckInRepository
        extends JpaRepository<WellnessCheckIn, Long> {

    Optional<WellnessCheckIn> findByUserIdAndDate(
            Long userId,
            LocalDate date
    );
}
