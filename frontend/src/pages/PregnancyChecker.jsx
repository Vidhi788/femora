import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, RefreshCw, Siren } from "lucide-react";
import { apiFetch } from "../api/http.js";
import UrgentActions from "../components/UrgentActions.jsx";
import "../styles/pcos.css"; // same look as the PCOS checker
import "../styles/pregnancy.css"; // only the extra option layout

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
const PREGNANCY_URL = `${API_BASE}/api/symptom-check/pregnancy`;
const HISTORY_URL = `${API_BASE}/api/symptom-check/history`;

// Values must match RED_FLAGS in PregnancyCheckService.java
const RED_FLAGS = [
  { v: "severe_bleeding", l: "Very heavy bleeding (soaking a pad every hour)" },
  { v: "severe_pelvic_pain", l: "Severe pain in the lower belly or pelvis, especially on one side" },
  { v: "shoulder_pain", l: "Pain at the tip of your shoulder" },
  { v: "fainting", l: "Fainting or feeling about to faint" },
  { v: "chest_pain", l: "Chest pain or trouble breathing" },
  { v: "cant_keep_fluids", l: "Being sick so often you can't keep any food or drink down" },
];

// key = field name in PregnancyCheckService.Request, cols = options per row
const QUESTIONS = [
  {
    key: "chance",
    label: "Is there a chance you could be pregnant?",
    cols: 3,
    options: [
      { v: "YES", l: "Yes" },
      { v: "NO", l: "No" },
      { v: "NOT_SURE", l: "Not sure" },
    ],
  },
  {
    key: "period",
    label: "How is your period right now?",
    cols: 2,
    options: [
      { v: "NOT_LATE", l: "Not late" },
      { v: "LATE", l: "Late" },
      { v: "MISSED_MONTHS", l: "Missed for 3 months or more" },
      { v: "NOT_SURE", l: "Not sure" },
    ],
  },
  {
    key: "test",
    label: "Have you taken a pregnancy test?",
    cols: 3,
    options: [
      { v: "NONE", l: "Not yet" },
      { v: "NEGATIVE", l: "Yes, negative" },
      { v: "POSITIVE", l: "Yes, positive" },
    ],
  },
];

// level values come from PregnancyCheckService.resultFor()
const LEVELS = {
  URGENT: { cls: "is-urgent", short: "Urgent" },
  POSITIVE_TEST: { cls: "is-neutral", short: "Positive test" },
  SEE_DOCTOR: { cls: "is-mid", short: "See a doctor" },
  OTHER_CAUSES: { cls: "is-neutral", short: "Other causes" },
  NOT_INDICATED: { cls: "is-low", short: "Nothing pointing to pregnancy" },
  RETEST: { cls: "is-mid", short: "Test again" },
  TOO_EARLY: { cls: "is-neutral", short: "Too early to tell" },
  TEST_NOW: { cls: "is-mid", short: "Take a test" },
};

function fmt(iso) {
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

function PregnancyChecker({ user, onBack, onToast, onFindDoctor }) {
  const [step, setStep] = useState(0);
  const [flags, setFlags] = useState([]);
  const [flagsDone, setFlagsDone] = useState(false);
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [past, setPast] = useState([]);

  const userId = user?.userId;

  const loadHistory = useCallback(() => {
    if (!userId) return;
    apiFetch(`${HISTORY_URL}?userId=${userId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => setPast(rows.filter((h) => h.category === "pregnancy").slice(0, 3)))
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  function toggleFlag(v) {
    setFlagsDone(true);
    setFlags((f) => (f.includes(v) ? f.filter((x) => x !== v) : [...f, v]));
  }

  const hasFlags = flags.length > 0;
  const questionsDone = QUESTIONS.every((q) => answers[q.key] !== undefined);

  async function submit() {
    if (!user?.userId) {
      setError("Please sign out and sign in again.");
      return;
    }
    setBusy(true);
    setError("");

    // A red flag is sent on its own: the backend returns "urgent" before using any other answer.
    const body = hasFlags
      ? { userId: user.userId, redFlags: flags }
      : { userId: user.userId, redFlags: [], ...answers };

    try {
      const res = await apiFetch(PREGNANCY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.message || "Could not run the check.");

      setResult(data);
      loadHistory();
    } catch (e) {
      const msg = e instanceof TypeError ? "Check that the backend is running." : e.message;
      setError(msg);
      onToast?.({ tone: "error", title: "Pregnancy check", message: msg });
    } finally {
      setBusy(false);
    }
  }

  function restart() {
    setResult(null);
    setStep(0);
    setFlags([]);
    setFlagsDone(false);
    setAnswers({});
    setError("");
  }

  const tone = result ? LEVELS[result.level] ?? LEVELS.TOO_EARLY : null;

  return (
    <div className="pcos-page">
      <div className="pcos-wrap">
        <button type="button" className="pcos-back" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" /> Back to dashboard
        </button>

        <header className="pcos-head">
          <h1>Pregnancy check</h1>
          <p>Answer a few questions to find out what to do next. It is not a diagnosis, and there are no wrong answers.</p>
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

            <UrgentActions level={result.level} onFindDoctor={onFindDoctor} />

            <p className="pcos-note">{result.disclaimer}</p>
            <p className="pcos-note">Femora saves only the date of this check, not your answers or the result.</p>

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
              {["Your situation", "Safety check"].map((t, i) => (
                <div key={t} className={`pcos-prog ${i < step ? "is-done" : ""} ${i === step ? "is-now" : ""}`}>
                  <small>{t}</small>
                </div>
              ))}
            </div>

            {step === 1 ? (
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

                {past.length ? (
                  <div className="pcos-past">
                    <p>Recent checks</p>
                    <ul>
                      {past.map((h) => (
                        <li key={h.id}>
                          <span>{fmt(h.createdAt)}</span>
                          <strong>Completed</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <h2>Your situation</h2>
                <p className="pcos-hint">
                  Choose the answer that fits best. Your cycle log is only used if you pick &quot;Not sure&quot; for
                  your period.
                </p>

                <div className="pcos-fields">
                  {QUESTIONS.map((q) => (
                    <div key={q.key} className="pcos-field">
                      <span className="pcos-q">{q.label}</span>
                      <div
                        className="pcos-choice preg-choice"
                        style={{ "--cols": q.cols }}
                        role="group"
                        aria-label={q.label}
                      >
                        {q.options.map((o) => (
                          <button
                            key={o.v}
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

export default PregnancyChecker;