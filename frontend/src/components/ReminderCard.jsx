import { useEffect, useState } from "react";
import { Bell, CalendarPlus, Download, Send } from "lucide-react";

import { apiFetch, API_BASE } from "../api/http.js";

// Keep in sync with femora.reminder.days-before on the backend.
const REMIND_DAYS = 2;

const EMPTY = {
  enabled: false,
  consent: false,
};

const ROW = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 16,
};

function fromServer(data) {
  return {
    enabled: Boolean(data.enabled),
    consent: Boolean(data.consent),
  };
}

// Date -> 20261111
function compactDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

// Reminder settings card for the Settings page (email + calendar):
//   <ReminderCard user={user} onToast={onToast} />
function ReminderCard({ user, onToast }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(Boolean(user?.userId));
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.userId) return undefined;

    let cancelled = false;

    async function load() {
      try {
        const response = await apiFetch(
          `${API_BASE}/api/reminders?userId=${encodeURIComponent(user.userId)}`
        );
        const data = await response.json().catch(() => ({}));

        if (!cancelled && response.ok) {
          setForm(fromServer(data));
        }
      } catch {
        // Keep the defaults if the server cannot be reached.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [user?.userId]);

  function change(field) {
    return (event) => {
      setForm((current) => ({ ...current, [field]: event.target.checked }));
      setError("");
    };
  }

  async function save(event) {
    event.preventDefault();
    setBusy("save");
    setError("");

    try {
      const response = await apiFetch(`${API_BASE}/api/reminders`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          channel: "EMAIL",
          phoneNumber: "",
          enabled: form.enabled,
          consent: form.consent,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Could not save your reminder settings."
        );
      }

      setForm(fromServer(data));

      onToast?.({
        tone: "good",
        title: "Reminder settings saved",
        message: form.enabled
          ? "We will email you 2 days before your next period."
          : "Reminders are switched off.",
      });
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Cannot reach the server. Check that the backend is running."
          : err.message
      );
    } finally {
      setBusy("");
    }
  }

  async function sendTest() {
    setBusy("test");
    setError("");

    try {
      const response = await apiFetch(
        `${API_BASE}/api/reminders/test?userId=${encodeURIComponent(
          user.userId
        )}`,
        { method: "POST" }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Could not send the test reminder.");
      }

      onToast?.({
        tone: "good",
        title: "Test reminder sent",
        message: "Check your inbox (and spam). The calendar file is attached.",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  // One tap: opens Google Calendar with the reminder already filled in. No file needed.
  async function addToGoogleCalendar() {
    setBusy("google");
    setError("");

    // Open the tab right away (inside the click) so browsers do not block it.
    const tab = window.open("about:blank", "_blank");

    try {
      const response = await apiFetch(
        `${API_BASE}/api/cycle/summary?userId=${encodeURIComponent(
          user.userId
        )}`
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.nextPeriodDate) {
        throw new Error(
          data.message ||
            "Log a period on your dashboard first, so we can predict your next one."
        );
      }

      const [year, month, day] = data.nextPeriodDate.split("-").map(Number);
      const period = new Date(year, month - 1, day);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Remind 2 days before, or on the day itself if that moment has already passed.
      let remindOn = new Date(period);
      remindOn.setDate(remindOn.getDate() - REMIND_DAYS);
      if (remindOn < today) remindOn = period;

      const stamp = compactDate(remindOn);
      const nice = period.toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
      });

      const params = new URLSearchParams({
        action: "TEMPLATE",
        text: "Femora reminder",
        dates: `${stamp}T090000/${stamp}T091500`,
        details: `Your period is expected around ${nice}. This is an estimate. Log your period in Femora to keep your predictions up to date.`,
      });

      const url = `https://calendar.google.com/calendar/render?${params.toString()}`;

      if (tab) {
        tab.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch (err) {
      if (tab) tab.close();

      setError(
        err instanceof TypeError
          ? "Cannot reach the server. Check that the backend is running."
          : err.message
      );
    } finally {
      setBusy("");
    }
  }

  // Fallback for Apple Calendar and Outlook: downloads a .ics file.
  async function downloadCalendarFile() {
    setBusy("file");
    setError("");

    try {
      const response = await apiFetch(
        `${API_BASE}/api/reminders/calendar?userId=${encodeURIComponent(
          user.userId
        )}`
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.message || "Could not create your calendar file."
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(
        new Blob([blob], { type: "text/calendar" })
      );

      const link = document.createElement("a");
      link.href = url;
      link.download = "femora-reminders.ics";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      onToast?.({
        tone: "good",
        title: "Calendar file ready",
        message: "Open the downloaded file to add your reminders.",
      });
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Cannot reach the server. Check that the backend is running."
          : err.message
      );
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="set-card" aria-labelledby="set-remind-title">
      <div className="set-card-head">
        <span className="set-card-icon">
          <Bell size={18} aria-hidden="true" />
        </span>

        <div>
          <h2 id="set-remind-title">Period reminders</h2>
          <p>
            We email you 2 days before your next expected period, with a
            calendar file you can add to your phone.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="set-state" role="status">
          Loading your reminder settings...
        </p>
      ) : (
        <form onSubmit={save} noValidate>
          <label className="set-check">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={change("enabled")}
            />
            <span>Email me before my period</span>
          </label>

          <label className="set-check">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={change("consent")}
            />
            <span>
              I agree to receive period reminders from Femora. I can turn them
              off any time.
            </span>
          </label>

          <div style={ROW}>
            <button
              type="button"
              className="set-btn set-btn-ghost"
              onClick={sendTest}
              disabled={busy !== ""}
            >
              <Send size={15} aria-hidden="true" />{" "}
              {busy === "test" ? "Sending..." : "Send test email"}
            </button>

            <button
              type="submit"
              className="set-btn set-btn-primary"
              disabled={busy !== ""}
            >
              {busy === "save" ? "Saving..." : "Save reminders"}
            </button>
          </div>
        </form>
      )}

      <div style={{ marginTop: 24 }}>
        <h3>Never miss it: add to your calendar</h3>

        <p>
          Emails are easy to miss. Add the reminder to your calendar and your
          phone alerts you at 9:00 AM, 2 days before, even if you never open
          your email.
        </p>

        <div style={ROW}>
          <button
            type="button"
            className="set-btn set-btn-primary"
            onClick={addToGoogleCalendar}
            disabled={busy !== ""}
          >
            <CalendarPlus size={16} aria-hidden="true" />{" "}
            {busy === "google" ? "Opening..." : "Add to Google Calendar"}
          </button>

          <button
            type="button"
            className="set-btn set-btn-ghost"
            onClick={downloadCalendarFile}
            disabled={busy !== ""}
          >
            <Download size={15} aria-hidden="true" />{" "}
            {busy === "file" ? "Preparing..." : "Apple / Outlook file"}
          </button>
        </div>

        {error ? (
          <small className="set-error" role="alert">
            {error}
          </small>
        ) : null}
      </div>
    </section>
  );
}

export default ReminderCard;