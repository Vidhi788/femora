import { useEffect, useRef, useState } from "react";

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useCountUp(target, { duration = 1300, decimals = 0 } = {}) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));
  const frame = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
}

export default useCountUp;
