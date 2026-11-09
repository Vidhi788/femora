import { useState } from "react";
import { apiFetch } from "../api/http.js";
import UrgentActions from "../components/UrgentActions.jsx";
import { ArrowLeft, ArrowRight, Check, RefreshCw, Siren } from "lucide-react";
import ProductStrip from "../components/ProductStrip.jsx";
import "../styles/pcos.css";
import "../styles/products.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
const CHECK_URL = `${API_BASE}/api/symptom-check/backpain`;

// keys and values must match BackPainCheckService.Request
const QUESTIONS = [
  {
    key: "duration",
    label: "How long have you had the back pain?",
    options: [
      { v: "SHORT", l: "Less than 2 weeks" },
      { v: "MEDIUM", l: "2 to 6 weeks" },
      { v: "LONG", l: "More than 6 weeks" },
    ],
  },
  {
    key: "spread",
    label: "Where do you feel it?",
    options: [
      { v: "BACK_ONLY", l: "Only in my back" },
      { v: "BELOW_KNEE", l: "It travels down my leg, below the knee, or causes tingling" },
    ],
  },
  {
    key: "withPeriod",
    label: "Does it get worse around your period?",
    options: [
      { v: true, l: "Yes" },
      { v: false, l: "No" },
    ],
  },
];

// values must match RED_FLAGS in BackPainCheckService.java
const RED_FLAGS = [
  { v: "saddle_numbness", l: "Numbness around the groin, buttocks or inner thighs" },
  { v: "bladder_bowel", l: "New trouble controlling your bladder or bowels" },
  { v: "leg_weakness", l: "New weakness in a leg or foot" },
  { v: "fever", l: "Fever together with the back pain" },
  { v: "injury", l: "Severe pain after a fall, accident or hit" },
];

const LEVELS = {
  URGENT: { cls: "is-urgent", short: "Urgent" },
  SEE_DOCTOR: { cls: "is-high", short: "See a doctor" },
  PERIOD_RELATED: { cls: "is-low", short: "Possibly period-related" },
  SELF_CARE: { cls: "is-low", short: "Self-care" },
};

// Products are shown only when self-care is the right advice.
const PRODUCT_LEVELS = new Set(["SELF_CARE", "PERIOD_RELATED"]);

function BackPainChecker({ user, onBack, onToast, onFindDoctor }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState([]);
  const [flagsDone, setFlagsDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const userId = user?.userId;
  const hasFlags = flags.length > 0;
  const questionsDone = QUESTIONS.every((q) => answers[q.key] !== undefined);

  function toggleFlag(v) {
    setFlagsDone(true);
    setFlags((f) => (f.includes(v) ? f.filter((x) => x !== v) : [...f, v]));
  }

  async function submit() {
    if (!userId) {
      setError("Please sign out and sign in again.");
      return;
    }
    setBusy(true);
    setError("");

    // A red flag is sent on its own: the backend returns "urgent" before using any other answer.
    const body = hasFlags ? { userId, redFlags: flags } : { userId, redFlags: [], ...answers };

    try {
      const res = await apiFetch(CHECK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 400) setStep(0);
        throw new Error(data.message || "Could not run the check.");
      }
      setResult(data);
    } catch (e) {
      const msg = e instanceof TypeError ? "Check that the backend is running." : e.message;
      setError(msg);
      onToast?.({ tone: "error", title: "Back pain checker", message: msg });
    } finally {
      setBusy(false);
    }
  }

  function restart() {
    setResult(null);
    setStep(0);
    setAnswers({});
    setFlags([]);
    setFlagsDone(false);
    setError("");
  }

  const tone = result ? LEVELS[result.level] ?? LEVELS.SELF_CARE : null;

  return (
    <div className="pcos-page">
      <div className="pcos-wrap">
        <button type="button" className="pcos-back" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" /> Back to dashboard
        </button>

        <header className="pcos-head">
          <h1>Back pain check</h1>
          <p>Answer a few questions to find out what to do next. It is not a diagnosis.</p>
        </header>

        {result ? (
          <section className={`pcos-card pcos-result ${tone.cls}`} role={result.level === "URGENT" ? "alert" : "status"}>
            <p className="pcos-result-label">
              {result.level === "URGENT" ? <Siren size={15} aria-hidden="true" /> : null}
              {tone.short}
            </p>
            <h2>{result.title}</h2>
            <p className="pcos-result-text">{result.message}</p>

            {result.nextSteps?.length ? (
              <ul className="pcos-steps">
                {result.nextSteps.map((s) => (
                  <li key={s}>
                    <Check size={15} aria-hidden="true" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {PRODUCT_LEVELS.has(result.level) ? <ProductStrip category="back_pain" heading="Things that may help" /> : null}

            <UrgentActions level={result.level} onFindDoctor={onFindDoctor} />

            <p className="pcos-note">{result.disclaimer}</p>

            <div className="pcos-actions">
              <button type="button" className="btn btn-ghost" onClick={restart}>
                <RefreshCw size={15} aria-hidden="true" /> Check again
              </button>
              <button type="button" className="btn btn-primary" onClick={onBack}>
                Back to dashboard
              </button>
            </div>
          </section>
        ) : (
          <section className="pcos-card">
            <div className="pcos-progress" aria-label={`Step ${step + 1} of 2`}>
              {["Your back pain", "Safety check"].map((t, i) => (
                <div key={t} className={`pcos-prog ${i < step ? "is-done" : ""} ${i === step ? "is-now" : ""}`}>
                  <small>{t}</small>
                </div>
              ))}
            </div>

            {step === 0 ? (
              <>
                <h2>Your back pain</h2>
                <p className="pcos-hint">Choose the answer that fits best.</p>

                <div className="pcos-fields">
                  {QUESTIONS.map((q) => (
                    <div key={q.key} className="pcos-field">
                      <span className="pcos-q">{q.label}</span>
                      <div className="pcos-choice bp-choice" role="group" aria-label={q.label}>
                        {q.options.map((o) => (
                          <button
                            key={o.l}
                            type="button"
                            className={answers[q.key] === o.v ? "is-picked" : ""}
                            aria-pressed={answers[q.key] === o.v}
                            onClick={() => setAnswers((a) => ({ ...a, [q.key]: o.v }))}
                          >
                            {o.l}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2>Last check: do any of these apply right now?</h2>
                <p className="pcos-hint">Pick all that apply, or choose none.</p>

                <div className="pcos-flags">
                  {RED_FLAGS.map((f) => (
                    <button
                      key={f.v}
                      type="button"
                      className={flags.includes(f.v) ? "is-picked" : ""}
                      aria-pressed={flags.includes(f.v)}
                      onClick={() => toggleFlag(f.v)}
                    >
                      <span className="pcos-box" aria-hidden="true">
                        {flags.includes(f.v) ? <Check size={13} /> : null}
                      </span>
                      {f.l}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={flagsDone && !hasFlags ? "is-picked" : ""}
                    aria-pressed={flagsDone && !hasFlags}
                    onClick={() => {
                      setFlags([]);
                      setFlagsDone(true);
                    }}
                  >
                    <span className="pcos-box" aria-hidden="true">
                      {flagsDone && !hasFlags ? <Check size={13} /> : null}
                    </span>
                    None of these
                  </button>
                </div>
              </>
            )}

            {error ? (
              <p className="pcos-error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="pcos-actions">
              <button type="button" className="btn btn-ghost" disabled={step === 0 || busy} onClick={() => setStep(0)}>
                Back
              </button>

              {step === 0 ? (
                <button type="button" className="btn btn-primary" disabled={!questionsDone} onClick={() => setStep(1)}>
                  Next <ArrowRight size={15} aria-hidden="true" />
                </button>
              ) : (
                <button type="button" className="btn btn-primary btn-shine" disabled={!flagsDone || busy} onClick={submit}>
                  {busy ? "Checking..." : hasFlags ? "Get guidance" : "See my result"}
                </button>
              )}
            </div>
          </section>
        )}

        <p className="pcos-foot">Femora is an academic healthcare project. It does not provide a medical diagnosis.</p>
      </div>
    </div>
  );
}

export default BackPainChecker;