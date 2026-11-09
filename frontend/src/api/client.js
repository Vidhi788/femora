
const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:8080"
).replace(/\/+$/, "");

const STORAGE_KEY = "femoraUser";

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getToken() {
  try {
    const user = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY)
    );

    return user?.token || null;
  } catch {
    return null;
  }
}

function fallbackMessage(status) {
  if (status === 409)
    return "That email is already registered. Try signing in instead.";

  if (status === 401)
    return "Your session is invalid or expired. Please sign in again.";

  if (status === 403)
    return "You do not have permission to perform this action.";

  if (status === 400)
    return "Some of those details did not look right. Please check and try again.";

  if (status >= 500)
    return "The Femora server had a problem. Please try again in a moment.";

  return "Something went wrong. Please try again.";
}

async function request(path, { method = "GET", body } = {}) {
  let response;

  const headers = new Headers();

  // Add JSON content type when sending a body.
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  // Automatically attach JWT to protected API requests.
  const token = getToken();

  if (token && !path.startsWith("/api/auth/")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      `Cannot reach the Femora server at ${API_BASE}. Please make sure the backend is running.`,
      0
    );
  }

  const raw = await response.text();

  let data = null;

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
  }

  if (response.status === 401) {
    window.dispatchEvent(new Event("femora:unauthorized"));
  }

  if (!response.ok) {
    throw new ApiError(
      data?.message || fallbackMessage(response.status),
      response.status
    );
  }

  return data ?? {};
}

export const authApi = {
  register({ name, email, password }) {
    return request("/api/auth/register", {
      method: "POST",
      body: { name, email, password },
    });
  },

  login({ email, password }) {
    return request("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
  },
};

export const dashboardApi = {
  summary() {
    return request("/api/dashboard");
  },
};

export const profileApi = {
  get(userId) {
    return request(
      `/api/profile?userId=${encodeURIComponent(userId)}`
    );
  },

  cycleSummary(userId) {
    return request(
      `/api/cycle/summary?userId=${encodeURIComponent(userId)}`
    );
  },

  update(profile) {
    return request("/api/profile", {
      method: "PUT",
      body: profile,
    });
  },
};

export { API_BASE };
