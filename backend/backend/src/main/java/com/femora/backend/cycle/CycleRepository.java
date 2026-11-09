
package com.femora.backend.cycle;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CycleRepository
        extends JpaRepository<CycleRecord, Long> {

    Optional<CycleRecord> findTopByUserIdOrderByStartDateDesc(
            Long userId
    );
}
