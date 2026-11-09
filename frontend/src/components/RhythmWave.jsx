const WAVE = "M0 45 Q 25 12 50 45 T 100 45 T 150 45 T 200 45 T 250 45 T 300 45 T 350 45 T 400 45";

function RhythmWave() {
  return (
    <div className="wave-panel" aria-hidden="true">
      <span className="wave-sun" />

      <svg className="wave wave-a" viewBox="0 0 400 90" preserveAspectRatio="none">
        <path d={WAVE} fill="none" stroke="#cf6f58" strokeWidth="1.7" vectorEffect="non-scaling-stroke" />
      </svg>

      <svg className="wave wave-b" viewBox="0 0 400 90" preserveAspectRatio="none">
        <path d={WAVE} fill="none" stroke="#e0a96d" strokeWidth="2.3" vectorEffect="non-scaling-stroke" />
      </svg>

      <svg className="wave wave-c" viewBox="0 0 400 90" preserveAspectRatio="none">
        <path d={WAVE} fill="none" stroke="#9db894" strokeWidth="2.9" vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="wave-caption">
        <span>your rhythm</span>
        <strong>steady and yours</strong>
      </div>
    </div>
  );
}

export default RhythmWave;
