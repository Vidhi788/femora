import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Check, Palette, User } from "lucide-react";

import { ApiError, profileApi } from "../api/client.js";
import { THEMES, getStoredTheme, setTheme } from "../theme.js";
import ReminderCard from "../components/ReminderCard.jsx";
import "../styles/settings.css";

function todayIso() {
  return new Date().toLocaleDateString("en-CA");
}

function toForm(profile, summary) {
  return {
    age: profile.age != null ? String(profile.age) : "",
    heightCm: profile.heightCm != null ? String(profile.heightCm) : "",
    weightKg: profile.weightKg != null ? String(profile.weightKg) : "",
    // The cycle summary reflects periods logged from the dashboard too.
    lastPeriodDate: summary?.lastPeriodDate || profile.lastPeriodDate || "",
    averageCycleLength: String(profile.averageCycleLength ?? 28),
    periodDuration: String(profile.periodDuration ?? 5),
    regularCycles: profile.regularCycles ?? true,
  };
}

function validate(form) {
  const errors = {};
  const age = Number(form.age);
  const height = Number(form.heightCm);
  const weight = Number(form.weightKg);

  if (!form.age || !Number.isInteger(age) || age < 13 || age > 100) {
    errors.age = "Enter an age between 13 and 100.";
  }
  if (form.heightCm !== "" && (!(height >= 50) || height > 250)) {
    errors.heightCm = "Height should be between 50 and 250 cm.";
  }
  if (form.weightKg !== "" && (!(weight >= 20) || weight > 300)) {
    errors.weightKg = "Weight should be between 20 and 300 kg.";
  }
  if (!form.lastPeriodDate) {
    errors.lastPeriodDate = "Choose the day your last period started.";
  } else if (form.lastPeriodDate > todayIso()) {
    errors.lastPeriodDate = "That date is in the future.";
  }
  return errors;
}

function rangeOptions(min, max, current) {
  const values = new Set();
  for (let n = min; n <= max; n += 1) values.add(n);
  // Keep an existing saved value selectable even if it is outside the range.
  if (Number.isFinite(Number(current))) values.add(Number(current));
  return [...values].sort((a, b) => a - b);
}

function Settings({ user, onBack, onToast, onProfileMissing }) {
  const [theme, setThemeState] = useState(getStoredTheme);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [loadError, setLoadError] = useState("");
  const [tries, setTries] = useState(0);
  const [baseline, setBaseline] = useState(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!user?.userId) return undefined;
    let cancelled = false;

    Promise.all([
      profileApi.get(user.userId),
      profileApi.cycleSummary(user.userId).catch(() => null),
    ])
      .then(([profile, summary]) => {
        if (cancelled) return;
        const next = toForm(profile, summary);
        setBaseline(next);
        setForm(next);
        setStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) {
          onProfileMissing?.();
          return;
        }
        setLoadError(error.message);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [tries, user?.userId, onProfileMissing]);

  const dirty = useMemo(
    () => Boolean(form && baseline && JSON.stringify(form) !== JSON.stringify(baseline)),
    [form, baseline]
  );

  function chooseTheme(id) {
    setThemeState(id);
    setTheme(id);
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSaveError("");
  }

  const discard = useCallback(() => {
    setForm(baseline);
    setErrors({});
    setSaveError("");
  }, [baseline]);

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    setSaveError("");

    const payload = {
      userId: user.userId,
      age: Number(form.age),
      heightCm: form.heightCm === "" ? null : Number(form.heightCm),
      weightKg: form.weightKg === "" ? null : Number(form.weightKg),
      // Only send the date when it changed, so an untouched date never
      // rewrites period history.
      lastPeriodDate: form.lastPeriodDate !== baseline.lastPeriodDate ? form.lastPeriodDate : null,
      averageCycleLength: Number(form.averageCycleLength),
      periodDuration: Number(form.periodDuration),
      regularCycles: form.regularCycles,
    };

    try {
      await profileApi.update(payload);
      setBaseline(form);
      onToast?.({
        tone: "good",
        title: "Settings saved",
        message: "Your cycle predictions will use the new details.",
      });
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="set-page">
      <div className="set-wrap">
        <header className="set-head">
          <button type="button" className="set-back" onClick={onBack}>
            <ArrowLeft size={16} aria-hidden="true" />
            Back to dashboard
          </button>
          <h1>Settings</h1>
          <p>Make Femora look the way you like, and keep your details current so your estimates stay useful.</p>
        </header>

        <section className="set-card" aria-labelledby="set-theme-title">
          <div className="set-card-head">
            <span className="set-card-icon"><Palette size={18} aria-hidden="true" /></span>
            <div>
              <h2 id="set-theme-title">Appearance</h2>
              <p>Applies instantly and is remembered on this device.</p>
            </div>
          </div>

          <div className="set-themes" role="radiogroup" aria-label="Colour theme">
            {THEMES.map((item) => {
              const active = theme === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`set-theme ${active ? "is-active" : ""}`}
                  onClick={() => chooseTheme(item.id)}
                >
                  <span className="set-swatch" style={{ background: item.swatch.bg }} aria-hidden="true">
                    <span className="set-swatch-card" style={{ background: item.swatch.card }}>
                      <i style={{ background: item.swatch.ink }} />
                      <i style={{ background: item.swatch.ink }} />
                    </span>
                    <span className="set-swatch-dot" style={{ background: item.swatch.accent }} />
                  </span>
                  <span className="set-theme-name">
                    {item.name}
                    {active ? <Check size={14} aria-hidden="true" /> : null}
                  </span>
                  <span className="set-theme-note">{item.note}</span>
                </button>
              );
            })}
          </div>
        </section>

        {status === "loading" ? (
          <p className="set-state" role="status">Loading your details...</p>
        ) : null}

        {status === "error" ? (
          <div className="set-state set-state-error" role="alert">
            <p>{loadError}</p>
            <button type="button" className="set-btn set-btn-ghost" onClick={() => { setStatus("loading"); setTries((n) => n + 1); }}>
              Try again
            </button>
          </div>
        ) : null}

        {status === "ready" && form ? (
          <form onSubmit={handleSubmit} noValidate>
            <section className="set-card" aria-labelledby="set-body-title">
              <div className="set-card-head">
                <span className="set-card-icon"><User size={18} aria-hidden="true" /></span>
                <div>
                  <h2 id="set-body-title">About you</h2>
                  <p>These feed your BMI and the PCOS checker.</p>
                </div>
              </div>

              <div className="set-grid">
                <label className="set-field">
                  <span>Age</span>
                  <input
                    name="age" type="number" inputMode="numeric" min="13" max="100"
                    value={form.age} onChange={handleChange}
                    aria-invalid={Boolean(errors.age)} aria-describedby={errors.age ? "err-age" : undefined}
                  />
                  {errors.age ? <small id="err-age" className="set-error">{errors.age}</small> : null}
                </label>

                <label className="set-field">
                  <span>Height</span>
                  <div className="set-unit">
                    <input
                      name="heightCm" type="number" inputMode="decimal" min="50" max="250"
                      value={form.heightCm} onChange={handleChange}
                      aria-invalid={Boolean(errors.heightCm)} aria-describedby={errors.heightCm ? "err-height" : undefined}
                    />
                    <em>cm</em>
                  </div>
                  {errors.heightCm ? <small id="err-height" className="set-error">{errors.heightCm}</small> : null}
                </label>

                <label className="set-field">
                  <span>Weight</span>
                  <div className="set-unit">
                    <input
                      name="weightKg" type="number" inputMode="decimal" min="20" max="300" step="0.1"
                      value={form.weightKg} onChange={handleChange}
                      aria-invalid={Boolean(errors.weightKg)} aria-describedby={errors.weightKg ? "err-weight" : undefined}
                    />
                    <em>kg</em>
                  </div>
                  {errors.weightKg ? <small id="err-weight" className="set-error">{errors.weightKg}</small> : null}
                </label>
              </div>
            </section>

            <section className="set-card" aria-labelledby="set-cycle-title">
              <div className="set-card-head">
                <span className="set-card-icon"><CalendarDays size={18} aria-hidden="true" /></span>
                <div>
                  <h2 id="set-cycle-title">Your cycle</h2>
                  <p>Changing these updates your dial, phase and next period date.</p>
                </div>
              </div>

              <div className="set-grid">
                <label className="set-field set-field-wide">
                  <span>Last period started</span>
                  <input
                    name="lastPeriodDate" type="date" max={todayIso()}
                    value={form.lastPeriodDate} onChange={handleChange}
                    aria-invalid={Boolean(errors.lastPeriodDate)} aria-describedby={errors.lastPeriodDate ? "err-date" : undefined}
                  />
                  {errors.lastPeriodDate ? <small id="err-date" className="set-error">{errors.lastPeriodDate}</small> : null}
                </label>

                <label className="set-field">
                  <span>Average cycle length</span>
                  <select name="averageCycleLength" value={form.averageCycleLength} onChange={handleChange}>
                    {rangeOptions(21, 45, form.averageCycleLength).map((n) => (
                      <option key={n} value={n}>{n} days</option>
                    ))}
                  </select>
                </label>

                <label className="set-field">
                  <span>Period duration</span>
                  <select name="periodDuration" value={form.periodDuration} onChange={handleChange}>
                    {rangeOptions(2, 10, form.periodDuration).map((n) => (
                      <option key={n} value={n}>{n} days</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="set-check">
                <input name="regularCycles" type="checkbox" checked={form.regularCycles} onChange={handleChange} />
                <span>My cycles are usually regular</span>
              </label>
            </section>

            <div className={`set-savebar ${dirty ? "is-visible" : ""}`} aria-hidden={!dirty}>
              <p role="status">{saveError || "You have unsaved changes."}</p>
              <div className="set-savebar-actions">
                <button type="button" className="set-btn set-btn-ghost" onClick={discard} disabled={saving || !dirty} tabIndex={dirty ? 0 : -1}>
                  Discard
                </button>
                <button type="submit" className="set-btn set-btn-primary" disabled={saving || !dirty} tabIndex={dirty ? 0 : -1}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </form>
        ) : null}

        {/* Reminders live outside the profile form because they have their own Save button. */}
        {status === "ready" ? (
          <ReminderCard user={user} onToast={onToast} />
        ) : null}

        <p className="set-note">Femora provides wellness estimates and does not provide medical diagnosis.</p>
      </div>
    </main>
  );
}

export default Settings;