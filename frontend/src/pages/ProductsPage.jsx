import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ProductStrip from "../components/ProductStrip.jsx";
import "../styles/pcos.css";
import "../styles/products.css";

// value must match the category names in ProductSeeder.java
const KITS = [
  { value: "period_survival", label: "Period Survival Kit", emoji: "🌸", blurb: "Pads, a heating pad, chocolate, tea, a pouch and cosy socks." },
  { value: "pcos_wellness", label: "PCOS Wellness Kit", emoji: "🌿", blurb: "A journal, resistance band, water bottle and meal planner." },
  { value: "period_skin", label: "Period Skin Care Kit", emoji: "✨", blurb: "Cleanser, moisturiser, sunscreen, pimple patches and lip balm." },
  { value: "yoga_relaxation", label: "Yoga & Relaxation Kit", emoji: "🧘", blurb: "A yoga mat, blocks, a strap, a cushion and an eye pillow." },
  { value: "period_cravings", label: "Period Cravings Box", emoji: "🍫", blurb: "Dark chocolate, dates, almonds, makhana and herbal tea." },
  { value: "self_care", label: "Self-Care Kit", emoji: "🕯️", blurb: "A sleep mask, journal, blanket, lotion and a good book." },
  { value: "pharmacy", label: "Pharmacy", emoji: "💊", blurb: "Licensed online pharmacies: Apollo, Tata 1mg and PharmEasy." },
];

// A short, calm note above a kit
const NOTES = {
  period_survival:
    "Heat and massage items are comfort aids. For patches and sprays, check the ingredients and directions, " +
    "and ask a pharmacist if you are unsure or pregnant. Severe or worsening pain needs a doctor.",
  period_skin: "Add one new product at a time, and patch-test first if your skin is sensitive.",
  pcos_wellness: "Choose foods and habits that suit you. No product or food cures PCOS, so talk to a doctor about your plan.",
  period_cravings: "Cravings are normal, especially around your period. Pick what feels good.",
  pharmacy:
    "These open licensed online pharmacies. Ask a pharmacist or doctor before taking any medicine, " +
    "and remember that prescription medicines need a valid prescription.",
};

function ProductsPage({ onBack }) {
  // null = the kit picker. A value = that kit's own page.
  const [kit, setKit] = useState(null);
  const current = KITS.find((k) => k.value === kit);

  // Every "page" starts at the top.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [kit]);

  return (
    <div className="pcos-page">
      <div className="pcos-wrap prod-wide">
        <button type="button" className="pcos-back" onClick={() => (kit ? setKit(null) : onBack())}>
          <ArrowLeft size={16} aria-hidden="true" /> {kit ? "All kits" : "Back to dashboard"}
        </button>

        {!current ? (
          <>
            <header className="prod-hero">
              <div className="prod-hero-copy">
                <p className="prod-eyebrow">Handpicked for your day</p>
                <h1 className="prod-title">Picked for you</h1>
                <p className="prod-sub">
                  Ready-made kits for your cycle, skin, mood and rest. Pick one, then shop where you
                  like.
                </p>
              </div>
            </header>

            <div className="kit-grid" role="group" aria-label="Kits">
              {KITS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  className={`kit-tile prod-cat-${k.value}`}
                  onClick={() => setKit(k.value)}
                >
                  <span className="kit-emoji" aria-hidden="true">
                    {k.emoji}
                  </span>
                  <span className="kit-go" aria-hidden="true">
                    <ArrowRight size={18} />
                  </span>
                  <strong>{k.label}</strong>
                  <small>{k.blurb}</small>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className={`kd prod-cat-${current.value}`}>
            <header className="kd-head">
              <div className="kd-copy">
                <h1 className="kd-title">{current.label}</h1>
                <p className="kd-sub">{current.blurb}</p>
              </div>
              <span className="kd-big" aria-hidden="true">
                {current.emoji}
              </span>
            </header>

            {NOTES[current.value] ? <p className="prod-tabnote">{NOTES[current.value]}</p> : null}

            <ProductStrip
              key={current.value}
              category={current.value}
              searchable
              kitCards={current.value !== "pharmacy"}
            />
          </div>
        )}

        <p className="pcos-foot">Femora is an academic healthcare project. It does not provide a medical diagnosis.</p>
      </div>
    </div>
  );
}

export default ProductsPage;