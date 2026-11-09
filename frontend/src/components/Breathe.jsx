import { useEffect, useRef, useState } from "react";
import { Pause, Play, Wind } from "lucide-react";

const PHASES = [
  { key: "in", label: "Breathe in", short: "In", seconds: 4 },
  { key: "hold", label: "Hold", short: "Hold", seconds: 4 },
  { key: "out", label: "Breathe out", short: "Out", seconds: 4 },
  { key: "rest", label: "Rest", short: "Rest", seconds: 4 },
];

function Breathe() {
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PHASES[0].seconds);
  const [rounds, setRounds] = useState(0);
  const phaseStartedAt = useRef(0);

  useEffect(() => {
    if (!running) return undefined;

    phaseStartedAt.current = performance.now();

    const timer = window.setInterval(() => {
      const elapsed = performance.now() - phaseStartedAt.current;
      const phase = PHASES[phaseIndex];

      if (elapsed >= phase.seconds * 1000) {
        const nextIndex = (phaseIndex + 1) % PHASES.length;
        phaseStartedAt.current = performance.now();
        setPhaseIndex(nextIndex);
        setSecondsLeft(PHASES[nextIndex].seconds);
        if (nextIndex === 0) setRounds((count) => count + 1);
        return;
      }

      setSecondsLeft(Math.max(1, Math.ceil(phase.seconds - elapsed / 1000)));
    }, 120);

    return () => window.clearInterval(timer);
  }, [running, phaseIndex]);

  function toggle() {
    if (running) {
      setRunning(false);
      return;
    }

    setRounds(0);
    setPhaseIndex(0);
    setSecondsLeft(PHASES[0].seconds);
    setRunning(true);
  }

  const phase = PHASES[phaseIndex];
  const orbState = running ? phase.key : "idle";

  return (
    <article className="panel breathe-panel">
      <div className="breathe-copy">
        <p className="eyebrow eyebrow-plain">One minute reset</p>
        <h2>Slow down with box breathing</h2>
        <p className="breathe-text">
          Breathe in, hold, breathe out and rest, each for four counts. A slower rhythm helps your
          body settle, which can ease cramps and tension.
        </p>

        <ol className="breathe-steps" aria-label="Breathing steps">
          {PHASES.map((item, index) => (
            <li key={item.key} className={running && index === phaseIndex ? "is-on" : ""}>
              {item.short}
              <small>4s</small>
            </li>
          ))}
        </ol>

        <div className="breathe-actions">
          <button type="button" className="btn btn-primary btn-shine" onClick={toggle}>
            {running ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            <span className="btn-label">{running ? "Pause" : rounds > 0 ? "Keep going" : "Start breathing"}</span>
          </button>

          <span className="pill">
            <Wind size={14} aria-hidden="true" />
            {running ? `Round ${rounds + 1}` : rounds > 0 ? `${rounds} done` : "About 1 minute"}
          </span>
        </div>
      </div>

      <div className="breath-stage">
        <span className="breath-ring" aria-hidden="true" />
        <span className="breath-ring breath-ring-outer" aria-hidden="true" />

        <div className={`breath-orb is-${orbState}`} aria-hidden="true">
          <span className="breath-count">{running ? secondsLeft : "4"}</span>
          <span className="breath-phase">{running ? phase.label : "Ready"}</span>
        </div>
      </div>

      <p className="sr-only" role="status">
        {running ? phase.label : rounds > 0 ? "Paused" : "Breathing exercise ready"}
      </p>
    </article>
  );
}

export default Breathe;