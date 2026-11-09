// Food and diet page: same flip cards, content is the same for everyone.
import { useState } from "react";
import ChakraStage from "../../components/ChakraStage.jsx";
import { DIET_GROUPS, DIET_CARDS } from "../../data/dietData.js";

function groupName(key) {
  for (let i = 0; i < DIET_GROUPS.length; i++) {
    if (DIET_GROUPS[i].key === key) return DIET_GROUPS[i].name;
  }
  return "";
}

export default function FoodDiet({ onNavigate }) {
  const [group, setGroup] = useState("eat");
  const [flippedId, setFlippedId] = useState(null);

  const tabs = [];
  for (let i = 0; i < DIET_GROUPS.length; i++) {
    const g = DIET_GROUPS[i];
    tabs.push(
      <button key={g.key} className={group === g.key ? "yc-tab on" : "yc-tab"} onClick={function () { setGroup(g.key); setFlippedId(null); }}>
        {g.name}
      </button>
    );
  }

  const cards = [];
  for (let i = 0; i < DIET_CARDS.length; i++) {
    const d = DIET_CARDS[i];
    if (d.group !== group) continue;
    const isFlipped = flippedId === d.id;
    const items = [];
    for (let j = 0; j < d.items.length; j++) {
      items.push(<li key={j}>{d.items[j]}</li>);
    }
    cards.push(
      <button
        key={d.id}
        className={isFlipped ? "yc-card flip" : "yc-card"}
        aria-label={d.title}
        onClick={function () { setFlippedId(isFlipped ? null : d.id); }}
      >
        <span className="yc-face yc-front">
          <span className="yc-tag">{groupName(d.group)}</span>
          <strong className="yoga-serif">{d.title}</strong>
          <span>{d.line}</span>
          <small className="yc-hint">Tap to see what to do</small>
        </span>
        <span className="yc-face yc-back">
          <ul>{items}</ul>
          <span><b>Tip:</b> {d.tip}</span>
        </span>
      </button>
    );
  }

  return (
    <div className="yoga-page theme-amber">
      <ChakraStage />
      <div className="yoga-content">
        <button type="button" className="yoga-back" onClick={function () { onNavigate("yoga"); }}>Back to yoga</button>
        <header className="yc-head">
          <h1 className="yoga-serif">Food that feeds your cycle</h1>
          <p>What to eat, how to handle cravings, and what to swap for junk. This is the same for every stage of life.</p>
          <div className="yc-tabs">{tabs}</div>
        </header>
        <div className="yc-grid">{cards}</div>
        <p className="yoga-note">General food guidance, not medical advice. If you have PCOS, diabetes, thyroid issues or allergies, check with a doctor or dietitian.</p>
      </div>
    </div>
  );
}