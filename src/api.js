const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

// Los 4 endpoints del backend comparten el mismo contrato: si hay algo
// cacheado (aunque esté vencido) lo devuelven igual con `stale: true` y
// status 200 — nunca hace falta manejar eso acá, ya llega como un dato
// más. Solo cuando el cache está vacío Y la cuota está agotada responden
// sin datos (503/502) — ahí sí no queda otra que mostrar un error. Este
// helper solo mejora el mensaje de ese caso, leyendo el `error` que
// manda el backend en vez de un genérico "API respondió 503".
async function getJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error || `API respondió ${res.status}`);
  }
  return body;
}

export async function fetchDay(dateKey) {
  return getJson(`/api/matches?date=${encodeURIComponent(dateKey)}`); // { updatedAt, matches: [...], stale? }
}

// Busca equipos y ligas. Devuelve null (en vez de tirar error) si la
// búsqueda es muy corta, para que el componente que llama no tenga que
// manejar ese caso como una excepción.
export async function search(query) {
  if (!query || query.trim().length < 3) return null;
  return getJson(`/api/search?q=${encodeURIComponent(query.trim())}`); // { teams: [...], leagues: [...] }
}

export async function fetchTeamProfile(teamId) {
  return getJson(`/api/teams/${teamId}`);
}

export async function fetchMatchDetail(matchId) {
  return getJson(`/api/matches/${matchId}`);
}
