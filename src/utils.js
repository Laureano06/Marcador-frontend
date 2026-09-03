import { categoryForLeague } from "./leagueCategories";

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

// Orden de prioridad para mostrar las ligas dentro de cada día:
// 1) TODAS las competencias de Argentina (por país, no por nombre — así
//    entra Liga Profesional, Copa Argentina, Primera Nacional, etc. sin
//    tener que listarlas una por una).
// 2) Las 5 grandes ligas europeas, en este orden: Inglaterra, Italia,
//    Francia, España, Alemania.
// 3) Las copas internacionales top: Libertadores y Champions League.
// El resto se muestra después, en el orden en que llega de la API. Los
// nombres tienen que coincidir EXACTO con lo que devuelve la API (campo
// raw.league.name) — si una liga nueva no aparece en el orden esperado,
// revisá que el nombre esté bien escrito acá.
const LEAGUE_NAME_ORDER = [
  "Premier League", // Inglaterra
  "Serie A", // Italia
  "Ligue 1", // Francia
  "La Liga", // España
  "Bundesliga", // Alemania
  "CONMEBOL Libertadores",
  "UEFA Champions League",
];

// Reserva/juveniles y femenino van SIEMPRE al final del feed del día,
// nunca mezclados en el bloque genérico de "el resto" — antes ese bloque
// se mostraba en el orden crudo de la API, que no tiene ninguna relación
// con relevancia, y una liga de reserva (ej. "Reserve League") podía
// terminar apareciendo primero en el día, antes que ligas de primera de
// cualquier país. Reusa la misma detección por nombre que ya usa el
// sidebar (leagueCategories.js) — una sola fuente de verdad para "esto es
// una reserva/juvenil/femenino", no una lista separada para mantener acá.
const LOW_PRIORITY_CATEGORIES = new Set(["Juveniles", "Femenino"]);
const LOW_PRIORITY_RANK = 1000;

function leagueRank(name, country) {
  // Esta regla va PRIMERO a propósito: "Reserve League" de Argentina es
  // Argentina Y reserva a la vez — si el chequeo de país fuera primero,
  // el país siempre ganaba y la liga de reserva terminaba arriba de
  // todo. Reserva/juveniles/femenino van al final sin importar el país.
  if (LOW_PRIORITY_CATEGORIES.has(categoryForLeague(name, country))) {
    return LOW_PRIORITY_RANK;
  }
  if (country === "Argentina") return 0;
  const i = LEAGUE_NAME_ORDER.indexOf(name);
  return i === -1 ? LEAGUE_NAME_ORDER.length + 1 : i + 1;
}

export function groupByLeague(matches) {
  const groups = {};
  for (const m of matches) {
    const key = m.league || "Otras competencias";
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }

  // Los objetos en JS mantienen el orden de inserción, así que basta con
  // reconstruirlo ya ordenado por prioridad. El país de cada liga sale
  // del primer partido del grupo (todos comparten liga -> mismo país).
  const sortedEntries = Object.entries(groups).sort(
    (a, b) =>
      leagueRank(a[0], a[1][0]?.leagueCountry) -
      leagueRank(b[0], b[1][0]?.leagueCountry)
  );

  return Object.fromEntries(sortedEntries);
}
