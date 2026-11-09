// Dark lotus silhouette with seven glowing chakra badges (drawn in code, no image file).
import { CHAKRAS } from "./chakras.js";

export default function ChakraBody({ active = [], selected = "", onPick, labels = false }) {
  const nodes = [];
  for (let i = 0; i < CHAKRAS.length; i++) {
    const c = CHAKRAS[i];
    const on = active.indexOf(c.key) !== -1;
    const sel = selected === c.key;
    nodes.push(
      <g
        key={c.key}
        className={onPick ? "c-node c-click" : "c-node"}
        style={{ color: c.color }}
        tabIndex={onPick ? 0 : -1}
        role={onPick ? "button" : undefined}
        aria-label={c.name + " chakra"}
        onClick={function () { if (onPick) onPick(c.key); }}
        onKeyDown={function (e) { if (onPick && e.key === "Enter") onPick(c.key); }}
      >
        <circle className={on ? "c-glow on" : "c-glow"} cx="200" cy={c.y} r="30" fill="currentColor" opacity={on ? 0.45 : 0.1} />
        <g className="c-badge">
          <circle className="c-ring" cx="200" cy={c.y} r={sel ? 22 : 18} />
          <circle className="c-core" cx="200" cy={c.y} r={sel ? 15 : 12} opacity={on || sel ? 1 : 0.7} />
          <circle className="c-dot" cx="200" cy={c.y} r="3.5" />
        </g>
        {labels ? <text x="248" y={c.y + 5} className="c-label">{c.name}</text> : null}
      </g>
    );
  }

  return (
    <svg className="chakra-body" viewBox="0 -10 400 530" role="img" aria-label="Seated figure showing seven chakras">
      <ellipse className="c-aura" cx="200" cy="270" rx="190" ry="235" opacity="0.5" />
      <ellipse className="c-aura" cx="200" cy="270" rx="165" ry="210" opacity="0.3" />
      <ellipse className="c-aura" cx="200" cy="270" rx="215" ry="260" opacity="0.18" />
      <g className="c-body">
        <ellipse cx="200" cy="88" rx="34" ry="40" />
        <rect x="186" y="118" width="28" height="30" rx="10" />
        <path d="M200 138 C160 140 132 150 122 190 C114 230 130 300 150 380 L250 380 C270 300 286 230 278 190 C268 150 240 140 200 138Z" />
        <path d="M126 180 C100 230 84 310 78 372 C76 392 80 402 92 402 C106 402 108 388 108 372 C110 330 128 270 146 232Z" />
        <path d="M274 180 C300 230 316 310 322 372 C324 392 320 402 308 402 C294 402 292 388 292 372 C290 330 272 270 254 232Z" />
        <path d="M54 432 C54 394 120 380 200 392 C280 380 346 394 346 432 C346 458 290 472 200 466 C110 472 54 458 54 432Z" />
        <ellipse cx="90" cy="424" rx="48" ry="26" />
        <ellipse cx="310" cy="424" rx="48" ry="26" />
      </g>
      {nodes}
    </svg>
  );
}