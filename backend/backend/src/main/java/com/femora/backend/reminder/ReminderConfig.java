package com.femora.backend.reminder;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Turns on @Scheduled jobs. Harmless if @EnableScheduling is already used elsewhere. */
@Configuration
@EnableScheduling
public class ReminderConfig {
}