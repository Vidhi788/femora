package com.femora.backend.product;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Fills the product table at start-up. Each kit is added only if it has no products yet.
 *
 * To start fresh (recommended after changing this file), run in MySQL, then restart:
 *     DELETE FROM product_store_link;
 *     DELETE FROM product;
 *
 * Search links (Amazon, Flipkart, Blinkit) are built from a search word. Test each button once:
 * if a store changes its address format, edit the three small methods at the bottom.
 * Pharmacy cards open the store's home page. They never name a medicine for a condition.
 * Only comfort and wellness items belong here. No medicines, supplements or "treatments".
 */
@Component
public class ProductSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ProductSeeder.class);

    private static final String MUST = "Must-have";
    private static final String HEAT = "Heat therapy";
    private static final String SUPPORT = "Massage and support";
    private static final String SOOTHE = "Soothing extras";
    private static final String HELPFUL = "Helpful";
    private static final String OPTIONAL = "Optional";

    private final ProductRepository repo;

    public ProductSeeder(ProductRepository repo) {
        this.repo = repo;
    }

    @Override
    public void run(String... args) {
        // ---- result screens (Back pain checker uses back_pain) ----
        seed("back_pain", List.of(
                p("back_pain", null, "Hot water bag", "Warmth can ease sore, stiff muscles.", amazon("hot water bag"), flipkart("hot water bag")),
                p("back_pain", null, "Electric heating pad", "Steady heat for your lower back, with adjustable settings.", amazon("electric heating pad"), flipkart("electric heating pad")),
                p("back_pain", null, "Lumbar support cushion", "Supports your lower back when you sit for long.", amazon("lumbar support cushion"), flipkart("lumbar support cushion")),
                p("back_pain", null, "Yoga mat", "For the gentle stretches in our yoga section.", amazon("yoga mat"), flipkart("yoga mat"))));

        // ---- 1. Period Survival Kit ----
        seed("period_survival", List.of(
                all("period_survival", MUST, "Sanitary pads", "In the absorbency that suits your flow.", "sanitary pads"),
                all("period_survival", MUST, "Overnight pads", "Longer and more absorbent, for sleeping.", "overnight sanitary pads"),
                all("period_survival", MUST, "Disposal bags", "Discreet bags for wrapping used pads.", "sanitary disposal bags"),
                shopAndQuick("period_survival", MUST, "Tissues", "Soft pocket or box tissues.", "tissues"),
                shop("period_survival", MUST, "Period pouch", "A small pouch to carry spares.", "period pouch"),
                shop("period_survival", MUST, "Spare cotton underwear", "A spare pair for the days you need one.", "cotton underwear women"),

                shop("period_survival", HEAT, "Heating pad", "Gentle warmth for lower abdominal cramps and back discomfort.", "heating pad"),
                shop("period_survival", HEAT, "Hot water bag", "Heat therapy for cramps.", "hot water bag"),
                shop("period_survival", HEAT, "Electric heating belt", "Hands-free warmth for your belly or back.", "electric heating belt"),
                shop("period_survival", HEAT, "Microwaveable heat pack", "Reusable heat therapy.", "microwaveable heat pack"),

                shop("period_survival", SUPPORT, "Period cramp massager", "Gentle massage for discomfort.", "period cramp massager"),
                shop("period_survival", SUPPORT, "Back support cushion", "Lower back comfort.", "back support cushion"),
                shop("period_survival", SUPPORT, "Lumbar support belt", "Back support.", "lumbar support belt"),
                shop("period_survival", SUPPORT, "Body massage roller", "Muscle relaxation.", "body massage roller"),
                shop("period_survival", SUPPORT, "Massage ball", "Relaxes tight muscles.", "massage ball"),

                shop("period_survival", SOOTHE, "Comfortable socks", "Warm, soft socks for slow days.", "cosy socks women"),
                shop("period_survival", SOOTHE, "Warm bath salts", "A relaxing bath experience.", "bath salts"),
                shop("period_survival", SOOTHE, "Pain relief patches", "Topical comfort. Check the ingredients and directions first.", "period pain relief patches"),
                shop("period_survival", SOOTHE, "Period pain relief spray", "Topical muscle comfort, if suitable. Check the ingredients and directions first.", "period pain relief spray"),

                quick("period_survival", OPTIONAL, "Dark chocolate", "A square or two, if you fancy it.", "dark chocolate"),
                shopAndQuick("period_survival", OPTIONAL, "Caffeine-free herbal tea", "A warm cup to slow down with.", "herbal tea caffeine free"),
                shopAndQuick("period_survival", OPTIONAL, "Unscented wipes", "For external use only.", "unscented wet wipes")));

        // ---- 2. PCOS Wellness Kit ----
        seed("pcos_wellness", List.of(
                shop("pcos_wellness", MUST, "Cycle and symptom journal", "Note your periods and symptoms to show a doctor.", "period symptom journal"),
                shop("pcos_wellness", MUST, "Reusable water bottle", "Makes it easy to keep water with you.", "reusable water bottle"),
                shop("pcos_wellness", MUST, "Meal-planning notebook", "Plan your week of meals in one place.", "meal planner notebook"),
                shop("pcos_wellness", MUST, "Resistance band", "Light, portable strength work at home.", "resistance bands"),
                shop("pcos_wellness", HELPFUL, "Habit tracker", "A simple way to follow small daily habits.", "habit tracker notebook"),
                shop("pcos_wellness", HELPFUL, "Food-storage containers", "For meals you have planned ahead.", "food storage containers"),
                quick("pcos_wellness", OPTIONAL, "Healthy snacks", "Choose what suits your own needs. No food cures PCOS.", "healthy snacks")));

        // ---- 3. Period Skin Care Kit ----
        seed("period_skin", List.of(
                shop("period_skin", MUST, "Gentle cleanser", "A mild face wash for skin that gets sensitive.", "gentle face cleanser"),
                shop("period_skin", MUST, "Non-comedogenic moisturiser", "Moisture that won't clog pores.", "non comedogenic moisturiser"),
                shop("period_skin", MUST, "Broad-spectrum SPF 30+ sunscreen", "Daily sun protection.", "sunscreen spf 30 broad spectrum"),
                shop("period_skin", MUST, "Lip balm", "Soothes dry lips.", "lip balm"),
                shop("period_skin", "For occasional breakouts", "Hydrocolloid pimple patches", "Small patches that cover a spot.", "hydrocolloid pimple patches")));

        // ---- 4. Yoga and Relaxation Kit ----
        seed("yoga_relaxation", List.of(
                shop("yoga_relaxation", MUST, "Non-slip yoga mat", "A grippy mat for steady poses.", "non slip yoga mat"),
                shop("yoga_relaxation", MUST, "Comfortable workout wear", "Stretchy clothes that let you move.", "women yoga pants"),
                shop("yoga_relaxation", HELPFUL, "Yoga blocks", "Bring the floor closer in poses.", "yoga blocks"),
                shop("yoga_relaxation", HELPFUL, "Yoga strap", "Helps you reach in stretches.", "yoga strap"),
                shop("yoga_relaxation", HELPFUL, "Bolster or cushion", "Support for gentle, restful poses.", "yoga bolster"),
                shop("yoga_relaxation", OPTIONAL, "Eye pillow", "A soft weight for resting.", "yoga eye pillow"),
                shop("yoga_relaxation", OPTIONAL, "Meditation cushion", "A comfortable seat for stillness.", "meditation cushion")));

        // ---- 5. Period Cravings Box (Blinkit) ----
        seed("period_cravings", List.of(
                quick("period_cravings", "Sweet", "Dark chocolate", "A square or two can satisfy a sweet craving.", "dark chocolate"),
                quick("period_cravings", "Sweet", "Dates", "Naturally sweet and easy to carry.", "dates"),
                quick("period_cravings", "Crunchy", "Almonds", "A handful makes a steady snack.", "almonds"),
                quick("period_cravings", "Crunchy", "Makhana (fox nuts)", "Light, crunchy and filling.", "makhana"),
                quick("period_cravings", "Crunchy", "Roasted chickpeas", "Savoury and satisfying.", "roasted chickpeas"),
                quick("period_cravings", "Sip", "Herbal tea", "A warm, caffeine-free cup.", "herbal tea")));

        // ---- 6. Self-Care Kit ----
        seed("self_care", List.of(
                shop("self_care", MUST, "Soft sleep mask", "Blocks light for easier rest.", "sleep mask"),
                shop("self_care", MUST, "Journal", "A place to write down your day.", "journal notebook"),
                shop("self_care", MUST, "Comfortable blanket", "Something soft to wrap up in.", "soft blanket"),
                shop("self_care", HELPFUL, "Gentle body lotion", "Mild moisture for dry skin.", "gentle body lotion"),
                shop("self_care", HELPFUL, "A book to unwind with", "Reading is a calm way to end the day.", "books fiction bestseller"),
                shop("self_care", OPTIONAL, "Scented candle", "Only if you like fragrance and it suits your space.", "scented candle"),
                shop("self_care", OPTIONAL, "Bath product", "Choose a mild one if your skin is sensitive.", "bath salts")));

        // ---- Pharmacy: store home pages only ----
        seed("pharmacy", List.of(
                store("Apollo Pharmacy", "A large online pharmacy for health products and medicines.", "https://www.apollopharmacy.in"),
                store("Tata 1mg", "An online pharmacy for health products and medicines.", "https://www.1mg.com"),
                store("PharmEasy", "An online pharmacy for health products and medicines.", "https://pharmeasy.in")));
    }

    private void seed(String category, List<Product> items) {
        if (repo.findByCategoryIgnoreCase(category).isEmpty()) {
            repo.saveAll(items);
            log.info("ProductSeeder: added {} items to '{}'", items.size(), category);
        }
    }

    // ---------- builders ----------
    private static Product p(String category, String tier, String name, String description, StoreLink... links) {
        return new Product(name, category, description, tier, List.of(links));
    }

    /** Amazon + Flipkart */
    private static Product shop(String category, String tier, String name, String description, String q) {
        return p(category, tier, name, description, amazon(q), flipkart(q));
    }

    /** Blinkit + Amazon + Flipkart */
    private static Product all(String category, String tier, String name, String description, String q) {
        return p(category, tier, name, description, blinkit(q), amazon(q), flipkart(q));
    }

    /** Blinkit + Amazon */
    private static Product shopAndQuick(String category, String tier, String name, String description, String q) {
        return p(category, tier, name, description, blinkit(q), amazon(q));
    }

    /** Blinkit only */
    private static Product quick(String category, String tier, String name, String description, String q) {
        return p(category, tier, name, description, blinkit(q));
    }

    /** A pharmacy's home page */
    private static Product store(String name, String description, String url) {
        return p("pharmacy", "Online pharmacies", name, description, new StoreLink("Visit store", url));
    }

    // ---------- store link patterns ----------
    private static String enc(String query) {
        return URLEncoder.encode(query, StandardCharsets.UTF_8);
    }

    private static StoreLink amazon(String q) {
        return new StoreLink("Amazon", "https://www.amazon.in/s?k=" + enc(q));
    }

    private static StoreLink flipkart(String q) {
        return new StoreLink("Flipkart", "https://www.flipkart.com/search?q=" + enc(q));
    }

    private static StoreLink blinkit(String q) {
        return new StoreLink("Blinkit", "https://blinkit.com/s/?q=" + enc(q));
    }
}