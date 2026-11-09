function WordMarquee({ items, duration = 42 }) {
  return (
    <div className="marquee" style={{ "--marquee-duration": `${duration}s` }} aria-hidden="true">
      <div className="marquee-track">
        {[...items, ...items].map((item, index) => (
          <span className="marquee-item" key={`${item}-${index}`}>
            {item}
            <i className="marquee-dot" />
          </span>
        ))}
      </div>
    </div>
  );
}

export default WordMarquee;
