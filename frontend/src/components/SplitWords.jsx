import { Fragment } from "react";

/**
 * Splits a phrase into words that each swap to a second layer on hover.
 * The clip box keeps a little extra room so descenders (y, g, p) stay intact.
 */
function SplitWords({ text, delay = 0, step = 70, tone = "warm" }) {
  const words = text.split(" ");

  return (
    <>
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <span className="swap-shell enter-up" style={{ "--delay": `${delay + index * step}ms` }}>
            <span className={`swap-word tone-${tone}`}>
              <span className="swap-word-base">{word}</span>
              <span className="swap-word-ghost" aria-hidden="true">
                {word}
              </span>
            </span>
          </span>
          {index < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}

export default SplitWords;
