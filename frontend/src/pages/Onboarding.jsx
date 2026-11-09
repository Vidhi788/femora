
import { useState } from "react";
import { apiFetch, API_BASE, getStoredUser } from "../api/http.js";
import "../styles/onboarding.css";

function Onboarding({ onComplete }) {
  const [form, setForm] = useState({
    age: "",
    heightCm: "",
    weightKg: "",
    lastPeriodDate: "",
    averageCycleLength: "28",
    periodDuration: "5",
    regularCycles: true,
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const savedUser = getStoredUser();

    if (!savedUser?.userId || !savedUser?.token) {
      setMessage("Your login session was not found. Please sign in again.");
      return;
    }

    if (!form.age || !form.lastPeriodDate) {
      setMessage("Please enter your age and last period date.");
      return;
    }

    setLoading(true);
    setMessage("");

    const profileData = {
      userId: Number(savedUser.userId),
      age: Number(form.age),
      heightCm: form.heightCm ? Number(form.heightCm) : null,
      weightKg: form.weightKg ? Number(form.weightKg) : null,
      lastPeriodDate: form.lastPeriodDate,
      averageCycleLength: Number(form.averageCycleLength),
      periodDuration: Number(form.periodDuration),
      regularCycles: form.regularCycles,
    };

    try {
      const response = await apiFetch(
        `${API_BASE}/api/profile`,
        {
          method: "POST",
          body: JSON.stringify(profileData),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || `Unable to save profile (${response.status}).`
        );
      }

      onComplete?.(data);
    } catch (error) {
      setMessage(error.message || "Unable to save your profile.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="onboarding-page">
      <section className="onboarding-intro">
        <div className="onboarding-brand">
          <span>F</span>
          <div>
            <strong>femora</strong>
            <small>wellness, understood</small>
          </div>
        </div>

        <div className="intro-content">
          <p className="onboarding-kicker">
            YOUR PERSONAL WELLNESS SPACE
          </p>

          <h1>
            Let's make this
            <em> space yours.</em>
          </h1>

          <p>
            Tell us a little about yourself so Femora can
            create a more thoughtful cycle and wellness
            experience for you.
          </p>
        </div>

        <div className="intro-note">
          <span>✦</span>
          <div>
            <strong>Your information stays personal.</strong>
            <p>
              These details are used to create your
              wellness estimates.
            </p>
          </div>
        </div>
      </section>

      <section className="onboarding-form-section">
        <div className="onboarding-card">
          <p className="step-label">LET'S GET STARTED</p>

          <h2>Tell us about you.</h2>

          <p className="form-description">
            You can update these details later from your
            profile settings.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Age
                <input
                  name="age"
                  type="number"
                  min="13"
                  max="100"
                  required
                  value={form.age}
                  onChange={handleChange}
                  placeholder="21"
                />
              </label>

              <label>
                Height
                <div className="input-with-unit">
                  <input
                    name="heightCm"
                    type="number"
                    min="50"
                    max="250"
                    value={form.heightCm}
                    onChange={handleChange}
                    placeholder="160"
                  />
                  <span>cm</span>
                </div>
              </label>
            </div>

            <label>
              Weight
              <div className="input-with-unit">
                <input
                  name="weightKg"
                  type="number"
                  min="20"
                  max="300"
                  step="0.1"
                  value={form.weightKg}
                  onChange={handleChange}
                  placeholder="55"
                />
                <span>kg</span>
              </div>
            </label>

            <label>
              When did your last period start?
              <input
                name="lastPeriodDate"
                type="date"
                required
                value={form.lastPeriodDate}
                onChange={handleChange}
              />
            </label>

            <div className="form-grid">
              <label>
                Average cycle length
                <select
                  name="averageCycleLength"
                  value={form.averageCycleLength}
                  onChange={handleChange}
                >
                  <option value="21">21 days</option>
                  <option value="24">24 days</option>
                  <option value="28">28 days</option>
                  <option value="30">30 days</option>
                  <option value="32">32 days</option>
                  <option value="35">35 days</option>
                </select>
              </label>

              <label>
                Period duration
                <select
                  name="periodDuration"
                  value={form.periodDuration}
                  onChange={handleChange}
                >
                  <option value="3">3 days</option>
                  <option value="4">4 days</option>
                  <option value="5">5 days</option>
                  <option value="6">6 days</option>
                  <option value="7">7 days</option>
                </select>
              </label>
            </div>

            <label className="regular-cycle">
              <input
                name="regularCycles"
                type="checkbox"
                checked={form.regularCycles}
                onChange={handleChange}
              />
              <span>My cycles are usually regular</span>
            </label>

            {message && (
              <p className="onboarding-message" role="alert">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="onboarding-submit"
              disabled={loading}
            >
              {loading
                ? "Creating your wellness space..."
                : "Continue to my dashboard"}
              <span>→</span>
            </button>
          </form>

          <p className="onboarding-disclaimer">
            Femora provides wellness estimates and does not
            provide medical diagnosis.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Onboarding;
