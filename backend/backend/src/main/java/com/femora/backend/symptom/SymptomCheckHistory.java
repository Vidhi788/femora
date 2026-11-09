package com.femora.backend.symptom;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * One finished symptom check. Kept small on purpose: we store the outcome and
 * which answers were "yes", not the user's full health details.
 */
@Entity
@Table(name = "symptom_check_history")
public class SymptomCheckHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    /** "pcos" now; "general", "backpain", ... later. */
    @Column(nullable = false)
    private String category;

    /** URGENT, OUT_OF_RANGE, LOWER, POSSIBLE or HIGHER. */
    @Column(nullable = false)
    private String resultLevel;

    /** Raw model score. Null when the model was not used (urgent / age out of range). */
    private Double score;

    /** Comma-separated "yes" answers, e.g. "irregular_cycle,hair_growth". */
    @Column(length = 500)
    private String answers;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public SymptomCheckHistory() {
    }

    public SymptomCheckHistory(Long userId, String category, String resultLevel,
                               Double score, String answers) {
        this.userId = userId;
        this.category = category;
        this.resultLevel = resultLevel;
        this.score = score;
        this.answers = answers;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getCategory() {
        return category;
    }

    public String getResultLevel() {
        return resultLevel;
    }

    public Double getScore() {
        return score;
    }

    public String getAnswers() {
        return answers;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}