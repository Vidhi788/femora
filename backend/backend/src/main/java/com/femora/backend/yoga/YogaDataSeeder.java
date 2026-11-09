package com.femora.backend.yoga;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/** Fills the table once on first start (7 poses per category, one per chakra). */
@Component
public class YogaDataSeeder implements CommandLineRunner {

    private final YogaPoseRepository repo;

    public YogaDataSeeder(YogaPoseRepository repo) {
        this.repo = repo;
    }

    private void add(String name, String sa, String cat, String chakra, int min, String level,
                     String benefit, String steps, String breathing, String caution) {
        repo.save(new YogaPose(name, sa, cat, chakra, min, level, benefit, steps, breathing, caution));
    }

    @Override
    public void run(String... args) {
        if (repo.count() >= 21) return;   // already has all 7 chakras
        repo.deleteAll();                 // re-seed if an older 15-pose set exists

        // ---------- PERIOD PAIN ----------
        add("Child's Pose", "Balasana", "PERIOD_PAIN", "ROOT", 3, "Gentle",
                "Releases the lower back and pelvic floor.",
                "Kneel and sit back on your heels|Walk your hands forward|Rest your forehead on the mat|Let your hips grow heavy",
                "Slow belly breaths, 4 counts in and 6 out", "Place a pillow under your torso if the stretch feels strong.");
        add("Reclined Butterfly", "Supta Baddha Konasana", "PERIOD_PAIN", "SACRAL", 5, "Gentle",
                "Opens the inner thighs and calms cramping.",
                "Lie on your back|Bring the soles of your feet together|Let your knees fall open|Rest your hands on your lower belly",
                "Breathe into the hands on your belly", "Support each knee with a cushion.");
        add("Supine Twist", "Supta Matsyendrasana", "PERIOD_PAIN", "SOLAR_PLEXUS", 4, "Gentle",
                "Wrings out back tension and bloating.",
                "Lie down and hug both knees|Drop the knees to the right|Open the left arm wide|Stay, then switch sides",
                "Exhale as the knees lower", "Keep the twist soft, never forced.");
        add("Cat-Cow", "Marjaryasana-Bitilasana", "PERIOD_PAIN", "HEART", 3, "Gentle",
                "Moves the spine and eases a stiff back.",
                "Come to hands and knees|Inhale, lift the chest and tailbone|Exhale, round the spine|Repeat slowly 8 times",
                "Match each breath to one movement", "Skip deep arching if your wrists hurt.");
        add("Supported Fish", "Salamba Matsyasana", "PERIOD_PAIN", "THROAT", 5, "Gentle",
                "Opens the chest and lets the whole body soften.",
                "Place a rolled blanket along your spine|Lie back over it|Let your arms fall open|Rest with soft eyes",
                "Long, quiet exhales", "Use a small pillow under your head if your neck feels strained.");

        // ---------- PCOS ----------
        add("Garland Pose", "Malasana", "PCOS", "ROOT", 2, "Moderate",
                "Wakes up the pelvic area and hips.",
                "Stand with feet wider than hips|Lower into a deep squat|Press elbows against your inner knees|Lift the chest",
                "Steady breaths in the pelvis", "Sit on a block if your heels lift.");
        add("Bound Angle", "Baddha Konasana", "PCOS", "SACRAL", 4, "Gentle",
                "Supports blood flow to the reproductive organs.",
                "Sit tall with the soles of your feet together|Hold your ankles|Lengthen your spine|Fold forward a little",
                "Breathe into the lower belly", "Sit on a folded blanket.");
        add("Boat Pose", "Navasana", "PCOS", "SOLAR_PLEXUS", 2, "Challenging",
                "Builds core strength and supports metabolism.",
                "Sit with knees bent|Lean back and lift your feet|Reach your arms forward|Hold for 5 breaths",
                "Keep breathing, do not hold your breath", "Keep your knees bent if your back rounds.");
        add("Cobra Pose", "Bhujangasana", "PCOS", "HEART", 2, "Moderate",
                "Opens the chest and stimulates the abdomen.",
                "Lie on your belly|Place your hands under your shoulders|Peel the chest off the floor|Keep your elbows soft",
                "Inhale as you lift, exhale as you lower", "Avoid if you are pregnant.");
        add("Bridge Pose", "Setu Bandhasana", "PCOS", "THROAT", 3, "Moderate",
                "Strengthens hips and opens the front body.",
                "Lie on your back, knees bent|Press your feet into the floor|Lift your hips|Roll down slowly",
                "Inhale up, exhale down", "Do not turn your head while lifted.");

        // ---------- MENOPAUSE ----------
        add("Mountain Pose", "Tadasana", "MENOPAUSE", "ROOT", 2, "Gentle",
                "Builds steadiness and bone-loading strength.",
                "Stand with feet hip-width apart|Press evenly through both feet|Lengthen the crown of your head|Soften your shoulders",
                "Five calm, even breaths", "Stand near a wall if you feel dizzy.");
        add("Happy Baby", "Ananda Balasana", "MENOPAUSE", "SACRAL", 3, "Gentle",
                "Releases hips and settles an anxious mind.",
                "Lie on your back|Hold the outer edges of your feet|Draw your knees toward your armpits|Rock gently side to side",
                "Breathe like a slow wave", "Hold behind the thighs if reaching is hard.");
        add("Seated Forward Fold", "Paschimottanasana", "MENOPAUSE", "SOLAR_PLEXUS", 3, "Gentle",
                "Cools the body and quiets night-time restlessness.",
                "Sit with legs extended|Hinge forward from the hips|Rest your hands on your shins|Relax your head",
                "Exhale to fold a little deeper", "Bend your knees if your hamstrings are tight.");
        add("Cow Face Arms", "Gomukhasana arms", "MENOPAUSE", "HEART", 2, "Moderate",
                "Eases stiff shoulders and opens the chest.",
                "Sit tall|Reach your right arm up and bend the elbow|Reach your left arm behind your back|Clasp fingers or hold a strap, then switch",
                "Breathe into the space between your shoulder blades", "Use a strap and keep your neck relaxed.");
        add("Cooling Breath", "Sheetali Pranayama", "MENOPAUSE", "THROAT", 4, "Gentle",
                "Helps ease hot flashes and calm the mind.",
                "Sit comfortably|Curl your tongue like a tube|Inhale slowly through it|Close your mouth and exhale through the nose",
                "Ten rounds, slow and cool", "If you cannot curl your tongue, inhale with teeth lightly together.");

        // ---------- CROWN + THIRD EYE (added for the 7-chakra figure) ----------
        add("Easy Pose with Eye Palming", "Sukhasana", "PERIOD_PAIN", "THIRD_EYE", 3, "Gentle",
                "Calms the mind and eases pain-related tension.",
                "Sit comfortably cross-legged|Rub your palms together until warm|Cup them gently over your closed eyes|Rest with soft breath",
                "Slow, even breaths", "Do not press on your eyeballs.");
        add("Corpse Pose", "Savasana", "PERIOD_PAIN", "CROWN", 5, "Gentle",
                "Total rest to release cramps and fatigue.",
                "Lie flat on your back|Let your feet fall open|Rest your arms beside you|Release every muscle and stay still",
                "Natural breath, no effort", "Place a pillow under your knees if your back feels tight.");
        add("Alternate Nostril Breathing", "Nadi Shodhana", "PCOS", "THIRD_EYE", 5, "Gentle",
                "Settles stress, which can affect hormone balance.",
                "Sit tall|Close the right nostril and inhale left|Close the left, exhale right|Inhale right, then switch and repeat",
                "Inhale 4, exhale 4", "Stop if you feel light-headed.");
        add("Seated Meditation", "Dhyana", "PCOS", "CROWN", 5, "Gentle",
                "Quiets the mind and builds a steady daily habit.",
                "Sit on a cushion with a tall spine|Rest your hands on your knees|Close your eyes|Watch your breath without changing it",
                "Natural breath", "Sit on a chair if the floor is uncomfortable.");
        add("Bee Breath", "Bhramari Pranayama", "MENOPAUSE", "THIRD_EYE", 3, "Gentle",
                "Soothes irritation and the racing mind.",
                "Sit comfortably and close your eyes|Inhale through the nose|Exhale with a soft humming sound|Feel the vibration in your head",
                "Six slow rounds", "Keep the hum gentle.");
        add("Legs Up the Wall", "Viparita Karani", "MENOPAUSE", "CROWN", 6, "Gentle",
                "Cools the body and calms the nervous system.",
                "Sit sideways next to a wall|Swing your legs up as you lie back|Rest your arms open|Stay and let your breath slow",
                "Long, slow exhales", "Bend your knees slightly if your hamstrings pull.");
    }
}