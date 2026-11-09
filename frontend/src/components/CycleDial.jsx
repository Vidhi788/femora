const CYCLE_LENGTH = 28;

const PHASES = [
  { name: "Menstrual", range: "Day 1-5", from: 1, to: 5, color: "#cf6f58" },
  { name: "Follicular", range: "Day 6-13", from: 6, to: 13, color: "#8fae86" },
  { name: "Ovulation", range: "Day 14-16", from: 14, to: 16, color: "#d99a56" },
  { name: "Luteal", range: "Day 17-28", from: 17, to: 28, color: "#8a5b7c" },
];

export const PHASE_LEGEND = PHASES;

export function phaseForDay(day) {
  return PHASES.find((phase) => day >= phase.from && day <= phase.to) || PHASES[PHASES.length - 1];
}

function polar(center, radius, day) {
  const angle = ((day - 1) / CYCLE_LENGTH) * 360 - 90;
  const radians = (angle * Math.PI) / 180;

  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians),
  };
}

function arcPath(center, radius, fromDay, toDay) {
  const start = polar(center, radius, fromDay);
  const end = polar(center, radius, toDay + 1);
  const sweep = ((toDay + 1 - fromDay) / CYCLE_LENGTH) * 360;
  const largeArc = sweep > 180 ? 1 : 0;

  return [
    `M ${start.x.toFixed(2)} ${start.y.toFixed(2)}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
  ].join(" ");
}

function CycleDial({ day = 1, size = 196 }) {
  const view = 200;
  const center = view / 2;
  const ringRadius = 82;
  const today = phaseForDay(day);
  const marker = polar(center, ringRadius, day);

  return (
    <div
      className="dial"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Cycle day ${day} of ${CYCLE_LENGTH}, ${today.name} phase`}
    >
      <svg viewBox={`0 0 ${view} ${view}`} aria-hidden="true">
        <circle
          cx={center}
          cy={center}
          r={ringRadius}
          fill="none"
          stroke="rgba(124, 95, 114, 0.12)"
          strokeWidth="5"
        />

        {PHASES.map((phase) => (
          <path
            key={phase.name}
            d={arcPath(center, ringRadius, phase.from, phase.to)}
            fill="none"
            stroke={phase.color}
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.24"
          />
        ))}

        {Array.from({ length: CYCLE_LENGTH }, (_, index) => {
          const dayNumber = index + 1;
          const phase = phaseForDay(dayNumber);
          const inner = polar(center, 67, dayNumber);
          const outer = polar(center, 75, dayNumber);
          const elapsed = dayNumber <= day;

          return (
            <line
              key={dayNumber}
              className="dial-tick"
              style={{ "--i": index }}
              x1={inner.x.toFixed(2)}
              y1={inner.y.toFixed(2)}
              x2={outer.x.toFixed(2)}
              y2={outer.y.toFixed(2)}
              stroke={elapsed ? phase.color : "rgba(124, 95, 114, 0.22)"}
              strokeWidth={elapsed ? 4.4 : 3.2}
              strokeLinecap="round"
            />
          );
        })}

        <circle className="dial-halo" cx={marker.x} cy={marker.y} r="12" fill={today.color} />
        <circle
          className="dial-marker"
          cx={marker.x}
          cy={marker.y}
          r="5.6"
          fill="#fff"
          stroke={today.color}
          strokeWidth="3.4"
        />
      </svg>

      <div className="dial-center">
        <span className="dial-day">{day}</span>
        <span className="dial-label">day of {CYCLE_LENGTH}</span>
        <span className="dial-phase">{today.name}</span>
      </div>
    </div>
  );
}

export { CYCLE_LENGTH };
export default CycleDial;
