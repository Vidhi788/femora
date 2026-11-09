import { useState } from "react";
import { ArrowLeft, Globe, LocateFixed, MapPin, Navigation, Phone, Search, Stethoscope } from "lucide-react";
import HospitalMap from "./Hospitalmap.jsx";
import "../styles/pcos.css";
import "../styles/doctors.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
const HOSPITALS_URL = `${API_BASE}/api/hospitals`;

const telHref = (phone) => `tel:${phone.replace(/[^\d+]/g, "")}`;
const place = (h) => [h.name, h.area, h.city].filter(Boolean).join(", ");
const contactSearchUrl = (h) =>
  `https://www.google.com/search?q=${encodeURIComponent(`${h.name} ${h.city || ""} appointment phone`)}`;

// Live (OpenStreetMap) results have exact coordinates. Saved ones are found by name.
const directionsUrl = (h) => {
  const dest = h.source === "osm" && h.latitude != null ? `${h.latitude},${h.longitude}` : place(h);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
};

function DoctorFinder({ onBack }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [center, setCenter] = useState(null);
  const [focus, setFocus] = useState(null);
  const [mode, setMode] = useState("text"); // "text" or "gps"
  const [placeName, setPlaceName] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(params, nextMode) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${HOSPITALS_URL}?${new URLSearchParams(params)}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Could not load hospitals.");

      setResults(data.results ?? []);
      setCenter(data.centerLat != null ? { lat: data.centerLat, lng: data.centerLng } : null);
      setPlaceName(data.place || "");
      setNotice(data.notice || "");
      setMode(nextMode);
    } catch (e) {
      setError(e instanceof TypeError ? "Check that the backend is running." : e.message);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    if (!query.trim()) {
      setError("Type your area, city or pincode, or use your location.");
      return;
    }
    run({ q: query.trim() }, "text");
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Your browser can't share your location. Please type your area instead.");
      return;
    }
    setBusy(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => run({ lat: pos.coords.latitude, lng: pos.coords.longitude }, "gps"),
      () => {
        setBusy(false);
        setError("We couldn't get your location. Allow location access, or type your area instead.");
      },
      { timeout: 10000 }
    );
  }

  // A counter (not Date.now) so the same pin can be focused again on every click.
  function showOnMap(h) {
    setFocus((prev) => ({ id: h.id, n: (prev?.n ?? 0) + 1 }));
    document.getElementById("doc-map")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const hasPins = results?.some((h) => h.latitude != null);

  return (
    <div className="pcos-page">
      <div className="pcos-wrap doc-wide">
        <button type="button" className="pcos-back" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" /> Back to dashboard
        </button>

        <header className="pcos-head">
          <h1>Find a doctor</h1>
          <p>
            Enter your area or use your location to see hospitals nearby, then call, visit their website or get
            directions.
          </p>
        </header>

        <p className="doc-emergency" role="note">
          In an emergency, call <b>112</b> or go to the nearest hospital. Don&apos;t wait to book.
        </p>

        <form className="doc-form" onSubmit={onSubmit}>
          <div className="doc-field">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              placeholder="Area, city or pincode, e.g. Koregaon Park, Pune"
              aria-label="Your area, city or pincode"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Searching..." : "Search"}
          </button>
          <button type="button" className="btn btn-ghost doc-locate" onClick={useMyLocation} disabled={busy}>
            <LocateFixed size={16} aria-hidden="true" /> Use my location
          </button>
        </form>

        {error ? (
          <p className="pcos-error" role="alert">
            {error}
          </p>
        ) : null}

        {notice ? <p className="doc-notice">{notice}</p> : null}

        {results ? (
          <section aria-label="Results" aria-live="polite">
            <p className="doc-count">
              {results.length
                ? `${results.length} ${results.length === 1 ? "place" : "places"} ${
                    mode === "gps" ? "near you" : `near ${placeName || query.trim()}`
                  }${results[0].distanceKm != null ? ", nearest first" : ""}`
                : "No places found."}
            </p>

            {hasPins || center ? (
              <div className="doc-map-wrap">
                <HospitalMap results={results} center={center} focus={focus} />
              </div>
            ) : null}

            {!results.length ? (
              <p className="doc-empty">Try the nearest big city, a pincode, or use your location.</p>
            ) : null}

            <div className="doc-list">
              {results.map((h) => (
                <article key={h.id} className="doc-card">
                  <div className="doc-top">
                    <span className="doc-icon" aria-hidden="true">
                      <Stethoscope size={20} />
                    </span>
                    <div className="doc-title">
                      <h2>{h.name}</h2>
                      <p>
                        {h.type}
                        {h.specialties ? ` · ${h.specialties}` : ""}
                      </p>
                    </div>
                    {h.distanceKm != null ? <span className="doc-dist">{h.distanceKm} km</span> : null}
                  </div>

                  <p className="doc-addr">
                    <MapPin size={14} aria-hidden="true" />
                    {[h.address, h.area, h.city].filter(Boolean).join(", ") || "Address not listed"}
                  </p>

                  <div className="doc-actions">
                    {h.phone ? (
                      <a className="doc-btn is-main" href={telHref(h.phone)}>
                        <Phone size={15} aria-hidden="true" /> Call {h.phone}
                      </a>
                    ) : (
                      <a
                        className="doc-btn is-main"
                        href={contactSearchUrl(h)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Phone size={15} aria-hidden="true" /> Find phone on Google
                      </a>
                    )}
                    {h.website ? (
                      <a className="doc-btn" href={h.website} target="_blank" rel="noopener noreferrer">
                        <Globe size={15} aria-hidden="true" /> Book online
                      </a>
                    ) : null}
                    <a className="doc-btn" href={directionsUrl(h)} target="_blank" rel="noopener noreferrer">
                      <Navigation size={15} aria-hidden="true" /> Directions
                    </a>
                    {h.latitude != null ? (
                      <button type="button" className="doc-btn" onClick={() => showOnMap(h)}>
                        <MapPin size={15} aria-hidden="true" /> Show on map
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <p className="doc-note">
          Appointments are booked directly with the hospital, by phone or on its website. Femora does not book
          appointments. Please call to confirm timings and availability.
        </p>
        <p className="doc-note">
          Hospital details come from your Femora saved list and from OpenStreetMap contributors, so phone numbers can
          be missing or out of date. Map data &copy; OpenStreetMap contributors.
        </p>
        <p className="pcos-foot">Femora is an academic healthcare project. It does not provide a medical diagnosis.</p>
      </div>
    </div>
  );
}

export default DoctorFinder;