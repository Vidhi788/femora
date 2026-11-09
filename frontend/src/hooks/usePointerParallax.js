import { useEffect, useRef } from "react";

/**
 * Writes a normalised pointer position into --px / --py on the host element
 * so decorative layers can drift with the cursor. Desktop pointers only.
 */
export function usePointerParallax() {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (!window.matchMedia) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return undefined;

    let frame = 0;

    function handleMove(event) {
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        node.style.setProperty("--px", x.toFixed(3));
        node.style.setProperty("--py", y.toFixed(3));
      });
    }

    function handleLeave() {
      cancelAnimationFrame(frame);
      node.style.setProperty("--px", "0");
      node.style.setProperty("--py", "0");
    }

    node.addEventListener("pointermove", handleMove);
    node.addEventListener("pointerleave", handleLeave);

    return () => {
      cancelAnimationFrame(frame);
      node.removeEventListener("pointermove", handleMove);
      node.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  return ref;
}

export default usePointerParallax;
