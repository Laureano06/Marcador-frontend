export function crestColor(abbr) {
  let hash = 0;
  for (let i = 0; i < abbr.length; i++) {
    hash = abbr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 62%, 58%)`;
}

const TIME_FMT = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatTime(isoString) {
  return TIME_FMT.format(new Date(isoString));
}

// "2026-08-15" a partir de un objeto Date, en horario LOCAL (no UTC) para
// que el día que ve el usuario coincida con su reloj.
export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(dateKey, delta) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  return toDateKey(date);
}

const WEEKDAY_FMT = new Intl.DateTimeFormat("es-AR", { weekday: "short" });
const DAYMONTH_FMT = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
});

// Devuelve algo como "HOY", "MAÑANA", "AYER" o "MIÉ 19 AGO"
export function labelForDate(dateKey) {
  const todayKey = toDateKey(new Date());
  const tomorrowKey = addDays(todayKey, 1);
  const yesterdayKey = addDays(todayKey, -1);

  if (dateKey === todayKey) return "HOY";
  if (dateKey === tomorrowKey) return "MAÑANA";
  if (dateKey === yesterdayKey) return "AYER";

  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = WEEKDAY_FMT.format(date).replace(".", "");
  const dayMonth = DAYMONTH_FMT.format(date).replace(".", "");
  return `${weekday} ${dayMonth}`.toUpperCase();
}

// Orden de prioridad para mostrar las ligas dentro de cada día. Las que no
// aparecen acá se muestran al final, en el orden en que llegan de la API.
// Los nombres tienen que coincidir EXACTO con lo que devuelve la API
// (campo raw.league.name) — si agregás una liga nueva y no aparece en el
// orden que esperás, revisá que el nombre esté bien escrito acá.
export const LEAGUE_ORDER = [
  "Liga Argentina",
  "Copa Argentina",
  "Copa Libertadores",
  "Copa Sudamericana",
  "UEFA Champions League",
  "Premier League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
  "Brasileirão",
];

function leagueRank(name) {
  const i = LEAGUE_ORDER.indexOf(name);
  return i === -1 ? LEAGUE_ORDER.length : i; // desconocidas, al final
}

// Agrupa una lista de partidos por día (clave "YYYY-MM-DD" tomada de
// match.start), preservando el orden cronológico. Se usa en la página de
// una liga puntual, donde los partidos no vienen ya filtrados por día.
export function groupByDate(matches) {
  const groups = {};
  for (const m of matches) {
    const key = toDateKey(new Date(m.start));
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }
  return groups;
}

export function groupByLeague(matches) {
  const groups = {};
  for (const m of matches) {
    const key = m.league || "Otras competencias";
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }

  // Los objetos en JS mantienen el orden de inserción, así que basta con
  // reconstruirlo ya ordenado según LEAGUE_ORDER.
  const sortedEntries = Object.entries(groups).sort(
    (a, b) => leagueRank(a[0]) - leagueRank(b[0])
  );

  return Object.fromEntries(sortedEntries);
}
