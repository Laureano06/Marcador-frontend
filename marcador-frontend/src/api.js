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

// Busca equipos y ligas. Devuelve null (en vez de tirar error) si la
// búsqueda es muy corta, para que el componente que llama no tenga que
// manejar ese caso como una excepción.
export async function search(query) {
  if (!query || query.trim().length < 3) return null;

  const res = await fetch(
    `${API_BASE}/api/search?q=${encodeURIComponent(query.trim())}`
  );
  if (!res.ok) {
    throw new Error(`API respondió ${res.status}`);
  }
  return res.json(); // { teams: [...], leagues: [...] }
}

export async function fetchTeamProfile(teamId) {
  const res = await fetch(`${API_BASE}/api/teams/${teamId}`);
  if (!res.ok) {
    throw new Error(`API respondió ${res.status}`);
  }
  return res.json();
}
