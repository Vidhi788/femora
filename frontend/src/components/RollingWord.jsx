/**
 * A four word vertical carousel. The cycle is seamless because the last
 * slide repeats the first word. Keep the list at four items - the keyframes
 * in components.css are written for exactly four.
 */
function RollingWord({ words, className = "" }) {
  const slides = [...words, words[0]];

  return (
    <span
      className={`rolling ${className}`.trim()}
      style={{ "--roll-duration": `${words.length * 2800}ms` }}
    >
      <span className="rolling-track" aria-hidden="true">
        {slides.map((word, index) => (
          <span className="rolling-item" key={`${word}-${index}`}>
            {word}
          </span>
        ))}
      </span>

      <span className="sr-only">{words[0]}</span>
    </span>
  );
}

export default RollingWord;
