package com.femora.backend.journal;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface JournalRepository extends JpaRepository<JournalEntry, Long> {

    List<JournalEntry> findByUserIdOrderByEntryDateDescIdDesc(Long userId);

    List<JournalEntry> findByUserIdAndEntryDateGreaterThanEqualOrderByEntryDateDescIdDesc(
            Long userId, LocalDate from);

    /** Always looks the note up together with its owner, so one user can never reach another's. */
    Optional<JournalEntry> findByIdAndUserId(Long id, Long userId);

    Optional<JournalEntry> findFirstByUserIdAndEntryDateOrderByIdAsc(Long userId, LocalDate date);
}