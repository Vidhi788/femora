function BrandMark({ variant = "default", className = "" }) {
  return (
    <div className={`brand ${variant === "inverse" ? "brand-inverse" : ""} ${className}`.trim()}>
      <div className="brand-mark" aria-hidden="true">
        F
      </div>

      <div className="brand-text">
        <strong>femora</strong>
        <span>wellness, understood</span>
      </div>
    </div>
  );
}

export default BrandMark;
