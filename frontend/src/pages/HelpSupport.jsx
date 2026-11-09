import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  LifeBuoy,
  Mail,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";

import "../styles/helpSupport.css";

// Change this to your real support address.
const SUPPORT_EMAIL = "support@femora.example";

const FAQ_GROUPS = [
  {
    title: "Cycle tracking",
    items: [
      {
        q: "How does Femora predict my next period?",
        a: "Femora uses the start dates of your logged periods to work out your average cycle length, then counts forward from your latest period. The more periods you log, the closer the prediction gets to your own pattern.",
      },
      {
        q: "Why does it say my dates are estimates?",
        a: "If your last logged period was a while ago, Femora cannot be sure where you are in your cycle now. Log your latest period and the predictions update straight away.",
      },
      {
        q: "How do I log or correct a period?",
        a: "Use the Log period button on the Overview or in Your details, choose the first day of your latest period and save. Logging a new date updates your cycle day, fertile window and next period.",
      },
      {
        q: "My cycle is irregular. Will predictions still work?",
        a: "Predictions are based on your average, so they are less exact when cycles vary a lot. Treat them as a guide, not a guarantee. If your cycles are often irregular, the PCOS checker or a doctor can help you look into it.",
      },
    ],
  },
  {
    title: "Journal and check-ins",
    items: [
      {
        q: "How do I add, edit or delete a journal note?",
        a: "Open Recent activity and choose Add a journal note. Each note in the list has Edit and Delete links. You can add a mood, symptoms and a short note of up to 500 characters.",
      },
      {
        q: "What does the daily check-in do?",
        a: "Picking a mood under How are you feeling today saves a quick entry for today. You can change it any time that day.",
      },
      {
        q: "Can I download my journal?",
        a: "Yes. In Recent activity, choose a range (last 30 days, last 90 days or everything) and press Download journal (PDF). It can be useful to bring to a doctor's appointment.",
      },
    ],
  },
  {
    title: "Symptom checkers",
    items: [
      {
        q: "Do the symptom checkers give a diagnosis?",
        a: "No. They give general guidance on what to do next based on what you select. Femora is an academic healthcare project and is not a substitute for a doctor.",
      },
      {
        q: "Which checkers are available?",
        a: "General, PCOS, Back pain and Pregnancy. You can start any of them from the Symptom checker card on the Overview.",
      },
      {
        q: "How do I find a doctor?",
        a: "Open Find a doctor from the sidebar to call, visit a website or get directions to nearby doctors.",
      },
    ],
  },
  {
    title: "Account and privacy",
    items: [
      {
        q: "Who can see what I log?",
        a: "Your journal notes, check-ins and period dates are private to your account.",
      },
      {
        q: "How do I switch to dark mode?",
        a: "Use the moon or sun button at the top right of the dashboard. Your choice is remembered.",
      },
      {
        q: "How do I get email reminders?",
        a: "Open Settings from the sidebar, or use Remind me by email on a reminder banner.",
      },
      {
        q: "How do I sign out?",
        a: "Use Sign out at the bottom of the sidebar.",
      },
    ],
  },
];

const TOPICS = [
  "Question about my cycle",
  "Problem with the app",
  "Journal or PDF issue",
  "Feedback or suggestion",
  "Something else",
];

function HelpSupport({ user, onBack, onToast }) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [error, setError] = useState("");

  const displayName = user?.name?.trim() || "";

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return FAQ_GROUPS;

    return FAQ_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.q.toLowerCase().includes(q) ||
          item.a.toLowerCase().includes(q)
      ),
    })).filter((group) => group.items.length > 0);
  }, [query]);

  function sendMessage(event) {
    event.preventDefault();

    if (message.trim().length < 10) {
      setError("Please write a little more so we can help (10+ characters).");
      return;
    }

    setError("");

    const lines = [
      message.trim(),
      "",
      "---",
      displayName ? `Name: ${displayName}` : null,
      replyTo.trim() ? `Reply to: ${replyTo.trim()}` : null,
    ].filter((line) => line !== null);

    const href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      `Femora support: ${topic}`
    )}&body=${encodeURIComponent(lines.join("\n"))}`;

    window.location.href = href;

    onToast?.({
      tone: "good",
      title: "Opening your email app",
      message: "Review the message and press send.",
    });
  }

  return (
    <div className="help-page">
      <div className="help-wrap">
        <header className="help-header">
          <button
            type="button"
            className="help-back"
            onClick={() => onBack?.()}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to dashboard
          </button>

          <span className="help-badge" aria-hidden="true">
            <LifeBuoy size={22} />
          </span>

          <h1>Help &amp; support</h1>
          <p>
            Quick answers about Femora, and a way to reach us if you are stuck.
          </p>
        </header>

        {/* URGENT CARE NOTICE */}

        <aside className="help-urgent" role="note">
          <ShieldAlert size={22} aria-hidden="true" />
          <div>
            <strong>Need urgent care?</strong>
            <p>
              Severe bleeding, chest pain, fainting or any emergency: contact
              local emergency services or go to the nearest hospital. Femora
              cannot give a medical diagnosis.
            </p>
          </div>
        </aside>

        {/* FAQ */}

        <section className="help-section" aria-label="Frequently asked questions">
          <div className="help-section-head">
            <h2>Frequently asked questions</h2>
          </div>

          <label className="help-search" htmlFor="help-search">
            <Search size={17} aria-hidden="true" />
            <span className="help-sr">Search help</span>
            <input
              id="help-search"
              type="search"
              placeholder="Search help, e.g. period, journal, PDF..."
              value={query}
              autoComplete="off"
              onChange={(event) => setQuery(event.target.value)}
            />
            {query ? (
              <button
                type="button"
                className="help-search-clear"
                aria-label="Clear search"
                onClick={() => setQuery("")}
              >
                <X size={15} />
              </button>
            ) : null}
          </label>

          {filteredGroups.length ? (
            filteredGroups.map((group) => (
              <div key={group.title} className="help-group">
                <h3>{group.title}</h3>

                {group.items.map((item) => (
                  <details key={item.q} className="help-item">
                    <summary>
                      <span>{item.q}</span>
                      <ChevronDown size={18} aria-hidden="true" />
                    </summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            ))
          ) : (
            <div className="help-empty">
              <strong>No answers found</strong>
              <small>
                Try a different word, or send us a message below.
              </small>
            </div>
          )}
        </section>

        {/* CONTACT */}

        <section
          className="help-section help-contact"
          aria-label="Contact support"
        >
          <div className="help-section-head">
            <h2>Still need help?</h2>
          </div>

          <form className="help-card" onSubmit={sendMessage}>
            <p className="help-card-intro">
              <Mail size={16} aria-hidden="true" />
              This opens your email app with the message ready to send.
            </p>

            <label htmlFor="help-topic">What is it about?</label>
            <select
              id="help-topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
            >
              {TOPICS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <label htmlFor="help-message">Your message</label>
            <textarea
              id="help-message"
              rows={5}
              maxLength={1000}
              placeholder="Tell us what happened or what you need..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <small className="help-count">{message.length} / 1000</small>

            <label htmlFor="help-email">
              Your email <span className="help-optional">(optional)</span>
            </label>
            <input
              id="help-email"
              type="email"
              placeholder="So we can reply to you"
              value={replyTo}
              onChange={(event) => setReplyTo(event.target.value)}
            />

            {error ? (
              <p className="help-error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="help-actions">
              <button type="submit" className="btn btn-primary btn-shine">
                <Mail size={16} aria-hidden="true" />
                Send message
              </button>
            </div>
          </form>
        </section>

        <p className="help-footnote">
          Femora is an academic healthcare project. It does not provide a
          medical diagnosis.
        </p>
      </div>
    </div>
  );
}

export default HelpSupport;