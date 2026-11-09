// Simple theme engine: Light (your original look) and Dark.
// Dark comes from the [data-theme="dark"] block already in tokens.css.
// Light needs no overrides, it is the default :root design.

const STORAGE_KEY = "femoraTheme";
export const DEFAULT_THEME = "light";

// `swatch` is only used to draw the little previews on the Settings page.
export const THEMES = [
  {
    id: "light",
    name: "Light",
    note: "Warm cream and clay, the classic Femora look",
    swatch: { bg: "#fffbf8", card: "#f9e9dd", accent: "#cf6f58", ink: "#2a1826" },
  },
  {
    id: "dark",
    name: "Dark",
    note: "Deep plum, easier on the eyes at night",
    swatch: { bg: "#1d111b", card: "#301d2b", accent: "#e0806a", ink: "#fbefe9" },
  },
];

export function applyTheme(id) {
  document.documentElement.setAttribute("data-theme", id);
}

export function getStoredTheme() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    // Anything unknown (including old saved themes) falls back to Light.
    return THEMES.some((theme) => theme.id === value) ? value : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function setTheme(id) {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Theme still applies for this session if storage is blocked.
  }
  applyTheme(id);
}

// Call once, before React renders, so there is no flash of the wrong theme.
export function initTheme() {
  // Signed-out visitors always start on the light sign-in screen.
  let signedIn = false;
  try {
    signedIn = Boolean(window.localStorage.getItem("femoraUser"));
  } catch {
    signedIn = false;
  }
  applyTheme(signedIn ? getStoredTheme() : DEFAULT_THEME);
}