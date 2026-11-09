import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, KeyRound, Lock, Mail } from "lucide-react";

import { API_BASE } from "../api/client.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 60;

async function post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong. Please try again.");
  return data;
}

const friendly = (e) =>
  e instanceof TypeError ? "Cannot reach the server. Check that the backend is running." : e.message;

/**
 * Lives inside the sign-in card (Login.jsx swaps it in), so it uses the same look.
 * Step 1: ask for the email. Step 2: enter the emailed code and choose a new password.
 */
function ForgotPassword({ initialEmail = "", onBack, onDone }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Count down the "send again" wait.
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  async function sendCode(event) {
    event?.preventDefault();

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("That email address does not look complete.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await post("/api/auth/forgot-password", { email: email.trim() });
      setStep("reset");
      setCooldown(RESEND_SECONDS);
    } catch (e) {
      setError(friendly(e));
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event) {
    event.preventDefault();

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (password.length < 8) {
      setError("Your new password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await post("/api/auth/reset-password", { email: email.trim(), code, newPassword: password });
      onDone(email.trim());
    } catch (e) {
      setError(friendly(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <p className="eyebrow eyebrow-plain">Reset password</p>

      <h2 className="form-title">{step === "email" ? "Forgot your password?" : "Check your email"}</h2>

      <p className="form-subtitle">
        {step === "email"
          ? "Enter your email and we will send you a 6-digit code."
          : "If this email is registered, a 6-digit code is on its way. It expires in 10 minutes."}
      </p>

      {step === "email" ? (
        <form className="form-body" onSubmit={sendCode} noValidate>
          <div className="field">
            <label htmlFor="fp-email">Email address</label>

            <div className="input-wrap">
              <Mail className="field-icon" size={18} aria-hidden="true" />
              <input
                id="fp-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-shine btn-block" disabled={loading}>
            {loading ? <span className="spinner" aria-hidden="true" /> : null}
            <span className="btn-label">{loading ? "Sending..." : "Send code"}</span>
            {loading ? null : (
              <span className="btn-arrow" aria-hidden="true">
                <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>
      ) : (
        <form className="form-body" onSubmit={resetPassword} noValidate>
          <div className="field">
            <label htmlFor="fp-code">6-digit code</label>

            <div className="input-wrap">
              <KeyRound className="field-icon" size={18} aria-hidden="true" />
              <input
                id="fp-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="fp-password">New password</label>

            <div className="input-wrap">
              <Lock className="field-icon" size={18} aria-hidden="true" />
              <input
                id="fp-password"
                type={show ? "text" : "password"}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="fp-confirm">Confirm new password</label>

            <div className="input-wrap">
              <Lock className="field-icon" size={18} aria-hidden="true" />
              <input
                id="fp-confirm"
                type={show ? "text" : "password"}
                placeholder="Type it again"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setError("");
                }}
              />
            </div>
          </div>

          <label className="check-line" htmlFor="fp-show">
            <input id="fp-show" type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
            <span>Show passwords</span>
          </label>

          <button type="submit" className="btn btn-primary btn-shine btn-block" disabled={loading}>
            {loading ? <span className="spinner" aria-hidden="true" /> : null}
            <span className="btn-label">{loading ? "Saving..." : "Set new password"}</span>
            {loading ? null : (
              <span className="btn-arrow" aria-hidden="true">
                <ArrowRight size={18} />
              </span>
            )}
          </button>

          <p className="switch-line">
            Did not get a code?{" "}
            <button type="button" className="text-link" disabled={cooldown > 0 || loading} onClick={sendCode}>
              {cooldown > 0 ? `Send again in ${cooldown}s` : "Send again"}
            </button>
          </p>
        </form>
      )}

      {error ? (
        <p className="form-message" role="alert">
          {error}
        </p>
      ) : null}

      <p className="switch-line">
        <button type="button" className="text-link" onClick={onBack}>
          <ArrowLeft size={14} aria-hidden="true" /> Back to sign in
        </button>
      </p>
    </>
  );
}

export default ForgotPassword;