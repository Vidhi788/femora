
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  RefreshCw,
  Search,
  Siren,
  X,
} from "lucide-react";

import "../styles/pcos.css";
import "../styles/general.css";

import { apiFetch } from "../api/http.js";
import UrgentActions from "../components/UrgentActions.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

const SYMPTOMS_URL =
  `${API_BASE}/api/symptom-check/general/symptoms`;

const CHECK_URL =
  `${API_BASE}/api/symptom-check/general`;

const HISTORY_URL =
  `${API_BASE}/api/symptom-check/history`;

// Values must match RED_FLAGS in GeneralCheckService.java.
const RED_FLAGS = [
  { v: "chest_pain", l: "Chest pain" },
  { v: "trouble_breathing", l: "Trouble breathing" },
  { v: "fainting", l: "Fainting or feeling about to faint" },
  { v: "severe_bleeding", l: "Very heavy bleeding" },
  {
    v: "sudden_weakness",
    l: "Sudden weakness on one side, or trouble speaking",
  },
  { v: "confusion", l: "Sudden confusion" },
];

// Values must match GeneralCheckService.java.
const LEVELS = {
  URGENT: {
    cls: "is-urgent",
    short: "Urgent",
  },
  CLOSE_MATCH: {
    cls: "is-high",
    short: "Closest match",
  },
  POSSIBLE: {
    cls: "is-mid",
    short: "Possible match",
  },
  UNCLEAR: {
    cls: "is-neutral",
    short: "Unclear",
  },
};

function fmt(iso) {
  if (!iso) return "Date unavailable";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function GeneralChecker({
  user,
  onBack,
  onToast,
  onFindDoctor,
}) {
  const [all, setAll] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [tries, setTries] = useState(0);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);

  const [step, setStep] = useState(0);

  const [flags, setFlags] = useState([]);
  const [flagsDone, setFlagsDone] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [result, setResult] = useState(null);
  const [past, setPast] = useState([]);

  const userId = user?.userId;

  // Load symptoms from Spring Boot / ML service.
  useEffect(() => {
    let cancelled = false;

    apiFetch(SYMPTOMS_URL)
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            "The symptom list could not be loaded. Please try again."
          );
        }

        return res.json();
      })
      .then((list) => {
        if (cancelled) return;

        setAll(Array.isArray(list) ? list : []);
        setLoadError("");
      })
      .catch((err) => {
        if (cancelled) return;

        setLoadError(
          err instanceof TypeError
            ? "Check that the backend is running."
            : err.message
        );
      });

    return () => {
      cancelled = true;
    };
  }, [tries]);

  // Load recent general symptom checks.
  const loadHistory = useCallback(() => {
    if (!userId) return;

    apiFetch(
      `${HISTORY_URL}?userId=${encodeURIComponent(userId)}`
    )
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => {
        if (!Array.isArray(rows)) {
          setPast([]);
          return;
        }

        setPast(
          rows
            .filter((h) => h.category === "general")
            .slice(0, 3)
        );
      })
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Map symptom names to display labels.
  const labels = useMemo(
    () =>
      Object.fromEntries(
        all.map((symptom) => [
          symptom.name,
          symptom.label,
        ])
      ),
    [all]
  );

  // Search symptoms.
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();

    return all.filter((symptom) =>
      symptom.label.toLowerCase().includes(q)
    );
  }, [all, query]);

  // Toggle selected symptoms.
  function toggleSymptom(name) {
    setSelected((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name]
    );
  }

  // Toggle emergency red flags.
  function toggleFlag(value) {
    setFlagsDone(true);

    setFlags((current) => {
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

      return updated;
    });
  }

  // Choose "None of these".
  function chooseNone() {
    setFlags([]);
    setFlagsDone(true);
  }

  const hasFlags = flags.length > 0;
  const noneSelected = flagsDone && !hasFlags;

  // Submit symptom check.
  async function submit() {
    if (!userId) {
      setError("Please sign out and sign in again.");
      return;
    }

    if (!flagsDone) {
      setError("Please complete the safety check.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const res = await apiFetch(CHECK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          symptoms: selected,
          redFlags: flags,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 400) {
          setStep(0);
        }

        throw new Error(
          data.message || "Could not run the check."
        );
      }

      setResult(data);
      loadHistory();
    } catch (err) {
      const message =
        err instanceof TypeError
          ? "Check that the backend is running."
          : err.message;

      setError(message);

      onToast?.({
        tone: "error",
        title: "Symptom checker",
        message,
      });
    } finally {
      setBusy(false);
    }
  }

  // Start a new symptom check.
  function restart() {
    setResult(null);
    setStep(0);

    setSelected([]);
    setQuery("");

    setFlags([]);
    setFlagsDone(false);

    setError("");
  }

  const tone = result
    ? LEVELS[result.level] ?? LEVELS.UNCLEAR
    : null;

  return (
    <div className="pcos-page">
      <div className="pcos-wrap">

        {/* Back navigation */}
        <button
          type="button"
          className="pcos-back"
          onClick={onBack}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to dashboard
        </button>

        {/* Header */}
        <header className="pcos-head">
          <h1>Symptom checker</h1>

          <p>
            Pick the symptoms you have and see which conditions
            to talk to a doctor about. It is not a diagnosis.
          </p>
        </header>

        {/* Result screen */}
        {result ? (
          <section
            className={`pcos-card pcos-result ${tone.cls}`}
            role={
              result.level === "URGENT"
                ? "alert"
                : "status"
            }
          >
            <p className="pcos-result-label">
              {result.level === "URGENT" ? (
                <Siren
                  size={15}
                  aria-hidden="true"
                />
              ) : null}

              {tone.short}
            </p>

            <h2>{result.title}</h2>

            <p className="pcos-result-text">
              {result.message}
            </p>

            {/* Next steps */}
            {result.nextSteps?.length ? (
              <ul className="pcos-steps">
                {result.nextSteps.map((item) => (
                  <li key={item}>
                    <Check
                      size={15}
                      aria-hidden="true"
                    />

                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {/* Doctor / urgent actions */}
            <UrgentActions
              level={result.level}
              onFindDoctor={onFindDoctor}
            />

            <p className="pcos-note">
              {result.disclaimer}
            </p>

            <div className="pcos-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={restart}
              >
                <RefreshCw
                  size={15}
                  aria-hidden="true"
                />

                Check again
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={onBack}
              >
                Back to dashboard
              </button>
            </div>
          </section>
        ) : (

          /* Symptom selection / safety check */
          <section className="pcos-card">

            {/* Progress indicator */}
            <div
              className="pcos-progress"
              aria-label={`Step ${step + 1} of 2`}
            >
              {["Your symptoms", "Safety check"].map(
                (title, index) => (
                  <div
                    key={title}
                    className={`pcos-prog ${
                      index < step ? "is-done" : ""
                    } ${
                      index === step ? "is-now" : ""
                    }`}
                  >
                    <small>{title}</small>
                  </div>
                )
              )}
            </div>

            {/* Step 1: Symptoms */}
            {step === 0 ? (
              <>
                <h2>What symptoms do you have?</h2>

                <p className="pcos-hint">
                  Pick at least 2 that you have now.
                  The more you add, the more useful the result.
                </p>

                {/* Loading error */}
                {loadError ? (
                  <div
                    className="pcos-error"
                    role="alert"
                  >
                    {loadError}{" "}

                    <button
                      type="button"
                      className="gen-retry"
                      onClick={() =>
                        setTries((count) => count + 1)
                      }
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Search */}
                    <div className="pcos-input gen-search">
                      <Search
                        size={16}
                        aria-hidden="true"
                      />

                      <input
                        type="search"
                        placeholder="Search symptoms, e.g. cough"
                        aria-label="Search symptoms"
                        value={query}
                        onChange={(event) =>
                          setQuery(event.target.value)
                        }
                      />
                    </div>

                    {/* Selected symptoms */}
                    {selected.length > 0 ? (
                      <div
                        className="gen-chips"
                        aria-label="Selected symptoms"
                      >
                        {selected.map((name) => (
                          <button
                            key={name}
                            type="button"
                            className="gen-chip"
                            onClick={() =>
                              toggleSymptom(name)
                            }
                          >
                            {labels[name] ?? name}

                            <X
                              size={13}
                              aria-hidden="true"
                            />

                            <span className="gen-sr">
                              Remove
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {/* Symptoms list */}
                    <div className="pcos-flags gen-list">
                      {!all.length ? (
                        <p className="pcos-hint">
                          Loading symptoms...
                        </p>
                      ) : null}

                      {all.length > 0 && !shown.length ? (
                        <p className="pcos-hint">
                          No symptoms match "{query}".
                        </p>
                      ) : null}

                      {shown.map((symptom) => {
                        const isSelected =
                          selected.includes(symptom.name);

                        return (
                          <button
                            key={symptom.name}
                            type="button"
                            className={
                              isSelected
                                ? "is-picked"
                                : ""
                            }
                            aria-pressed={isSelected}
                            onClick={() =>
                              toggleSymptom(symptom.name)
                            }
                          >
                            <span
                              className="pcos-box"
                              aria-hidden="true"
                            >
                              {isSelected ? (
                                <Check size={13} />
                              ) : null}
                            </span>

                            {symptom.label}
                          </button>
                        );
                      })}
                    </div>

                    <p className="gen-count">
                      {selected.length} selected
                    </p>
                  </>
                )}
              </>

            ) : (

              /* Step 2: Safety check */
              <>
                <h2>
                  Last check: do any of these apply right now?
                </h2>

                <p className="pcos-hint">
                  Pick all that apply, or choose none.
                </p>

                <div className="pcos-flags">

                  {/* Red flags */}
                  {RED_FLAGS.map((flag) => {
                    const isSelected =
                      flags.includes(flag.v);

                    return (
                      <button
                        key={flag.v}
                        type="button"
                        className={
                          isSelected
                            ? "is-picked"
                            : ""
                        }
                        aria-pressed={isSelected}
                        onClick={() =>
                          toggleFlag(flag.v)
                        }
                      >
                        <span
                          className="pcos-box"
                          aria-hidden="true"
                        >
                          {isSelected ? (
                            <Check size={13} />
                          ) : null}
                        </span>

                        {flag.l}
                      </button>
                    );
                  })}

                  {/* None of these */}
                  <button
                    type="button"
                    className={
                      noneSelected
                        ? "is-picked"
                        : ""
                    }
                    aria-pressed={noneSelected}
                    onClick={chooseNone}
                  >
                    <span
                      className="pcos-box"
                      aria-hidden="true"
                    >
                      {noneSelected ? (
                        <Check size={13} />
                      ) : null}
                    </span>

                    None of these
                  </button>
                </div>

                {/* Recent checks */}
                {past.length > 0 ? (
                  <div className="pcos-past">
                    <p>Recent checks</p>

                    <ul>
                      {past.map((history, index) => (
                        <li
                          key={
                            history.id ??
                            `${history.createdAt}-${index}`
                          }
                        >
                          <span>
                            {fmt(history.createdAt)}
                          </span>

                          <strong>
                            {
                              (
                                LEVELS[history.level] ??
                                LEVELS.UNCLEAR
                              ).short
                            }
                          </strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}

            {/* Error message */}
            {error ? (
              <p
                className="pcos-error"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            {/* Navigation buttons */}
            <div className="pcos-actions">

              <button
                type="button"
                className="btn btn-ghost"
                disabled={step === 0 || busy}
                onClick={() => {
                  setError("");
                  setStep(0);
                }}
              >
                Back
              </button>

              {step === 0 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={selected.length < 2}
                  onClick={() => {
                    setError("");
                    setStep(1);
                  }}
                >
                  Next

                  <ArrowRight
                    size={15}
                    aria-hidden="true"
                  />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-shine"
                  disabled={!flagsDone || busy}
                  onClick={submit}
                >
                  {busy
                    ? "Checking..."
                    : hasFlags
                      ? "Get guidance"
                      : "See my result"}
                </button>
              )}
            </div>
          </section>
        )}

        {/* Footer disclaimer */}
        <p className="pcos-foot">
          Femora is an academic healthcare project.
          It does not provide a medical diagnosis.
        </p>
      </div>
    </div>
  );
}

export default GeneralChecker;
