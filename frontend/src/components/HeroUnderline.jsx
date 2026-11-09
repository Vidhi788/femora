function HeroUnderline({ delay = 820 }) {
  return (
    <svg
      className="hero-underline"
      viewBox="0 0 420 26"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="femora-ink" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f0b48f" />
          <stop offset="42%" stopColor="#cf6f58" />
          <stop offset="100%" stopColor="#a8462f" />
        </linearGradient>
      </defs>

      <path
        className="u-main"
        pathLength="1"
        vectorEffect="non-scaling-stroke"
        style={{ "--delay": `${delay}ms` }}
        d="M8 15 C 88 6, 170 21, 252 11 C 316 3, 372 13, 412 7"
      />

      <path
        className="u-soft"
        pathLength="1"
        vectorEffect="non-scaling-stroke"
        style={{ "--delay": `${delay + 240}ms` }}
        d="M30 22 C 124 15, 210 25, 322 16"
      />
    </svg>
  );
}

export default HeroUnderline;
