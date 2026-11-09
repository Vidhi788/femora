import { useCallback, useEffect, useState } from "react";

import Toast from "./components/Toast.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Yoga from "./pages/Yoga.jsx";
import PcosChecker from "./pages/PcosChecker.jsx";
import PregnancyChecker from "./pages/PregnancyChecker.jsx";
import GeneralChecker from "./pages/GeneralChecker.jsx";
import BackPainChecker from "./pages/BackPainChecker.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import DoctorFinder from "./pages/Doctorfinder.jsx";
import PeriodPainYoga from "./pages/yoga/PeriodPainYoga.jsx";
import PcosYoga from "./pages/yoga/PcosYoga.jsx";
import MenopauseYoga from "./pages/yoga/MenopauseYoga.jsx";
import FoodDiet from "./pages/yoga/FoodDiet.jsx";
import Settings from "./pages/Settings.jsx";
import HelpSupport from "./pages/HelpSupport.jsx";

import { applyTheme, getStoredTheme } from "./theme.js";
import { apiFetch } from "./api/http.js";

import "./styles/auth.css";

const STORAGE_KEY = "femoraUser";
const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

const LIGHT_ONLY_PAGES = ["login", "register"];

// Read saved user session.
function readStoredUser() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    return parsed && typeof parsed === "object"
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function App() {
  const [user, setUser] = useState(readStoredUser);

  const [page, setPage] = useState(() =>
    readStoredUser()?.userId ? "checking" : "login"
  );

  const [toast, setToast] = useState(null);

  // Toast notification.
  const showToast = useCallback((next) => {
    setToast({
      ...next,
      id: Date.now(),
    });
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  // Check saved user profile when the app opens.
  useEffect(() => {
    if (page !== "checking" || !user?.userId) {
      return undefined;
    }

    let cancelled = false;

    apiFetch(
      `${API_BASE}/api/profile?userId=${encodeURIComponent(
        user.userId
      )}`
    )
      .then(() => {
        if (cancelled) return;

        // Let the dashboard handle a missing profile.
        setPage("dashboard");
      })
      .catch(() => {
        // Keep the user in the dashboard if the backend
        // is unavailable so existing dashboard retry logic works.
        if (!cancelled) {
          setPage("dashboard");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, user]);

  // Apply application theme.
  useEffect(() => {
    const lightOnly =
      !user || LIGHT_ONLY_PAGES.includes(page);

    applyTheme(lightOnly ? "light" : getStoredTheme());
  }, [page, user]);

  // Start selected pages at the top.
  useEffect(() => {
    if (
      page.startsWith("yoga") ||
      [
        "pcos",
        "pregnancy",
        "general",
        "backpain",
        "products",
        "doctors",
        "settings",
        "help",
      ].includes(page)
    ) {
      window.scrollTo({ top: 0 });
    }
  }, [page]);

  // Handle expired or invalid JWT.
  useEffect(() => {
    function onExpired() {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage errors.
      }

      setUser(null);
      setPage("login");

      showToast({
        tone: "info",
        title: "Please sign in again",
        message: "Your session has ended.",
      });
    }

    window.addEventListener(
      "femora:unauthorized",
      onExpired
    );

    return () => {
      window.removeEventListener(
        "femora:unauthorized",
        onExpired
      );
    };
  }, [showToast]);

  // Save authenticated user and open dashboard.
  function handleAuthenticated(nextUser, message) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(nextUser)
      );
    } catch {
      // Ignore storage errors.
    }

    setUser(nextUser);
    setPage("dashboard");

    showToast({
      tone: "good",
      title: `Welcome, ${nextUser.name || "friend"}`,
      message: message || "Your Femora dashboard is ready.",
    });
  }

  // Logout.
  function handleLogout() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors.
    }

    setUser(null);
    setPage("login");

    showToast({
      tone: "info",
      title: "Signed out",
      message: "Take care of yourself - see you soon.",
    });
  }

  // If a page detects a missing profile, return to dashboard.
  const handleProfileMissing = useCallback(() => {
    setPage("dashboard");
  }, []);

  // Navigation functions.
  const openYoga = useCallback(() => setPage("yoga"), []);
  const openPcos = useCallback(() => setPage("pcos"), []);
  const openPregnancy = useCallback(
    () => setPage("pregnancy"),
    []
  );
  const openGeneral = useCallback(
    () => setPage("general"),
    []
  );
  const openBackPain = useCallback(
    () => setPage("backpain"),
    []
  );
  const openProducts = useCallback(
    () => setPage("products"),
    []
  );
  const openDoctors = useCallback(
    () => setPage("doctors"),
    []
  );
  const openSettings = useCallback(
    () => setPage("settings"),
    []
  );
  const openHelp = useCallback(() => setPage("help"), []);

  return (
    <>
      {page === "register" ? (
        <Register
          key="register"
          onNavigate={setPage}
          onAuthenticated={handleAuthenticated}
          onToast={showToast}
        />
      ) : page === "checking" && user ? (
        <main
          key="checking"
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            color: "var(--ink-500, #7a6a6f)",
          }}
        >
          <p>Loading your space...</p>
        </main>
      ) : page === "pcos" && user ? (
        <PcosChecker
          key="pcos"
          user={user}
          onToast={showToast}
          onProfileMissing={handleProfileMissing}
          onBack={() => setPage("dashboard")}
          onFindDoctor={openDoctors}
        />
      ) : page === "pregnancy" && user ? (
        <PregnancyChecker
          key="pregnancy"
          user={user}
          onToast={showToast}
          onBack={() => setPage("dashboard")}
          onFindDoctor={openDoctors}
        />
      ) : page === "general" && user ? (
        <GeneralChecker
          key="general"
          user={user}
          onToast={showToast}
          onBack={() => setPage("dashboard")}
          onFindDoctor={openDoctors}
        />
      ) : page === "backpain" && user ? (
        <BackPainChecker
          key="backpain"
          user={user}
          onToast={showToast}
          onBack={() => setPage("dashboard")}
          onFindDoctor={openDoctors}
        />
      ) : page === "products" && user ? (
        <ProductsPage
          key="products"
          onBack={() => setPage("dashboard")}
        />
      ) : page === "doctors" && user ? (
        <DoctorFinder
          key="doctors"
          onBack={() => setPage("dashboard")}
        />
      ) : page === "settings" && user ? (
        <Settings
          key="settings"
          user={user}
          onToast={showToast}
          onProfileMissing={handleProfileMissing}
          onBack={() => setPage("dashboard")}
        />
      ) : page === "help" && user ? (
        <HelpSupport
          key="help"
          user={user}
          onToast={showToast}
          onBack={() => setPage("dashboard")}
        />
      ) : page === "yoga" && user ? (
        <Yoga key="yoga" onNavigate={setPage} />
      ) : page === "yoga-period-pain" && user ? (
        <PeriodPainYoga
          key="yoga-period-pain"
          onNavigate={setPage}
        />
      ) : page === "yoga-pcos" && user ? (
        <PcosYoga
          key="yoga-pcos"
          onNavigate={setPage}
        />
      ) : page === "yoga-menopause" && user ? (
        <MenopauseYoga
          key="yoga-menopause"
          onNavigate={setPage}
        />
      ) : page === "yoga-diet" && user ? (
        <FoodDiet
          key="yoga-diet"
          onNavigate={setPage}
        />
      ) : page === "dashboard" && user ? (
        <Dashboard
          key="dashboard"
          user={user}
          onLogout={handleLogout}
          onToast={showToast}
          onProfileMissing={handleProfileMissing}
          onOpenYoga={openYoga}
          onOpenPcos={openPcos}
          onOpenPregnancy={openPregnancy}
          onOpenGeneral={openGeneral}
          onOpenBackPain={openBackPain}
          onOpenProducts={openProducts}
          onOpenDoctors={openDoctors}
          onOpenSettings={openSettings}
          onOpenHelp={openHelp}
        />
      ) : (
        <Login
          key="login"
          onNavigate={setPage}
          onAuthenticated={handleAuthenticated}
          onToast={showToast}
        />
      )}

      <Toast
        key={toast?.id ?? "empty"}
        toast={toast}
        onClose={dismissToast}
      />
    </>
  );
}

export default App;