
package com.femora.backend.profile;

import com.femora.backend.cycle.PeriodLog;
import com.femora.backend.cycle.PeriodLogRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:5173")
public class ProfileController {

    private final UserProfileRepository profileRepository;
    private final PeriodLogRepository periodLogRepository;

    public ProfileController(
            UserProfileRepository profileRepository,
            PeriodLogRepository periodLogRepository
    ) {
        this.profileRepository = profileRepository;
        this.periodLogRepository = periodLogRepository;
    }

    @GetMapping
    public ResponseEntity<?> getProfile(
            @RequestParam Long userId
    ) {
        return profileRepository
                .findByUserId(userId)
                .<ResponseEntity<?>>map(profile ->
                        ResponseEntity.ok(profile)
                )
                .orElseGet(() ->
                        ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(Map.of(
                                        "message",
                                        "Profile not completed"
                                ))
                );
    }

    @PostMapping
    public ResponseEntity<?> saveProfile(
            @RequestBody UserProfile profile
    ) {
        if (profile.getUserId() == null ||
                profile.getAge() == null ||
                profile.getLastPeriodDate() == null) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            "userId, age and lastPeriodDate are required"
                    ));
        }

        if (profile.getAverageCycleLength() == null) {
            profile.setAverageCycleLength(28);
        }

        if (profile.getPeriodDuration() == null) {
            profile.setPeriodDuration(5);
        }

        if (profile.getRegularCycles() == null) {
            profile.setRegularCycles(true);
        }

        UserProfile savedProfile =
                profileRepository.save(profile);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(Map.of(
                        "message",
                        "Profile saved successfully",
                        "profileId",
                        savedProfile.getId()
                ));
    }

    @PutMapping
    @Transactional
    public ResponseEntity<?> updateProfile(
            @RequestBody UserProfile profile
    ) {
        if (profile.getUserId() == null) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            "userId is required"
                    ));
        }

        UserProfile existingProfile =
                profileRepository
                        .findByUserId(profile.getUserId())
                        .orElse(new UserProfile());

        existingProfile.setUserId(profile.getUserId());
        existingProfile.setAge(profile.getAge());
        existingProfile.setHeightCm(profile.getHeightCm());
        existingProfile.setWeightKg(profile.getWeightKg());

        // Update the latest period date correctly
        if (profile.getLastPeriodDate() != null) {
            applyLastPeriodEdit(
                    existingProfile,
                    profile.getLastPeriodDate()
            );
        }

        existingProfile.setAverageCycleLength(
                profile.getAverageCycleLength()
        );

        existingProfile.setPeriodDuration(
                profile.getPeriodDuration()
        );

        existingProfile.setRegularCycles(
                profile.getRegularCycles()
        );

        UserProfile updatedProfile =
                profileRepository.save(existingProfile);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Profile updated successfully",
                        "profileId",
                        updatedProfile.getId()
                )
        );
    }

    // Helper method to update the latest period log
    private void applyLastPeriodEdit(
            UserProfile existing,
            LocalDate newDate
    ) {
        LocalDate today = LocalDate.now();

        PeriodLog latestLog = periodLogRepository
                .findByUserIdOrderByStartDateDesc(existing.getUserId())
                .stream()
                .filter(l -> !l.getStartDate().isAfter(today))
                .findFirst()
                .orElse(null);

        boolean logIsLatest = latestLog != null
                && existing.getLastPeriodDate() != null
                && !latestLog.getStartDate()
                .isBefore(existing.getLastPeriodDate());

        if (logIsLatest) {
            latestLog.setStartDate(newDate);
            periodLogRepository.save(latestLog);
        } else {
            existing.setLastPeriodDate(newDate);
        }
    }
}
