import { useState } from "react";
import ChakraStage from "./ChakraStage.jsx";
import { CHAKRAS, chakraOf } from "./chakras.js";
import {
  useYogaPoses,
  filterByChakra,
  splitSteps,
} from "../hooks/useYogaPoses.js";

export default function YogaCategory({
  category,
  theme,
  title,
  subtitle,
  onNavigate,
}) {
  const { poses, loading, error } = useYogaPoses(category);

  const [chakra, setChakra] = useState("");
  const [flippedId, setFlippedId] = useState(null);

  // Filter tabs
  const tabs = [
    <button
      key="all"
      type="button"
      className={chakra === "" ? "yc-tab on" : "yc-tab"}
      onClick={function () {
        setChakra("");
      }}
    >
      All
    </button>,
  ];

  // Root to Crown
  for (let i = CHAKRAS.length - 1; i >= 0; i--) {
    const c = CHAKRAS[i];

    tabs.push(
      <button
        key={c.key}
        type="button"
        className={chakra === c.key ? "yc-tab on" : "yc-tab"}
        onClick={function () {
          setChakra(c.key);
        }}
      >
        <span
          className="yc-dot"
          style={{ background: c.color }}
        ></span>

        {c.name}
      </button>
    );
  }

  const shown = filterByChakra(poses, chakra);

  const cards = [];

  for (let i = 0; i < shown.length; i++) {
    const p = shown[i];

    const isFlipped = flippedId === p.id;
    const c = chakraOf(p.chakra);

    const list = splitSteps(p.steps);
    const steps = [];

    for (let j = 0; j < list.length; j++) {
      steps.push(
        <li key={j}>
          {list[j]}
        </li>
      );
    }

    cards.push(
      <button
        key={p.id}
        type="button"
        className={isFlipped ? "yc-card flip" : "yc-card"}
        aria-label={p.name}
        onClick={function () {
          setFlippedId(isFlipped ? null : p.id);
        }}
      >
        {/* FRONT */}
        <span className="yc-face yc-front">

          <span className="yc-tag">
            <span
              className="yc-dot"
              style={{
                background: c ? c.color : "#fff",
              }}
            ></span>

            {c ? c.name : ""}
            {c ? ", " : ""}
            {p.durationMinutes} min
          </span>

          <strong className="yoga-serif">
            {p.name}
          </strong>

          <em>
            {p.sanskritName}
          </em>

          <span>
            {p.benefit}
          </span>

          <small className="yc-hint">
            Tap to see the steps
          </small>

        </span>

        {/* BACK */}
        <span className="yc-face yc-back">

          <ol>
            {steps}
          </ol>

          <span>
            <b>Breath:</b> {p.breathing}
          </span>

          <small>
            {p.caution}
          </small>

        </span>
      </button>
    );
  }

  return (
    <div className={"yoga-page theme-" + theme}>

      <ChakraStage />

      <div className="yoga-content">

        {/* BACK BUTTON */}
        <button
          type="button"
          className="yoga-back"
          onClick={function () {
            onNavigate("yoga");
          }}
        >
          Back to yoga
        </button>

        {/* HEADER */}
        <header className="yc-head">

          <h1 className="yoga-serif">
            {title}
          </h1>

          <p>
            {subtitle}
          </p>

          {/* CHAKRA TABS */}
          <div className="yc-tabs">
            {tabs}
          </div>

        </header>

        {/* LOADING */}
        {loading ? (
          <p>
            Loading poses...
          </p>
        ) : null}

        {/* ERROR */}
        {error ? (
          <p className="yoga-error">
            {error}
          </p>
        ) : null}

        {/* CARDS */}
        <div className="yc-grid">
          {cards}
        </div>

        {/* NOTE */}
        <p className="yoga-note">
          General wellness guidance, not a medical diagnosis.
          Stop if anything hurts and talk to your doctor.
        </p>

      </div>
    </div>
  );
}