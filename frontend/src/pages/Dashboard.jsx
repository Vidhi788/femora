import { useEffect, useState } from "react";
import { apiFetch, API_BASE } from "../api/http.js";

import {
  Activity,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Download,
  Droplets,
  Home,
  LogOut,
  Menu,
  Moon,
  NotebookTabs,
  Package,
  RefreshCw,
  Search,
  Settings,
  Smile,
  Sparkles,
  Stethoscope,
  Sun,
  X,
  Zap,
} from "lucide-react";

import BrandMark from "../components/BrandMark.jsx";
import Breathe from "../components/Breathe.jsx";
import CycleDial, {
  CYCLE_LENGTH,
  PHASE_LEGEND,
  phaseForDay,
} from "../components/CycleDial.jsx";
import { buildJournalPdf, saveOrSharePdf } from "../utils/journalPdf.js";
import { THEMES, getStoredTheme, setTheme } from "../theme.js";

import "../styles/dashboard.css";
import "../styles/dark.css";

const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", icon: Home },
      { label: "Cycle tracker", icon: CalendarDays },
      { label: "Symptom checker", icon: ClipboardList },
    ],
  },
  {
    label: "Discover",
    items: [
      { label: "Articles & yoga", icon: NotebookTabs },
      { label: "Find a doctor", icon: Stethoscope },
      { label: "Recommendations", icon: Package },
    ],
  },
];

// Searchable dashboard pages and features.
const SEARCH_ITEMS = [
  {
    label: "Overview",
    keywords: "home dashboard main",
    type: "Page",
  },
  {
    label: "Cycle tracker",
    keywords: "period cycle calendar dates next period",
    type: "Page",
  },
  {
    label: "My profile",
    keywords: "age height weight bmi personal details",
    type: "Page",
  },
  {
    label: "Symptom checker",
    keywords: "health check symptoms medical",
    type: "Feature",
  },
  {
    label: "General symptom checker",
    keywords: "fever headache fatigue general health",
    type: "Feature",
  },
  {
    label: "PCOS checker",
    keywords: "pcos irregular cycle acne",
    type: "Feature",
  },
  {
    label: "Pregnancy checker",
    keywords: "pregnancy missed period",
    type: "Feature",
  },
  {
    label: "Back pain checker",
    keywords: "back pain cramps lower back",
    type: "Feature",
  },
  {
    label: "Articles & yoga",
    keywords: "articles remedies yoga wellness",
    type: "Explore",
  },
  {
    label: "Find a doctor",
    keywords: "doctor hospital nearby medical",
    type: "Explore",
  },
  {
    label: "Recommendations",
    keywords: "products pharmacy period kit",
    type: "Explore",
  },
  {
    label: "Recent activity",
    keywords: "journal notes history activity",
    type: "Section",
  },
  {
    label: "Help & support",
    keywords: "help faq contact problem question support",
    type: "Page",
  },
  {
    label: "Settings",
    keywords: "preferences account theme",
    type: "Page",
  },
];

const MOODS = [
  { emoji: "🌿", label: "Calm" },
  { emoji: "☀️", label: "Bright" },
  { emoji: "🌙", label: "Tired" },
  { emoji: "💭", label: "Thoughtful" },
  { emoji: "⚡", label: "Energized" },
];

const STATS = [
  {
    label: "Hydration",
    value: "6",
    unit: "/ 8 cups",
    hint: "2 more to reach your goal",
    pct: 75,
    icon: Droplets,
    cls: "tile-sage",
  },
  {
    label: "Sleep",
    value: "7.4",
    unit: "h",
    hint: "Last night",
    pct: 82,
    icon: Moon,
    cls: "tile-plum",
  },
  {
    label: "Mood",
    value: "4.2",
    unit: "/ 5",
    hint: "Average this week",
    pct: 84,
    icon: Smile,
    cls: "tile-gold",
  },
];

const TIPS = {
  Menstrual:
    "Rest is part of the plan. Iron-rich food, a warm compress and a slow walk or gentle yoga can make these days easier.",
  Follicular:
    "Energy often rises now. It is a good time for harder workouts, new plans and trying something unfamiliar.",
  Ovulation:
    "You may feel more social and energetic. Keep water close and pace your day if you start to tire.",
  Luteal:
    "Slow down where you can. Steady sleep, magnesium-rich snacks and less caffeine can soften mood dips.",
};

const SECTION_IDS = {
  "Cycle tracker": "dash-cycle",
  "My profile": "dash-profile",
  "Symptom checker": "dash-symptoms",
  "Articles & yoga": "dash-articles",
  "Find a doctor": "dash-doctors",
  Recommendations: "dash-recs",
};

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];

const BENTO = [
  {
    id: "dash-articles",
    title: "Articles & yoga",
    text: "Reads and short flows for every stage, from first period to menopause.",
    tags: ["Home remedies", "Period pain", "Menopause"],
    icon: Sparkles,
    cls: "bento-gold bento-wide",
    nav: "Articles & yoga",
  },
  {
    id: "dash-doctors",
    title: "Find a doctor",
    text: "Call, visit the website or get directions in one tap.",
    tags: ["Nearby"],
    icon: Stethoscope,
    cls: "bento-sage",
    nav: "Find a doctor",
  },
  {
    id: "dash-recs",
    title: "Picked for you",
    text: "Products matched to your symptoms.",
    tags: ["Period kits", "Snacks", "Pharmacy"],
    icon: Package,
    cls: "bento-blush",
    nav: "Recommendations",
  },
];

const JOURNAL_SYMPTOMS = [
  "Cramps",
  "Headache",
  "Bloating",
  "Fatigue",
  "Mood swings",
  "Acne",
  "Back pain",
  "Nausea",
  "Cravings",
  "Poor sleep",
];

const PDF_RANGES = [
  { value: "30", label: "Last 30 days", days: 30 },
  { value: "90", label: "Last 90 days", days: 90 },
  { value: "all", label: "Everything", days: null },
];

const EMPTY_JOURNAL = {
  id: null,
  entryDate: "",
  mood: "",
  symptoms: [],
  note: "",
};

const JOURNAL_CARD = { maxHeight: "90vh", overflowY: "auto" };

const CHIP_ROW = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  margin: "6px 0 14px",
};

const CHIP_BTN = { padding: "8px 14px", fontSize: 13 };

const TEXTAREA = {
  width: "100%",
  minHeight: 96,
  padding: 12,
  borderRadius: 12,
  border: "1px solid rgba(120, 90, 90, 0.25)",
  background: "transparent",
  color: "inherit",
  font: "inherit",
  resize: "vertical",
  boxSizing: "border-box",
};

const LINK_ROW = { display: "flex", gap: 12, marginTop: 4 };

const LINK_BTN = {
  background: "none",
  border: 0,
  padding: 0,
  font: "inherit",
  fontSize: 12,
  textDecoration: "underline",
  color: "inherit",
  opacity: 0.75,
  cursor: "pointer",
};

const PDF_ROW = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
  marginTop: 12,
};

const SELECT_STYLE = {
  padding: "10px 12px",
  borderRadius: 999,
  border: "1px solid rgba(120, 90, 90, 0.25)",
  background: "transparent",
  color: "inherit",
  font: "inherit",
};

function journalSummary(entry) {
  const parts = [];

  if (entry.mood) parts.push(entry.mood);
  if (entry.symptoms?.length) parts.push(entry.symptoms.join(", "));

  if (entry.note) {
    parts.push(
      entry.note.length > 60 ? `${entry.note.slice(0, 60)}...` : entry.note
    );
  }

  return parts.join(" \u00B7 ") || "Journal note";
}

const START_ROWS = [
  { name: "General", hint: "Fever, fatigue, headaches" },
  { name: "PCOS", hint: "Irregular cycles, acne" },
  { name: "Back pain", hint: "Lower back, cramps" },
  { name: "Pregnancy", hint: "Missed period, worries" },
];

function greetingFor(hour) {
  if (hour < 5) return "Still awake";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

function formatToday() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

function todayIso() {
  const date = new Date();
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
}

function formatDate(iso) {
  if (!iso) return "-";

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${iso}T00:00:00`));
}

function daysAgoLabel(iso) {
  const diff = Math.round(
    (new Date(`${todayIso()}T00:00:00`) -
      new Date(`${iso}T00:00:00`)) /
      86400000
  );

  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";

  return `${diff} days ago`;
}

function Dashboard({
  user,
  onLogout,
  onToast,
  onProfileMissing,
  onOpenYoga,
  onOpenPcos,
  onOpenPregnancy,
  onOpenGeneral,
  onOpenBackPain,
  onOpenProducts,
  onOpenDoctors,
  onOpenSettings,
  onOpenHelp,
}) {
  const [activeNav, setActiveNav] = useState("Overview");

  // Mobile/tablet drawer state (the sidebar is always visible on desktop).
  const [menuOpen, setMenuOpen] = useState(false);

  // Search state.
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const [bellOpen, setBellOpen] = useState(false);
  const [theme, setThemeState] = useState(getStoredTheme);
  const [mood, setMood] = useState("");
  const [tries, setTries] = useState(0);
  const [summary, setSummary] = useState(null);
  const [pickOpen, setPickOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [logDate, setLogDate] = useState("");
  const [logBusy, setLogBusy] = useState(false);
  const [logError, setLogError] = useState("");
  const [reminderHidden, setReminderHidden] = useState(false);

  const [entries, setEntries] = useState([]);
  const [journalTries, setJournalTries] = useState(0);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalForm, setJournalForm] = useState(EMPTY_JOURNAL);
  const [journalBusy, setJournalBusy] = useState(false);
  const [journalError, setJournalError] = useState("");
  const [pdfRange, setPdfRange] = useState("30");
  const [pdfBusy, setPdfBusy] = useState(false);

  const [banner, setBanner] = useState({
    state: "loading",
    message: "",
  });

  const now = new Date();
  const ready = Boolean(summary);

  const cycleDay = summary?.cycleDay ?? 1;
  const cycleLen = summary?.cycleLength ?? CYCLE_LENGTH;

  const phase = {
    name: summary?.phase ?? phaseForDay(cycleDay).name,
  };

  const dialDay = Math.min(
    CYCLE_LENGTH,
    Math.max(1, Math.round((cycleDay * CYCLE_LENGTH) / cycleLen))
  );

  const days = summary?.daysToNextPeriod;

  const periodText = !ready
    ? "..."
    : days === 0
    ? "Today"
    : days === 1
    ? "Tomorrow"
    : `In ${days} days`;

  const fertileText = !ready
    ? "..."
    : summary.inFertileWindow
    ? "Open now"
    : `In ${summary.daysToFertileWindow} days`;

  const todayIndex = (now.getDay() + 6) % 7;

  const shownBanner = user?.userId
    ? banner
    : {
        state: "error",
        message: "Please sign out and sign in again.",
      };

  const displayName = user?.name?.trim() || "friend";
  const firstName = displayName.split(" ")[0];
  const initial = firstName.charAt(0).toUpperCase();

  const darkTheme =
    THEMES.find((item) => item.id === "dark") ??
    THEMES.find((item) => item.id !== "light");

  const isDark = theme !== "light";

  // Search results update automatically as the user types.
  const searchResults = SEARCH_ITEMS.filter((item) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return false;

    return (
      item.label.toLowerCase().includes(query) ||
      item.keywords.toLowerCase().includes(query)
    );
  }).slice(0, 7);

  function toggleTheme() {
    const next = isDark ? "light" : darkTheme?.id;

    if (!next) return;

    setThemeState(next);
    setTheme(next);
  }

  // Close the mobile drawer if the window grows to desktop width.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1081px)");

    function onChange(event) {
      if (event.matches) setMenuOpen(false);
    }

    mq.addEventListener("change", onChange);

    return () => {
      mq.removeEventListener("change", onChange);
    };
  }, []);

  // --------------------------------------------------
  // LOAD CYCLE SUMMARY AND USER PROFILE
  // --------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    if (!user?.userId) return undefined;

    async function loadDashboard() {
      try {
        const response = await apiFetch(
          `${API_BASE}/api/cycle/summary?userId=${encodeURIComponent(
            user.userId
          )}`
        );

        if (response.status === 404) {
          if (!cancelled) {
            setSummary(null);
            onProfileMissing?.();
            setBanner({
              state: "error",
              message:
                "Your wellness profile was not found. Please complete your profile.",
            });
          }
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          throw new Error(
            errorData.message || "Could not load your cycle details."
          );
        }

        const data = await response.json();

        if (cancelled) return;

        setSummary(data);

        setBanner({
          state: "ready",
          message: "",
        });
      } catch (error) {
        if (cancelled) return;

        setBanner({
          state: "error",
          message:
            error instanceof TypeError
              ? "Check that the backend is running."
              : error.message,
        });
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [tries, user?.userId, onProfileMissing]);

  // --------------------------------------------------
  // LOAD JOURNAL NOTES
  // --------------------------------------------------

  useEffect(() => {
    if (!user?.userId) return undefined;

    let cancelled = false;

    async function loadJournal() {
      try {
        const response = await apiFetch(`${API_BASE}/api/journal?days=60`);

        if (!response.ok) return;

        const data = await response.json();

        if (cancelled) return;

        setEntries(data);

        const today = data.find(
          (entry) => entry.entryDate === todayIso() && entry.mood
        );

        if (today) setMood(today.mood);
      } catch {
        // Journal is optional.
      }
    }

    loadJournal();

    return () => {
      cancelled = true;
    };
  }, [user?.userId, journalTries]);

  // --------------------------------------------------
  // ESCAPE KEY HANDLING
  // --------------------------------------------------

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setBellOpen(false);
        setLogOpen(false);
        setPickOpen(false);
        setJournalOpen(false);
        setSearchOpen(false);
        setSearchQuery("");
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // --------------------------------------------------
  // PERIOD LOGGING
  // --------------------------------------------------

  function openLog() {
    setLogDate(todayIso());
    setLogError("");
    setLogOpen(true);
  }

  async function saveLog(event) {
    event.preventDefault();

    if (!user?.userId) {
      setLogError("Your login session was not found.");
      return;
    }

    setLogBusy(true);
    setLogError("");

    try {
      const response = await apiFetch(`${API_BASE}/api/cycle/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.userId,
          startDate: logDate,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Could not save this date.");
      }

      setSummary(data);
      setBanner({
        state: "ready",
        message: "",
      });

      setReminderHidden(false);
      setLogOpen(false);

      onToast({
        tone: "good",
        title: "Period logged",
        message: "Your predictions have been updated.",
      });
    } catch (error) {
      setLogError(error.message);
    } finally {
      setLogBusy(false);
    }
  }

  // --------------------------------------------------
  // JOURNAL
  // --------------------------------------------------

  function openJournal(entry) {
    setJournalForm(
      entry
        ? {
            id: entry.id,
            entryDate: entry.entryDate,
            mood: entry.mood || "",
            symptoms: entry.symptoms || [],
            note: entry.note || "",
          }
        : { ...EMPTY_JOURNAL, entryDate: todayIso() }
    );

    setJournalError("");
    setJournalOpen(true);
  }

  function toggleSymptom(name) {
    setJournalForm((current) => ({
      ...current,
      symptoms: current.symptoms.includes(name)
        ? current.symptoms.filter((item) => item !== name)
        : [...current.symptoms, name],
    }));
  }

  async function saveJournal(event) {
    event.preventDefault();

    if (
      !journalForm.mood &&
      !journalForm.symptoms.length &&
      !journalForm.note.trim()
    ) {
      setJournalError("Pick a mood, a symptom or write a note.");
      return;
    }

    setJournalBusy(true);
    setJournalError("");

    try {
      const editing = Boolean(journalForm.id);

      const response = await apiFetch(
        `${API_BASE}/api/journal${editing ? `/${journalForm.id}` : ""}`,
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entryDate: journalForm.entryDate,
            mood: journalForm.mood || null,
            symptoms: journalForm.symptoms,
            note: journalForm.note.trim() || null,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Could not save your note.");
      }

      setJournalOpen(false);
      setJournalTries((count) => count + 1);

      onToast({
        tone: "good",
        title: editing ? "Note updated" : "Note saved",
        message: "Your journal is up to date.",
      });
    } catch (error) {
      setJournalError(
        error instanceof TypeError
          ? "Cannot reach the server. Check that the backend is running."
          : error.message
      );
    } finally {
      setJournalBusy(false);
    }
  }

  async function deleteEntry(entry) {
    if (!window.confirm("Delete this journal note?")) return;

    try {
      const response = await apiFetch(
        `${API_BASE}/api/journal/${entry.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Could not delete this note.");
      }

      setJournalTries((count) => count + 1);

      onToast({
        tone: "info",
        title: "Note deleted",
        message: "It has been removed from your journal.",
      });
    } catch (error) {
      onToast({
        tone: "info",
        title: "Could not delete",
        message: error.message,
      });
    }
  }

  async function saveCheckin(label) {
    setMood(label);

    try {
      const response = await apiFetch(`${API_BASE}/api/journal/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryDate: todayIso(), mood: label }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Could not save your check-in.");
      }

      setJournalTries((count) => count + 1);
    } catch (error) {
      onToast({
        tone: "info",
        title: "Check-in not saved",
        message: error.message,
      });
    }
  }

  async function downloadJournalPdf() {
    setPdfBusy(true);

    try {
      const range =
        PDF_RANGES.find((item) => item.value === pdfRange) ?? PDF_RANGES[0];

      const response = await apiFetch(
        `${API_BASE}/api/journal${range.days ? `?days=${range.days}` : ""}`
      );

      if (!response.ok) {
        throw new Error("Could not load your journal.");
      }

      const data = await response.json();

      if (!data.length) {
        onToast({
          tone: "info",
          title: "Nothing to download yet",
          message: "Add a journal note first, then try again.",
        });
        return;
      }

      const blob = await buildJournalPdf({
        name: displayName,
        entries: [...data].reverse(),
        rangeLabel: range.label,
      });

      const outcome = await saveOrSharePdf(
        blob,
        `femora-journal-${todayIso()}.pdf`
      );

      if (outcome !== "cancelled") {
        onToast({
          tone: "good",
          title: outcome === "shared" ? "Journal shared" : "Journal downloaded",
          message: "Your journal PDF is ready.",
        });
      }
    } catch (error) {
      onToast({
        tone: "info",
        title: "Could not create the PDF",
        message:
          error instanceof TypeError
            ? "Cannot reach the server. Check that the backend is running."
            : error.message,
      });
    } finally {
      setPdfBusy(false);
    }
  }

  // --------------------------------------------------
  // NAVIGATION
  // --------------------------------------------------

  function selectNav(label) {
    setActiveNav(label);
    setMenuOpen(false);

    if (label === "Articles & yoga") {
      onOpenYoga?.();
      return;
    }

    if (label === "Recommendations") {
      onOpenProducts?.();
      return;
    }

    if (label === "Find a doctor") {
      onOpenDoctors?.();
      return;
    }

    if (label === "Settings") {
      onOpenSettings?.();
      return;
    }

    if (label === "Help & support") {
      onOpenHelp?.();
      return;
    }

    if (label === "Overview") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    const target =
      SECTION_IDS[label] &&
      document.getElementById(SECTION_IDS[label]);

    if (target) {
      window.setTimeout(() => {
        target.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        target.classList.remove("is-flash");
        void target.offsetWidth;
        target.classList.add("is-flash");
      }, 120);

      return;
    }

    onToast({
      tone: "info",
      title: label,
      message: "This part of your space is still being built.",
    });
  }

  // Open a search result.
  function openSearchResult(item) {
    setSearchOpen(false);
    setSearchQuery("");

    switch (item.label) {
      case "General symptom checker":
        openCheck("General");
        break;

      case "PCOS checker":
        openCheck("PCOS");
        break;

      case "Pregnancy checker":
        openCheck("Pregnancy");
        break;

      case "Back pain checker":
        openCheck("Back pain");
        break;

      case "Recent activity":
        document.querySelector(".dash-activity")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        break;

      default:
        selectNav(item.label);
    }
  }

  // --------------------------------------------------
  // SYMPTOM CHECKER
  // --------------------------------------------------

  function openCheck(name) {
    setPickOpen(false);

    if (name === "PCOS") {
      onOpenPcos?.();
      return;
    }

    if (name === "Pregnancy") {
      onOpenPregnancy?.();
      return;
    }

    if (name === "General") {
      onOpenGeneral?.();
      return;
    }

    if (name === "Back pain") {
      onOpenBackPain?.();
      return;
    }

    onToast({
      tone: "info",
      title: `${name} checker`,
      message: "This checker is coming soon.",
    });
  }

  function openModule(label) {
    if (label === "Find a doctor") {
      onOpenDoctors?.();
      return;
    }

    if (label === "Recommendations") {
      onOpenProducts?.();
      return;
    }

    if (label === "Articles & yoga") {
      onOpenYoga?.();
      return;
    }

    onToast({
      tone: "info",
      title: label,
      message: "This module is still being built.",
    });
  }

  // --------------------------------------------------
  // USER PROFILE DETAILS
  // --------------------------------------------------

  const details = ready
    ? [
        {
          label: "Age",
          value: summary.age != null ? `${summary.age} yrs` : "-",
        },
        {
          label: "Height",
          value: summary.heightCm
            ? `${Math.round(summary.heightCm)} cm`
            : "-",
        },
        {
          label: "Weight",
          value: summary.weightKg
            ? `${Math.round(summary.weightKg)} kg`
            : "-",
        },
        {
          label: "BMI",
          value: summary.bmi ?? "-",
        },
        {
          label: "Last period",
          value: formatDate(summary.lastPeriodDate),
        },
        {
          label: "Next period",
          value: formatDate(summary.nextPeriodDate),
        },
      ]
    : [];

  const periodItems = (summary?.recentPeriods ?? [])
    .slice(0, 5)
    .map((date) => ({
      key: `period-${date}`,
      sortKey: date,
      text: "Period started",
      detail: formatDate(date),
      when: daysAgoLabel(date),
      tone: "tone-rose",
      icon: CalendarDays,
      entry: null,
    }));

  const journalItems = entries.slice(0, 8).map((entry) => ({
    key: `journal-${entry.id}`,
    sortKey: entry.entryDate,
    text: "Journal note",
    detail: journalSummary(entry),
    when: daysAgoLabel(entry.entryDate),
    tone: "tone-gold",
    icon: NotebookTabs,
    entry,
  }));

  const activityItems = [...periodItems, ...journalItems]
    .sort((a, b) =>
      a.sortKey < b.sortKey ? 1 : a.sortKey > b.sortKey ? -1 : 0
    )
    .slice(0, 6);

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className={`dash-shell ${menuOpen ? "is-mobile-nav-open" : ""}`}>
      {/* SYMPTOM CHECKER MODAL */}

      {pickOpen ? (
        <div
          className="dash-modal"
          role="presentation"
          onClick={() => setPickOpen(false)}
        >
          <div
            className="dash-modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Choose what to check"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>What would you like to check?</h2>
            <p>Choose the one that feels closest.</p>

            <div className="dash-pick-list">
              {START_ROWS.map((row) => (
                <button
                  key={row.name}
                  type="button"
                  onClick={() => openCheck(row.name)}
                >
                  <b>{row.name}</b>
                  <small>{row.hint}</small>
                </button>
              ))}
            </div>

            <div className="dash-modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setPickOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* PERIOD LOG MODAL */}

      {logOpen ? (
        <div
          className="dash-modal"
          role="presentation"
          onClick={() => setLogOpen(false)}
        >
          <form
            className="dash-modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Log your period"
            onSubmit={saveLog}
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Log your period</h2>

            <p>
              Choose the first day of your latest period. Femora updates your
              predictions straight away.
            </p>

            <label htmlFor="log-date">Start date</label>

            <input
              id="log-date"
              type="date"
              value={logDate}
              max={todayIso()}
              required
              onChange={(event) => setLogDate(event.target.value)}
            />

            {logError ? (
              <p className="dash-modal-error" role="alert">
                {logError}
              </p>
            ) : null}

            <div className="dash-modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setLogOpen(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={logBusy || !logDate}
              >
                {logBusy ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* JOURNAL MODAL */}

      {journalOpen ? (
        <div
          className="dash-modal"
          role="presentation"
          onClick={() => setJournalOpen(false)}
        >
          <form
            className="dash-modal-card"
            style={JOURNAL_CARD}
            role="dialog"
            aria-modal="true"
            aria-label={
              journalForm.id ? "Edit journal note" : "Add a journal note"
            }
            onSubmit={saveJournal}
            onClick={(event) => event.stopPropagation()}
          >
            <h2>
              {journalForm.id ? "Edit journal note" : "Add a journal note"}
            </h2>

            <p>Only you can see this. It stays private to this account.</p>

            <label htmlFor="journal-date">Date</label>

            <input
              id="journal-date"
              type="date"
              value={journalForm.entryDate}
              max={todayIso()}
              required
              onChange={(event) =>
                setJournalForm((current) => ({
                  ...current,
                  entryDate: event.target.value,
                }))
              }
            />

            <p style={{ marginTop: 14, marginBottom: 0 }}>
              <strong>How are you feeling?</strong>
            </p>

            <div style={CHIP_ROW} role="group" aria-label="Mood">
              {MOODS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  style={CHIP_BTN}
                  className={`btn ${
                    journalForm.mood === item.label
                      ? "btn-primary"
                      : "btn-ghost"
                  }`}
                  aria-pressed={journalForm.mood === item.label}
                  onClick={() =>
                    setJournalForm((current) => ({
                      ...current,
                      mood:
                        current.mood === item.label ? "" : item.label,
                    }))
                  }
                >
                  {item.emoji} {item.label}
                </button>
              ))}
            </div>

            <p style={{ marginTop: 0, marginBottom: 0 }}>
              <strong>Any symptoms?</strong>
            </p>

            <div style={CHIP_ROW} role="group" aria-label="Symptoms">
              {JOURNAL_SYMPTOMS.map((name) => (
                <button
                  key={name}
                  type="button"
                  style={CHIP_BTN}
                  className={`btn ${
                    journalForm.symptoms.includes(name)
                      ? "btn-primary"
                      : "btn-ghost"
                  }`}
                  aria-pressed={journalForm.symptoms.includes(name)}
                  onClick={() => toggleSymptom(name)}
                >
                  {name}
                </button>
              ))}
            </div>

            <label htmlFor="journal-note">Note</label>

            <textarea
              id="journal-note"
              rows={4}
              maxLength={500}
              style={TEXTAREA}
              placeholder="Anything you want to remember about today..."
              value={journalForm.note}
              onChange={(event) =>
                setJournalForm((current) => ({
                  ...current,
                  note: event.target.value,
                }))
              }
            />

            <small>{journalForm.note.length} / 500</small>

            {journalError ? (
              <p className="dash-modal-error" role="alert">
                {journalError}
              </p>
            ) : null}

            <div className="dash-modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setJournalOpen(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={journalBusy}
              >
                {journalBusy ? "Saving..." : "Save note"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* MOBILE NAVIGATION OVERLAY */}

      {menuOpen ? (
        <button
          type="button"
          className="dash-overlay"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      {/* SIDEBAR */}

      <aside className={`dash-side ${menuOpen ? "is-open" : ""}`}>
        <div className="dash-side-inner">
          <div className="dash-side-top">
            <BrandMark variant="inverse" />

            <button
              type="button"
              className="dash-side-close"
              onClick={() => setMenuOpen(false)}
              aria-label="Close navigation"
            >
              <X size={20} />
            </button>
          </div>

          <button
            type="button"
            className="dash-profile"
            onClick={() => selectNav("My profile")}
          >
            <span className="dash-avatar" aria-hidden="true">
              {initial}
            </span>

            <span className="dash-profile-text">
              <strong>{firstName}</strong>
              <small>Personal space</small>
            </span>

            <ChevronRight size={16} aria-hidden="true" />
          </button>

          <nav className="dash-nav" aria-label="Main navigation">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="dash-nav-group">
                <p className="dash-nav-label">{group.label}</p>

                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeNav === item.label;

                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`dash-nav-item ${
                        active ? "is-active" : ""
                      }`}
                      aria-current={active ? "page" : undefined}
                      onClick={() => selectNav(item.label)}
                    >
                      <Icon size={18} aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="dash-side-foot">
            <button
              type="button"
              className="dash-nav-item"
              onClick={() => selectNav("Help & support")}
            >
              <CircleHelp size={18} aria-hidden="true" />
              <span>Help &amp; support</span>
            </button>

            <button
              type="button"
              className="dash-nav-item"
              onClick={() => selectNav("Settings")}
            >
              <Settings size={18} aria-hidden="true" />
              <span>Settings</span>
            </button>

            <button
              type="button"
              className="dash-logout"
              onClick={onLogout}
            >
              <LogOut size={17} aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}

      <section className="dash-work">
        {/* TOP HEADER */}

        <header className="dash-top">
          {/* Only visible when the sidebar is a drawer (1080px and below). */}
          <button
            type="button"
            className="dash-icon-btn dash-menu-btn"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
          >
            <Menu size={19} />
          </button>

          {/* FUNCTIONAL SEARCH */}

          <div
            className="dash-search-wrap"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setSearchOpen(false);
              }
            }}
          >
            <label className="dash-search" htmlFor="dash-search">
              <Search size={17} aria-hidden="true" />

              <span className="dash-sr">Search your space</span>

              <input
                id="dash-search"
                type="search"
                placeholder="Search your Femora space..."
                value={searchQuery}
                autoComplete="off"
                role="combobox"
                aria-expanded={searchOpen && searchResults.length > 0}
                aria-controls="dash-search-results"
                onFocus={() => setSearchOpen(true)}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSearchOpen(true);
                }}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    searchResults.length > 0
                  ) {
                    event.preventDefault();
                    openSearchResult(searchResults[0]);
                  }

                  if (event.key === "Escape") {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }
                }}
              />

              {searchQuery && (
                <button
                  type="button"
                  className="dash-search-clear"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchOpen(true);
                    document.getElementById("dash-search")?.focus();
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </label>

            {searchOpen && searchQuery.trim() && (
              <div
                className="dash-search-results"
                id="dash-search-results"
                role="listbox"
              >
                {searchResults.length > 0 ? (
                  <>
                    <p className="dash-search-heading">Search results</p>

                    {searchResults.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        className="dash-search-result"
                        role="option"
                        aria-selected="false"
                        onClick={() => openSearchResult(item)}
                      >
                        <span className="dash-search-result-icon">
                          <Search size={15} />
                        </span>

                        <span className="dash-search-result-text">
                          <strong>{item.label}</strong>
                          <small>{item.type}</small>
                        </span>

                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="dash-search-empty">
                    <Search size={20} />
                    <strong>No results found</strong>
                    <small>
                      Try searching for cycle, yoga, doctor or symptoms.
                    </small>
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className="dash-top-actions"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {darkTheme ? (
              <button
                type="button"
                className="dash-icon-btn"
                onClick={toggleTheme}
                aria-label={
                  isDark ? "Switch to light theme" : "Switch to dark theme"
                }
                title={
                  isDark ? "Switch to light theme" : "Switch to dark theme"
                }
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            ) : null}

            <button
              type="button"
              className={`dash-icon-btn ${
                bellOpen || !summary?.reminderMessage ? "" : "has-dot"
              }`}
              onClick={() => setBellOpen((open) => !open)}
              aria-label="Notifications"
              aria-expanded={bellOpen}
            >
              <Bell size={18} />
            </button>

            {bellOpen ? (
              <div
                className="dash-notes"
                role="dialog"
                aria-label="Notifications"
              >
                <p className="dash-notes-title">Today</p>

                <div className="dash-note">
                  <Zap size={16} aria-hidden="true" />
                  <span>
                    {summary?.reminderMessage ??
                      "You have no reminders right now."}
                  </span>
                </div>

                <div className="dash-note">
                  <Moon size={16} aria-hidden="true" />
                  <span>
                    A calmer evening routine can help sleep quality.
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        {/* HERO SECTION */}

        <article className="dash-hero">
          <div className="dash-hero-copy">
            <p className="dash-date">{formatToday()}</p>

            <h1>
              {greetingFor(now.getHours())}, {firstName}
            </h1>

            <p className="dash-hero-text">
              {ready ? (
                <>
                  Day {cycleDay} of your cycle, in the{" "}
                  {phase.name.toLowerCase()} phase.{" "}
                  {summary.lastPeriodStale
                    ? "Your last logged period was a while ago, so these dates are estimates."
                    : "Warm food, water and an early night usually help."}{" "}
                  What you log stays private to this account.
                </>
              ) : (
                "Loading your personal cycle details..."
              )}
            </p>

            <div className="dash-hero-actions">
              <button
                type="button"
                className="btn btn-primary btn-shine"
                onClick={openLog}
              >
                <CalendarDays size={17} aria-hidden="true" />
                Log period
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => selectNav("Cycle tracker")}
              >
                Open cycle tracker
                <ArrowUpRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          <ul className="dash-facts">
            <li>
              <span>Next period</span>
              <strong>{periodText}</strong>
            </li>

            <li>
              <span>Fertile window</span>
              <strong>{fertileText}</strong>
            </li>

            <li>
              <span>Current phase</span>
              <strong>{phase.name}</strong>
            </li>
          </ul>
        </article>

        {/* PERIOD REMINDER */}

        {summary?.reminderMessage && !reminderHidden ? (
          <div
            className={`dash-banner is-reminder reminder-${summary.reminderType}`}
            role="status"
          >
            <Bell size={18} aria-hidden="true" />

            <p>
              <strong>Reminder.</strong> {summary.reminderMessage}
            </p>

            {summary.reminderType === "log" ||
            summary.reminderType === "period" ? (
              <button
                type="button"
                className="btn btn-soft"
                onClick={openLog}
              >
                Log period
              </button>
            ) : null}

            <button
              type="button"
              className="btn btn-soft"
              onClick={() => onOpenSettings?.()}
            >
              Remind me by email
            </button>

            <button
              type="button"
              className="dash-banner-x"
              aria-label="Dismiss reminder"
              onClick={() => setReminderHidden(true)}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ) : null}

        {/* SERVER ERROR / RETRY */}

        {shownBanner.state === "error" ? (
          <div className="dash-banner is-error" role="alert">
            <span className="dash-live" aria-hidden="true" />

            <p>
              <strong>
                {shownBanner.message.includes("profile")
                  ? "Profile unavailable."
                  : "Cannot reach the server."}
              </strong>{" "}
              {shownBanner.message}
            </p>

            <button
              type="button"
              className="btn btn-soft"
              onClick={() => {
                setBanner({
                  state: "loading",
                  message: "",
                });

                setTries((count) => count + 1);
              }}
            >
              <RefreshCw size={15} aria-hidden="true" />
              Retry
            </button>
          </div>
        ) : null}

        {/* CYCLE AND STATS */}

        <section
          id="dash-cycle"
          className="dash-section dash-cycle"
          aria-label="Cycle overview"
        >
          <article className="dash-card dash-dial-card">
            <div className="dash-card-head">
              <h2>Your cycle</h2>
              <span className="pill">
                Day {cycleDay} of {cycleLen}
              </span>
            </div>

            <div className="dash-dial-wrap">
              <CycleDial day={dialDay} size={210} />
            </div>

            <div className="dash-phasebar">
              {PHASE_LEGEND.map((item) => (
                <div
                  key={item.name}
                  className={`dash-phase ${
                    item.name === phase.name ? "is-now" : ""
                  }`}
                  style={{
                    flexGrow: item.to - item.from + 1,
                    "--c": item.color,
                  }}
                >
                  <span className="dash-phase-fill" />
                  <small>{item.name}</small>
                </div>
              ))}
            </div>
          </article>

          <div className="dash-right">
            <div className="dash-tiles">
              {STATS.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.label}
                    className={`dash-tile ${item.cls}`}
                  >
                    <div className="dash-tile-top">
                      <span className="dash-tile-icon" aria-hidden="true">
                        <Icon size={17} />
                      </span>
                      {item.label}
                    </div>

                    <p className="dash-tile-value">
                      {item.value}
                      <small>{item.unit}</small>
                    </p>

                    <div className="dash-meter" aria-hidden="true">
                      <span style={{ width: `${item.pct}%` }} />
                    </div>

                    <p className="dash-tile-hint">{item.hint}</p>
                  </article>
                );
              })}
            </div>

            <article className="dash-tip">
              <span className="dash-tip-label">
                A gentle tip for your {phase.name.toLowerCase()} phase
              </span>

              <p>{TIPS[phase.name]}</p>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => selectNav("Articles & yoga")}
              >
                Browse yoga and remedies
                <ArrowUpRight size={15} aria-hidden="true" />
              </button>
            </article>
          </div>
        </section>

        {/* USER PROFILE DETAILS */}

        <section
          id="dash-profile"
          className="dash-section"
          aria-label="Your details"
        >
          <div className="dash-section-head">
            <h2>Your details</h2>
          </div>

          <article className="dash-card dash-details">
            <ul className="dash-detail-list">
              {details.map((item) => (
                <li key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </li>
              ))}
            </ul>

            <div className="dash-detail-cta">
              <p>
                {ready
                  ? `Your average cycle is ${summary.cycleLength} days. Log each new period and Femora keeps learning from your own history.`
                  : banner.state === "loading"
                  ? "Loading your details..."
                  : "Your profile details are currently unavailable. Please check your profile and try again."}
              </p>

              <button
                type="button"
                className="btn btn-primary btn-shine"
                onClick={openLog}
              >
                <CalendarDays size={17} aria-hidden="true" />
                Log new period
              </button>
            </div>
          </article>
        </section>

        {/* DAILY CHECK-IN */}

        <section className="dash-section" aria-label="Daily check-in">
          <article className="dash-checkin-card">
            <div className="dash-checkin-copy">
              <h2>How are you feeling today?</h2>

              <p>
                A quick check-in helps Femora notice patterns across your
                cycle.
              </p>

              <ol className="dash-week" aria-label="This week">
                {WEEK.map((letter, index) => (
                  <li
                    key={index}
                    className={
                      index === todayIndex
                        ? "is-today"
                        : index < todayIndex
                        ? "is-past"
                        : ""
                    }
                  >
                    {letter}
                  </li>
                ))}
              </ol>
            </div>

            <div className="dash-moods">
              {MOODS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`dash-mood ${
                    mood === item.label ? "is-picked" : ""
                  }`}
                  onClick={() => saveCheckin(item.label)}
                  aria-pressed={mood === item.label}
                >
                  <span aria-hidden="true">{item.emoji}</span>
                  <strong>{item.label}</strong>
                </button>
              ))}
            </div>

            {mood ? (
              <p className="dash-checkin" role="status">
                <Check size={15} aria-hidden="true" />
                Thanks for checking in. You marked today as{" "}
                {mood.toLowerCase()}.
              </p>
            ) : null}
          </article>
        </section>

        {/* EXPLORE */}

        <section className="dash-section" aria-label="Explore">
          <div className="dash-section-head">
            <h2>Explore your space</h2>
          </div>

          <div className="dash-bento">
            <div
              id="dash-symptoms"
              className="bento bento-feature"
            >
              <span className="bento-icon" aria-hidden="true">
                <Activity size={22} />
              </span>

              <strong>Symptom checker</strong>

              <p>
                Pick what feels closest and get calm, clear guidance on what to
                do next.
              </p>

              <span className="bento-list">
                {START_ROWS.map((row) => (
                  <button
                    key={row.name}
                    type="button"
                    className="bento-row"
                    onClick={() => openCheck(row.name)}
                  >
                    <b>{row.name}</b>
                    <small>{row.hint}</small>
                  </button>
                ))}
              </span>

              <button
                type="button"
                className="bento-cta"
                onClick={() => setPickOpen(true)}
              >
                Start a check
                <ArrowUpRight size={16} aria-hidden="true" />
              </button>

              <span className="bento-note">
                Severe bleeding, chest pain or fainting? Seek urgent care.
              </span>
            </div>

            {BENTO.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.title}
                  id={item.id}
                  type="button"
                  className={`bento ${item.cls}`}
                  onClick={() => openModule(item.nav)}
                >
                  <span className="bento-icon" aria-hidden="true">
                    <Icon size={20} />
                  </span>

                  <strong>{item.title}</strong>
                  <p>{item.text}</p>

                  <span className="bento-tags">
                    {item.tags.map((tag) => (
                      <em key={tag}>{tag}</em>
                    ))}
                  </span>

                  <ArrowUpRight
                    className="bento-arrow"
                    size={18}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* BREATHE AND RECENT ACTIVITY */}

        <section className="dash-section dash-two" aria-label="Wellbeing">
          <Breathe />

          <article className="dash-card dash-activity">
            <div className="dash-card-head">
              <h2>Recent activity</h2>
              <span className="pill">Recent</span>
            </div>

            {activityItems.length ? (
              <ol className="dash-timeline">
                {activityItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <li key={item.key}>
                      <span
                        className={`tile-icon ${item.tone}`}
                        aria-hidden="true"
                      >
                        <Icon size={16} />
                      </span>

                      <div>
                        <strong>{item.text}</strong>
                        <small>{item.detail}</small>

                        {item.entry ? (
                          <span style={LINK_ROW}>
                            <button
                              type="button"
                              style={LINK_BTN}
                              onClick={() => openJournal(item.entry)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              style={LINK_BTN}
                              onClick={() => deleteEntry(item.entry)}
                            >
                              Delete
                            </button>
                          </span>
                        ) : null}
                      </div>

                      <time>{item.when}</time>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p style={{ opacity: 0.7 }}>
                Nothing here yet. Log a period or add a journal note.
              </p>
            )}

            <button
              type="button"
              className="dash-note-btn"
              onClick={() => openJournal()}
            >
              Add a journal note
              <ArrowUpRight size={15} aria-hidden="true" />
            </button>

            <div style={PDF_ROW}>
              <select
                aria-label="Journal PDF range"
                style={SELECT_STYLE}
                value={pdfRange}
                disabled={pdfBusy}
                onChange={(event) => setPdfRange(event.target.value)}
              >
                {PDF_RANGES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={downloadJournalPdf}
                disabled={pdfBusy}
              >
                <Download size={15} aria-hidden="true" />
                {pdfBusy ? "Preparing..." : "Download journal (PDF)"}
              </button>
            </div>
          </article>
        </section>

        {/* FOOTER */}

        <footer className="dash-footer">
          <p>
            Femora is an academic healthcare project. It does not provide a
            medical diagnosis.
          </p>

          <nav aria-label="Footer">
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a
              href="#support"
              onClick={(event) => {
                event.preventDefault();
                onOpenHelp?.();
              }}
            >
              Support
            </a>
          </nav>
        </footer>
      </section>
    </div>
  );
}

export default Dashboard;