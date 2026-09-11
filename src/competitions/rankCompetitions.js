// SYSTEM A del pedido: "¿qué fútbol es más relevante para este usuario
// HOY?" — motor de ranking del feed principal. Deliberadamente separado
// de regionTree.js (SYSTEM B, la navegación del sidebar): ese es
// estructural y predecible a propósito, este es dinámico a propósito. Ver
// el comentario grande al final de este archivo para el porqué.
import {
  BASE_IMPORTANCE,
  COMPETITION_REGISTRY,
  COUNTRY_META,
  EVENT_IMPORTANCE,
  FAVORITE_BOOST,
  HOME_CONFEDERATION_BONUS,
  LIVE_BOOST,
  POPULARITY,
  SCOPE_BONUS,
  findRegistryEntryByName,
} from "./config";

function registryEntryFor(competitionId, name) {
  return COMPETITION_REGISTRY[competitionId] || findRegistryEntryByName(name) || null;
}

function continentOf(countryName) {
  return COUNTRY_META[countryName]?.region || null;
}

// País BSD (nombre en inglés) correspondiente a un iso2 de usuario — el
// mismo COUNTRY_META sirve en los dos sentidos, así no hace falta
// mantener una segunda tabla invertida a mano.
function bsdCountryForIso(iso2) {
  if (!iso2) return null;
  for (const [country, meta] of Object.entries(COUNTRY_META)) {
    if (meta.iso2 === iso2) return country;
  }
  return null;
}

/**
 * getCompetitionPriority(competition, userContext) -> { total, breakdown }
 *
 * competition: { id (leagueId de BSD), name, country (nombre BSD),
 *                isLive?, stage? }
 * userContext: { country (iso2 o null), favoriteLeagues? (string[], por
 *                nombre — mismo contrato que useFavorites.js),
 *                favoriteTeamIds? (number[]), hasFavoriteTeamPlaying?,
 *                frequentlyViewedLeagues? (reservado, sin señal real hoy) }
 */
export function getCompetitionPriority(competition, userContext = {}) {
  const { id, name, country, isLive, stage } = competition;
  const entry = registryEntryFor(id, name);

  const baseImportance = BASE_IMPORTANCE[entry?.tier] ?? BASE_IMPORTANCE.DEFAULT;
  const popularity = entry?.popularity ?? POPULARITY.DEFAULT;
  const scope = entry?.scope || "minor";

  const userBsdCountry = bsdCountryForIso(userContext.country);
  const countryRelevance = userBsdCountry && country === userBsdCountry ? 50 : 0;

  const userContinent = userContext.country ? continentOf(userBsdCountry) : null;
  const competitionContinent = continentOf(country);
  const homeConfederation =
    scope === "continental" && userContinent && userContinent === competitionContinent
      ? HOME_CONFEDERATION_BONUS
      : 0;
  const continentalImportance = (SCOPE_BONUS[scope] ?? SCOPE_BONUS.minor) + homeConfederation;

  const isFavoriteCompetition = (userContext.favoriteLeagues || []).includes(name);
  const favoriteBoost =
    (isFavoriteCompetition ? FAVORITE_BOOST.favoriteCompetition : 0) +
    (competition.hasFavoriteTeamPlaying ? FAVORITE_BOOST.favoriteTeamPlaying : 0);

  const eventImportance = EVENT_IMPORTANCE[stage] ?? EVENT_IMPORTANCE.regular;
  const liveBoost = isLive ? LIVE_BOOST : 0;

  const total =
    baseImportance +
    countryRelevance +
    continentalImportance +
    popularity +
    favoriteBoost +
    eventImportance +
    liveBoost;

  return {
    total,
    breakdown: {
      baseImportance,
      countryRelevance,
      continentalImportance,
      popularity,
      favoriteBoost,
      eventImportance,
      liveBoost,
    },
  };
}

// Ordena una lista de competencias de mayor a menor relevancia. No muta
// el array de entrada. En dev, junta las tablas de desglose para poder
// inspeccionarlas de una — ver logCompetitionRanking más abajo.
export function rankCompetitions(competitions, userContext = {}) {
  const scored = competitions.map((c) => {
    const { total, breakdown } = getCompetitionPriority(c, userContext);
    return { ...c, priorityScore: total, priorityBreakdown: breakdown };
  });
  scored.sort((a, b) => b.priorityScore - a.priorityScore);
  return scored;
}

// Punto 7 — debugging en desarrollo: console.table con el desglose
// completo por competencia, algo como:
//   competencia              | baseImportance | countryRelevance | ... | TOTAL
//   Champions League         | 95             | 0                | ... | 145
// Se llama explícitamente desde donde se arma el feed (no automático en
// cada render) para no ensuciar la consola en cada actualización de
// polling.
export function logCompetitionRanking(rankedCompetitions, label = "Ranking de competencias") {
  if (!import.meta.env.DEV) return;
  const rows = {};
  for (const c of rankedCompetitions) {
    rows[c.name] = { ...c.priorityBreakdown, TOTAL: c.priorityScore };
  }
  // eslint-disable-next-line no-console
  console.groupCollapsed(`[ranking] ${label}`);
  // eslint-disable-next-line no-console
  console.table(rows);
  // eslint-disable-next-line no-console
  console.groupEnd();
}

// ============================================================
// Por qué este archivo NO es el mismo sistema que regionTree.js:
//
// SYSTEM A (este archivo) responde "¿qué es más relevante para mí HOY?".
// Es dinámico a propósito: cambia con el país del usuario, con si hay un
// partido en vivo, con una final, con los favoritos. El mismo usuario
// puede ver un orden distinto mañana si hay una final de Champions.
//
// SYSTEM B (regionTree.js) responde "¿dónde encuentro una competencia?".
// Es estructural a propósito: Región -> País/Organización -> Competencia,
// siempre en el mismo orden, sin importar quién juega en vivo. Si el
// sidebar se reordenara con este mismo ranking, un usuario que aprendió
// "Europa está tercero" tendría que volver a aprenderlo cada vez que
// una final vuelve a poner otra cosa arriba — el objetivo del sidebar es
// exactamente lo opuesto: previsibilidad.
// ============================================================
