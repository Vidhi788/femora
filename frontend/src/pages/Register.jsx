import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Heart,
  Leaf,
  Mail,
  Ruler,
  Scale,
  Sparkles,
  User,
} from "lucide-react";

import { API_BASE, authApi } from "../api/client.js";
import BrandMark from "../components/BrandMark.jsx";
import HeroUnderline from "../components/HeroUnderline.jsx";
import PasswordField from "../components/PasswordField.jsx";
import SplitWords from "../components/SplitWords.jsx";
import WordMarquee from "../components/WordMarquee.jsx";
import { usePointerParallax } from "../hooks/usePointerParallax.js";
import "../styles/register.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STEPS = [
  { icon: User, tone: "tone-rose", title: "Your account", text: "Name, email and a password" },
  { icon: Heart, tone: "tone-gold", title: "Your details", text: "Age, height, weight and cycle" },
  { icon: Leaf, tone: "tone-sage", title: "Your dashboard", text: "Ready the moment you finish" },
];

const MARQUEE = ["cycle awareness", "rest", "hydration", "movement", "sleep", "gentle reminders"];

// Password rules: 8+ characters, at least one letter, one number and one special character.
function passwordChecks(password) {
  return {
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9\s]/.test(password),
  };
}

function todayIso() {
  return new Date().toLocaleDateString("en-CA");
}

function Register({ onNavigate, onAuthenticated, initialEmail = "" }) {
  const heroRef = usePointerParallax();

  const [step, setStep] = useState(1);
  const [account, setAccount] = useState({ name: "", email: initialEmail, password: "" });
  const [details, setDetails] = useState({
    age: "",
    heightCm: "",
    weightKg: "",
    lastPeriodDate: "",
    averageCycleLength: "28",
    periodDuration: "5",
    regularCycles: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Remember the created account so a retry does not register again (that would give a 409).
  const accountRef = useRef(null);

  // Live BMI preview so the person sees what the dashboard will show.
  const bmi = useMemo(() => {
    const meters = Number(details.heightCm) / 100;
    const kg = Number(details.weightKg);
    return meters > 0 && kg > 0 ? (kg / (meters * meters)).toFixed(1) : null;
  }, [details.heightCm, details.weightKg]);

  function changeAccount(field) {
    return (event) => {
      const { value } = event.target;
      setAccount((current) => ({ ...current, [field]: value }));
      // Editing the account after it was created would be out of sync, so start fresh.
      accountRef.current = null;
      setError("");
    };
  }

  function changeDetails(field) {
    return (event) => {
      const { type, checked, value } = event.target;
      setDetails((current) => ({ ...current, [field]: type === "checkbox" ? checked : value }));
      setError("");
    };
  }

  // Step 1 -> step 2 (nothing is saved yet)
  function handleNext(event) {
    event.preventDefault();

    if (!account.name.trim() || !account.email.trim() || !account.password) {
      setError("Please fill in your name, email and password.");
      return;
    }

    if (!EMAIL_PATTERN.test(account.email.trim())) {
      setError("That email address does not look complete.");
      return;
    }

    const checks = passwordChecks(account.password);

    if (!checks.length || !checks.letter || !checks.number || !checks.special) {
      setError("Your password needs 8+ characters with a letter, a number and a special character.");
      return;
    }

    setError("");
    setStep(2);
  }

  function validateDetails() {
    const age = Number(details.age);
    const height = Number(details.heightCm);
    const weight = Number(details.weightKg);
    const cycle = Number(details.averageCycleLength);
    const duration = Number(details.periodDuration);

    if (!details.age || age < 13 || age > 100) return "Enter an age between 13 and 100.";
    if (!details.heightCm || height < 50 || height > 250) return "Enter your height in cm (50 to 250).";
    if (!details.weightKg || weight < 20 || weight > 300) return "Enter your weight in kg (20 to 300).";
    if (!details.lastPeriodDate) return "Choose the date your last period started.";
    if (details.lastPeriodDate > todayIso()) return "Your last period date cannot be in the future.";
    if (!cycle || cycle < 20 || cycle > 45) return "Cycle length should be between 20 and 45 days.";
    if (!duration || duration < 1 || duration > 10) return "Period length should be between 1 and 10 days.";
    return "";
  }

  // Step 2: create the account, save the profile with the JWT, then open the dashboard.
  async function handleCreate(event) {
    event.preventDefault();

    const problem = validateDetails();
    if (problem) {
      setError(problem);
      return;
    }

    setLoading(true);
    setError("");

    const name = account.name.trim();
    const email = account.email.trim();

    try {
      // 1. Create the account once and get a JWT.
      if (!accountRef.current) {
        const created = await authApi.register({ name, email, password: account.password });

        let userId = created.userId;
        let token = created.token;

        // If register does not return a token, sign in to get one.
        if (!token) {
          const session = await authApi.login({ email, password: account.password });
          token = session.token;
          userId = userId ?? session.userId;
        }

        if (!token) {
          throw new Error("Account created, but we could not sign you in. Please sign in.");
        }

        accountRef.current = { userId, token };
      }

      const { userId, token } = accountRef.current;

      // 2. Save the profile WITH the token.
      const response = await fetch(`${API_BASE}/api/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: Number(userId),
          age: Number(details.age),
          heightCm: Number(details.heightCm),
          weightKg: Number(details.weightKg),
          lastPeriodDate: details.lastPeriodDate,
          averageCycleLength: Number(details.averageCycleLength),
          periodDuration: Number(details.periodDuration),
          regularCycles: details.regularCycles,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Could not save your details (${response.status}).`);
      }

      // 3. Only now open the dashboard, with the token included.
      onAuthenticated(
        { userId, name, email, token, remember: true },
        "Your account and details are saved."
      );
    } catch (err) {
      // 409 = the email is already registered, so send them back to fix it.
      if (err.status === 409) setStep(1);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell page-fade">
      <section className="auth-hero" ref={heroRef}>
        <div className="orb-field" aria-hidden="true">
          <span className="orb orb-one" />
          <span className="orb orb-two" />
          <span className="orb orb-three" />
        </div>

        <div className="grain" aria-hidden="true" />

        <BrandMark />

        <div className="hero-stack">
          <p className="eyebrow enter-up" style={{ "--delay": "60ms" }}>
            Create your space
          </p>

          <h1 className="hero-title">
            <span className="hero-line">
              <SplitWords text="Begin with" delay={150} />
            </span>

            <em className="hero-line hero-line-accent">
              <SplitWords text="yourself." delay={340} tone="ink" />
              <HeroUnderline delay={900} />
            </em>
          </h1>

          <p className="hero-copy enter-up" style={{ "--delay": "560ms" }}>
            Two short steps, then Femora builds your cycle view from your own details.
          </p>

          <div className="chip-stack">
            {STEPS.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  className="chip enter-up"
                  key={item.title}
                  style={{ "--delay": `${700 + index * 90}ms` }}
                >
                  <span className={`chip-icon ${item.tone}`} aria-hidden="true">
                    <Icon size={17} />
                  </span>

                  <span className="chip-text">
                    <strong className="chip-title">{item.title}</strong>
                    <span className="chip-copy">{item.text}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <WordMarquee items={MARQUEE} />
      </section>

      <section className="auth-panel">
        <div className="form-card enter-scale">
          <div className="step-track" aria-label={`Step ${step} of 2`}>
            <span className="is-on" />
            <span className={step === 2 ? "is-on" : ""} />
          </div>

          <p className="eyebrow eyebrow-plain">{step === 1 ? "Step 1 of 2" : "Step 2 of 2"}</p>

          <h2 className="form-title">{step === 1 ? "Create your account" : "Tell us about you"}</h2>

          <p className="form-subtitle">
            {step === 1
              ? "Your name, email and a password."
              : "These details fill in your dashboard and your cycle predictions."}
          </p>

          <form
            className="form-body"
            onSubmit={step === 1 ? handleNext : handleCreate}
            noValidate
          >
            {step === 1 ? (
              <>
                <div className="field">
                  <label htmlFor="reg-name">Full name</label>
                  <div className="input-wrap">
                    <User className="field-icon" size={18} aria-hidden="true" />
                    <input
                      id="reg-name"
                      type="text"
                      placeholder="Your name"
                      autoComplete="name"
                      value={account.name}
                      onChange={changeAccount("name")}
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="reg-email">Email address</label>
                  <div className="input-wrap">
                    <Mail className="field-icon" size={18} aria-hidden="true" />
                    <input
                      id="reg-email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      value={account.email}
                      onChange={changeAccount("email")}
                    />
                  </div>
                </div>

                <PasswordField
                  id="reg-password"
                  value={account.password}
                  onChange={changeAccount("password")}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />

                <ul className="pw-rules" aria-label="Password requirements">
                  {[
                    ["length", "8+ characters"],
                    ["letter", "A letter"],
                    ["number", "A number"],
                    ["special", "A special character (! @ # $ ...)"],
                  ].map(([key, label]) => (
                    <li key={key} className={passwordChecks(account.password)[key] ? "is-met" : ""}>
                      {label}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <div className="field-grid">
                  <div className="field">
                    <label htmlFor="reg-age">Age</label>
                    <div className="input-wrap">
                      <CalendarDays className="field-icon" size={18} aria-hidden="true" />
                      <input
                        id="reg-age"
                        type="number"
                        min="13"
                        max="100"
                        placeholder="23"
                        value={details.age}
                        onChange={changeDetails("age")}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="reg-height">Height (cm)</label>
                    <div className="input-wrap">
                      <Ruler className="field-icon" size={18} aria-hidden="true" />
                      <input
                        id="reg-height"
                        type="number"
                        min="50"
                        max="250"
                        placeholder="155"
                        value={details.heightCm}
                        onChange={changeDetails("heightCm")}
                      />
                    </div>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="reg-weight">
                    Weight (kg){bmi ? <span className="bmi-hint"> · BMI {bmi}</span> : null}
                  </label>
                  <div className="input-wrap">
                    <Scale className="field-icon" size={18} aria-hidden="true" />
                    <input
                      id="reg-weight"
                      type="number"
                      min="20"
                      max="300"
                      step="0.1"
                      placeholder="65"
                      value={details.weightKg}
                      onChange={changeDetails("weightKg")}
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="reg-last">When did your last period start?</label>
                  <div className="input-wrap">
                    <CalendarDays className="field-icon" size={18} aria-hidden="true" />
                    <input
                      id="reg-last"
                      type="date"
                      max={todayIso()}
                      value={details.lastPeriodDate}
                      onChange={changeDetails("lastPeriodDate")}
                    />
                  </div>
                </div>

                <div className="field-grid">
                  <div className="field">
                    <label htmlFor="reg-cycle">Cycle length (days)</label>
                    <div className="input-wrap">
                      <Sparkles className="field-icon" size={18} aria-hidden="true" />
                      <input
                        id="reg-cycle"
                        type="number"
                        min="20"
                        max="45"
                        value={details.averageCycleLength}
                        onChange={changeDetails("averageCycleLength")}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="reg-duration">Period length (days)</label>
                    <div className="input-wrap">
                      <Sparkles className="field-icon" size={18} aria-hidden="true" />
                      <input
                        id="reg-duration"
                        type="number"
                        min="1"
                        max="10"
                        value={details.periodDuration}
                        onChange={changeDetails("periodDuration")}
                      />
                    </div>
                  </div>
                </div>

                <label className="check-line" htmlFor="reg-regular">
                  <input
                    id="reg-regular"
                    type="checkbox"
                    checked={details.regularCycles}
                    onChange={changeDetails("regularCycles")}
                  />
                  <span>My cycles are usually regular</span>
                </label>
              </>
            )}

            {error ? (
              <p className="form-message" role="alert">
                {error}
              </p>
            ) : null}

            <div className="step-actions">
              {step === 2 ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setError("");
                    setStep(1);
                  }}
                  disabled={loading}
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  Back
                </button>
              ) : null}

              <button type="submit" className="btn btn-primary btn-shine btn-block" disabled={loading}>
                {loading ? <span className="spinner" aria-hidden="true" /> : null}
                <span className="btn-label">
                  {step === 1 ? "Continue" : loading ? "Creating your space..." : "Create account"}
                </span>
                {loading ? null : (
                  <span className="btn-arrow" aria-hidden="true">
                    <ArrowRight size={18} />
                  </span>
                )}
              </button>
            </div>
          </form>

          <p className="switch-line">
            Already have an account?{" "}
            <button type="button" className="text-link" onClick={() => onNavigate("login")}>
              Sign in
            </button>
          </p>

          <p className="note-line">
            Femora is an academic healthcare technology project. It does not provide medical
            diagnosis.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Register;