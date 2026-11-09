
import { useState } from "react";

import { ArrowRight, Heart, Leaf, Mail, Sparkles } from "lucide-react";

import { authApi } from "../api/client.js";

import BrandMark from "../components/BrandMark.jsx";
import HeroUnderline from "../components/HeroUnderline.jsx";
import PasswordField from "../components/PasswordField.jsx";
import RollingWord from "../components/RollingWord.jsx";
import SplitWords from "../components/SplitWords.jsx";
import SwapText from "../components/SwapText.jsx";
import ForgotPassword from "../components/ForgotPassword.jsx";
import WordMarquee from "../components/WordMarquee.jsx";

import { usePointerParallax } from "../hooks/usePointerParallax.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HIGHLIGHTS = [
  {
    icon: Heart,
    tone: "tone-rose",
    title: "Your rhythm",
    text: "Understand your cycle",
  },
  {
    icon: Sparkles,
    tone: "tone-gold",
    title: "Gentle insights",
    text: "Simple information, clearly explained",
  },
  {
    icon: Leaf,
    tone: "tone-sage",
    title: "Feel supported",
    text: "Resources when you need them",
  },
];

const MARQUEE = [
  "cycle awareness",
  "rest",
  "hydration",
  "movement",
  "sleep",
  "gentle reminders",
];

function Login({
  onCreateAccount,
  onNavigate,
  onAuthenticated,
  onAuthenticatedForOnboarding,
  onToast,
  initialEmail = "",
  newUserEmail = "",
}) {
  const heroRef = usePointerParallax();

  const [form, setForm] = useState({
    email: initialEmail,
    password: "",
  });

  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const [feedback, setFeedback] = useState({
    type: "idle",
    message: "",
    status: 0,
  });

  const [mode, setMode] = useState("signin");

  function handleChange(field) {
    return (event) => {
      const { value } = event.target;

      setForm((current) => ({
        ...current,
        [field]: value,
      }));

      setFeedback({
        type: "idle",
        message: "",
        status: 0,
      });
    };
  }

  // Navigate to registration.
  function goToRegister() {
    const email = form.email.trim();

    if (typeof onCreateAccount === "function") {
      onCreateAccount(email);
      return;
    }

    if (typeof onNavigate === "function") {
      onNavigate("register", email);
      return;
    }

    onToast?.({
      tone: "info",
      title: "Create an account",
      message: "Sign-up is not connected yet. Please check App.jsx.",
    });
  }

  // Login authentication.
  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.email || !form.password) {
      setFeedback({
        type: "error",
        message: "Please enter both your email and password.",
        status: 0,
      });
      return;
    }

    if (!EMAIL_PATTERN.test(form.email.trim())) {
      setFeedback({
        type: "error",
        message: "That email address does not look complete.",
        status: 0,
      });
      return;
    }

    setLoading(true);

    setFeedback({
      type: "idle",
      message: "",
      status: 0,
    });

    try {
      // Authenticate using backend.
      const data = await authApi.login({
        email: form.email.trim(),
        password: form.password,
      });

      // Verify that backend returned JWT.
      if (!data.token) {
        throw new Error(
          "The server did not send a login token. Please update the backend."
        );
      }

      // Store authenticated user information.
      const loggedInUser = {
        userId: data.userId,
        name: data.name,
        email: data.email || form.email.trim(),
        token: data.token,
        remember,
      };

      // Identify a newly registered user.
      const isNewlyRegisteredUser =
        Boolean(newUserEmail) &&
        newUserEmail.trim().toLowerCase() ===
          form.email.trim().toLowerCase();

      if (isNewlyRegisteredUser) {
        // Newly registered users complete onboarding.
        onAuthenticatedForOnboarding?.(
          loggedInUser,
          "Complete your profile to personalize Femora."
        );
      } else {
        // Existing users go directly to dashboard.
        onAuthenticated(
          loggedInUser,
          data.message || "You are signed in."
        );
      }
    } catch (error) {
      const offline = error instanceof TypeError;

      setFeedback({
        type: "error",
        message: offline
          ? "Cannot reach the server. Check that the backend is running."
          : error.message,
        status: error.status || 0,
      });
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
          <p
            className="eyebrow enter-up"
            style={{ "--delay": "60ms" }}
          >
            Your wellness, your space
          </p>

          <h1 className="hero-title">
            <span className="hero-line">
              <SplitWords text="Listen to" delay={150} />
            </span>

            <em className="hero-line hero-line-accent">
              <SplitWords
                text="your body."
                delay={340}
                tone="ink"
              />
              <HeroUnderline delay={900} />
            </em>
          </h1>

          <p
            className="hero-copy enter-up"
            style={{ "--delay": "560ms" }}
          >
            Understand your{" "}
            <RollingWord
              words={["body", "mood", "rest", "flow"]}
            />{" "}
            and explore trusted wellness information at a calmer,
            kinder pace.
          </p>

          <div className="chip-stack">
            {HIGHLIGHTS.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  className="chip enter-up"
                  key={item.title}
                  style={{
                    "--delay": `${700 + index * 90}ms`,
                  }}
                >
                  <span
                    className={`chip-icon ${item.tone}`}
                    aria-hidden="true"
                  >
                    <Icon size={17} />
                  </span>

                  <span className="chip-text">
                    <strong className="chip-title">
                      <SwapText text={item.title} />
                    </strong>

                    <span className="chip-copy">
                      {item.text}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>

          <aside
            className="note-card enter-up"
            style={{ "--delay": "980ms" }}
          >
            <span className="note-mark" aria-hidden="true">
              &ldquo;
            </span>

            <div className="note-swap">
              <p className="note-a">
                Small, informed steps can make caring for yourself
                feel more manageable.
              </p>

              <p className="note-b" aria-hidden="true">
                Rest counts too - your body notices every kindness.
              </p>
            </div>
          </aside>
        </div>

        <WordMarquee items={MARQUEE} />
      </section>

      <section className="auth-panel">
        <div className="form-card enter-scale">
          {mode === "forgot" ? (
            <ForgotPassword
              initialEmail={form.email}
              onBack={() => setMode("signin")}
              onDone={(doneEmail) => {
                setForm({
                  email: doneEmail,
                  password: "",
                });

                setFeedback({
                  type: "idle",
                  message: "",
                  status: 0,
                });

                setMode("signin");

                onToast?.({
                  tone: "good",
                  title: "Password updated",
                  message: "Sign in with your new password.",
                });
              }}
            />
          ) : (
            <>
              <p className="eyebrow eyebrow-plain">
                Welcome back
              </p>

              <h2 className="form-title">
                Sign in to Femora
              </h2>

              <p className="form-subtitle">
                Continue your personal wellness journey.
              </p>

              <form
                className="form-body"
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="field">
                  <label htmlFor="login-email">
                    Email address
                  </label>

                  <div className="input-wrap">
                    <Mail
                      className="field-icon"
                      size={18}
                      aria-hidden="true"
                    />

                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      value={form.email}
                      onChange={handleChange("email")}
                    />
                  </div>
                </div>

                <PasswordField
                  id="login-password"
                  value={form.password}
                  onChange={handleChange("password")}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />

                <div className="form-row">
                  <label
                    className="check-line"
                    htmlFor="login-remember"
                  >
                    <input
                      id="login-remember"
                      type="checkbox"
                      checked={remember}
                      onChange={(event) =>
                        setRemember(event.target.checked)
                      }
                    />

                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    className="text-link"
                    onClick={() => setMode("forgot")}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-shine btn-block"
                  disabled={loading}
                >
                  {loading ? (
                    <span
                      className="spinner"
                      aria-hidden="true"
                    />
                  ) : null}

                  <span className="btn-label">
                    {loading ? "Signing in..." : "Sign in"}
                  </span>

                  {loading ? null : (
                    <span
                      className="btn-arrow"
                      aria-hidden="true"
                    >
                      <ArrowRight size={18} />
                    </span>
                  )}
                </button>

                {feedback.type === "error" ? (
                  <p className="form-message" role="alert">
                    {feedback.message}
                  </p>
                ) : null}

                {feedback.status === 401 ? (
                  <p className="switch-line">
                    No account yet?{" "}
                    <button
                      type="button"
                      className="text-link"
                      onClick={goToRegister}
                    >
                      Create one with this email
                    </button>
                  </p>
                ) : null}
              </form>

              <p className="switch-line">
                New to Femora?{" "}
                <button
                  type="button"
                  className="text-link"
                  onClick={goToRegister}
                >
                  <SwapText text="Create an account" />
                </button>
              </p>

              <p className="note-line">
                Femora is an academic healthcare technology project.
                It does not provide medical diagnosis.
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default Login;
