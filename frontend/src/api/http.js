
const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:8080"
).replace(/\/+$/, "");

const STORAGE_KEY = "femoraUser";

export function getStoredUser() {
  try {
    return JSON.parse(
      window.localStorage.getItem(STORAGE_KEY)
    ) || null;
  } catch {
    return null;
  }
}

export function getToken() {
  return getStoredUser()?.token || null;
}

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();

  if (token && url.startsWith(API_BASE)) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (
    options.body !== undefined &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      `Cannot connect to Femora server at ${API_BASE}. Check that your backend is running.`,
      0
    );
  }

  if (response.status === 401) {
    window.dispatchEvent(
      new Event("femora:unauthorized")
    );
  }

  return response;
}

export { apiFetch, API_BASE };
