// Plain GET request. Change BASE if your backend runs on another port.
const BASE = `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/yoga`;

export async function fetchPoses(category) {
  const res = await fetch(BASE + "?category=" + category);
  if (!res.ok) {
    throw new Error("Could not load poses");
  }
  return res.json();
}