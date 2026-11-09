function SwapText({ text, tone = "warm", className = "" }) {
  return (
    <span className={`swap-shell ${className}`.trim()}>
      <span className={`swap-word tone-${tone}`}>
        <span className="swap-word-base">{text}</span>
        <span className="swap-word-ghost" aria-hidden="true">
          {text}
        </span>
      </span>
    </span>
  );
}

export default SwapText;
