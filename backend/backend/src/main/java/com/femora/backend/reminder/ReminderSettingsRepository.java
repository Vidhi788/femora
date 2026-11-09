package com.femora.backend.reminder;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReminderSettingsRepository extends JpaRepository<ReminderSettings, Long> {

    Optional<ReminderSettings> findByUserId(Long userId);

    List<ReminderSettings> findByEnabledTrue();
}