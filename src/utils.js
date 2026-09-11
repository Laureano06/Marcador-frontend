import { categoryForLeague } from "./leagueCategories";
import { rankCompetitions, logCompetitionRanking } from "./competitions/rankCompetitions";
import { detectUserCountry } from "./competitions/userCountry";

// Minuto/fase de un partido en vivo, para el status badge — "45'" en
// juego, "DESC" en el entretiempo (la API no avanza `elapsed` durante el
// descanso, así que mostrar el número ahí sería engañoso), "PENALES" en
// la definición. null cuando no hay nada mejor que mostrar que "EN VIVO"
// solo (partido recién arrancando, dato todavía no disponible).
export function liveMinuteLabel(elapsed, statusShort) {
  if (statusShort === "HT" || statusShort === "BT") return "DESC";
  if (statusShort === "P") return "PENALES";
  if (elapsed != null) return `${elapsed}'`;
  return null;
}

export function crestColor(abbr) {
  let hash = 0;
  for (let i = 0; i < abbr.length; i++) {
    hash = abbr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 62%, 58%)`;
}

// Partidos está pensado en horario argentino de punta a punta (así lo
// arma también el backend, ver APP_TIMEZONE en server.js) — un kickoff
// tiene que verse en hora de Argentina sin importar en qué zona horaria
// esté el dispositivo de quien mira. Antes esto dependía de la zona
// horaria IMPLÍCITA del navegador (new Date() + los getters locales de
// JS): alguien con el reloj/región del sistema mal configurado, o
// mirando desde otro país, veía los horarios de los partidos corridos, y
// "HOY" podía referirse al día equivocado cerca de la medianoche. Fijar
// la zona acá saca esa dependencia del todo.
const TIMEZONE = "America/Argentina/Buenos_Aires";

const TIME_FMT = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIMEZONE,
});

// `isoString` es un INSTANTE real (el kickoff, en UTC tal como lo manda
// la API) — se formatea fijado a hora de Argentina, no a la zona del
// dispositivo.
export function formatTime(isoString) {
  return TIME_FMT.format(new Date(isoString));
}

const CALENDAR_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// "2026-08-15" correspondiente a un instante real (típicamente "ahora"),
// tal como se vive en Argentina en este momento — es la ÚNICA función acá
// que mira la hora real. Todo lo demás (addDays, labelForDate) es
// aritmética de calendario pura sobre el string que esto devuelve, sin
// volver a tocar la hora real ni la zona del dispositivo.
export function toDateKey(date) {
  return CALENDAR_FMT.format(date);
}

// Aritmética de calendario pura: un dateKey no es un instante, es una
// fecha de calendario ("este 15 de agosto"), así que sumar/restar días
// se hace anclado a UTC (Date.UTC + getters UTC) — nunca con la hora
// LOCAL del navegador. Si se usara la hora local acá, un dispositivo en
// otra zona horaria podía cruzar la medianoche al ida-y-vuelta y correr
// el resultado un día. Ancladando a UTC, el resultado es el mismo sin
// importar dónde esté el dispositivo.
export function addDays(dateKey, delta) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + delta);
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// timeZone: "UTC" a propósito: el dateKey ya es una fecha de calendario
// pura anclada a UTC (ver addDays) — formatearla con la zona horaria del
// dispositivo reintroduciría el mismo riesgo de correrse un día cerca de
// la medianoche que addDays evita.
const WEEKDAY_FMT = new Intl.DateTimeFormat("es-AR", { weekday: "short", timeZone: "UTC" });
const DAYMONTH_FMT = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
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
  const date = new Date(Date.UTC(y, m - 1, d));
  const weekday = WEEKDAY_FMT.format(date).replace(".", "");
  const dayMonth = DAYMONTH_FMT.format(date).replace(".", "");
  return `${weekday} ${dayMonth}`.toUpperCase();
}

// Reserva/juveniles y femenino van SIEMPRE al final del feed del día,
// nunca mezclados en el ranking general — una liga de reserva/juvenil no
// debería competir por relevancia con una de primera solo porque hoy
// tenga un partido en vivo. Reusa la misma detección por nombre que ya
// usa el sidebar (leagueCategories.js) — una sola fuente de verdad para
// "esto es una reserva/juvenil/femenino".
const LOW_PRIORITY_CATEGORIES = new Set(["Juveniles", "Femenino"]);

// País del usuario, detectado una sola vez (no depende de nada que
// cambie durante la sesión — ver userCountry.js). rankCompetitions.js
// (SYSTEM A del pedido: relevancia dinámica del feed principal) es
// deliberadamente un módulo aparte de regionTree.js (SYSTEM B: navegación
// estructural del sidebar) — mismo motivo por el que esta función NO se
// reusa para ordenar el sidebar.
const USER_COUNTRY = detectUserCountry();

// Agrupa los partidos del día por liga y ordena los grupos por relevancia
// para el usuario (ver src/competitions/rankCompetitions.js). `favorites`
// es opcional — sin él, el ranking simplemente no aplica ningún boost de
// personalización (favoriteBoost = 0 en todos), el resto de la fórmula
// sigue funcionando igual.
export function groupByLeague(matches, favorites) {
  const groups = {};
  for (const m of matches) {
    const key = m.league || "Otras competencias";
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }

  const favoriteLeagues = favorites?.leagues || [];
  const favoriteTeamIds = favorites?.teams || [];

  const entries = Object.entries(groups);
  const [normalEntries, lowPriorityEntries] = entries.reduce(
    ([norm, low], entry) => {
      const [name, leagueMatches] = entry;
      const country = leagueMatches[0]?.leagueCountry;
      (LOW_PRIORITY_CATEGORIES.has(categoryForLeague(name, country)) ? low : norm).push(entry);
      return [norm, low];
    },
    [[], []]
  );

  const toCompetition = ([name, leagueMatches]) => {
    const first = leagueMatches[0];
    return {
      name,
      leagueMatches,
      id: first?.leagueId,
      country: first?.leagueCountry,
      isLive: leagueMatches.some((m) => m.status === "live"),
      hasFavoriteTeamPlaying: leagueMatches.some(
        (m) => favoriteTeamIds.includes(m.homeId) || favoriteTeamIds.includes(m.awayId)
      ),
    };
  };

  const userContext = { country: USER_COUNTRY, favoriteLeagues };
  const rankedNormal = rankCompetitions(normalEntries.map(toCompetition), userContext);
  const rankedLow = rankCompetitions(lowPriorityEntries.map(toCompetition), userContext);

  logCompetitionRanking(rankedNormal, `Feed del día — ${rankedNormal.length} competencias`);

  return Object.fromEntries(
    [...rankedNormal, ...rankedLow].map((c) => [c.name, c.leagueMatches])
  );
}
