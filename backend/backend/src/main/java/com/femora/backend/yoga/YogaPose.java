package com.femora.backend.yoga;

import jakarta.persistence.*;

/** One yoga pose. category = PERIOD_PAIN | PCOS | MENOPAUSE, chakra = ROOT | SACRAL | SOLAR_PLEXUS | HEART | THROAT */
@Entity
@Table(name = "yoga_poses")
public class YogaPose {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String sanskritName;
    private String category;
    private String chakra;
    private int durationMinutes;
    private String level;

    @Column(length = 400)
    private String benefit;

    @Column(length = 1000)
    private String steps;      // steps separated by the | character

    private String breathing;

    @Column(length = 300)
    private String caution;

    public YogaPose() {}

    public YogaPose(String name, String sanskritName, String category, String chakra, int durationMinutes,
                    String level, String benefit, String steps, String breathing, String caution) {
        this.name = name; this.sanskritName = sanskritName; this.category = category; this.chakra = chakra;
        this.durationMinutes = durationMinutes; this.level = level; this.benefit = benefit;
        this.steps = steps; this.breathing = breathing; this.caution = caution;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getSanskritName() { return sanskritName; }
    public String getCategory() { return category; }
    public String getChakra() { return chakra; }
    public int getDurationMinutes() { return durationMinutes; }
    public String getLevel() { return level; }
    public String getBenefit() { return benefit; }
    public String getSteps() { return steps; }
    public String getBreathing() { return breathing; }
    public String getCaution() { return caution; }
}