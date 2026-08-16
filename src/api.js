const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export async function fetchDay(dateKey) {
  const res = await fetch(
    `${API_BASE}/api/matches?date=${encodeURIComponent(dateKey)}`
  );
  if (!res.ok) {
    throw new Error(`API respondió ${res.status}`);
  }
  return res.json(); // { updatedAt, matches: [...] }
}
