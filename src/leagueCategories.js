// Agrupa las ligas que trae el feed del día (ya vienen TODAS las del
// mundo en una sola request, ver dataSource.js del backend) en las
// categorías del sidebar: Femenino y Juveniles tienen prioridad sobre el
// continente — una liga femenina de Colombia va a "Femenino", no a
// "Sudamérica" — porque así se agrupan mejor al navegar por categoría en
// vez de por país.

const WOMEN_HINTS = [
  "women",
  "womens",
  "female",
  "ladies",
  "femenin",
  "féminine",
  "feminine",
  "femminile",
  "frauen",
  "damen",
  "nwsl",
  "wsl",
  "damallsvenskan",
  "liga f", // Liga F, primera división femenina de España — la sigla no dice "women"/"femenin" en ningún lado
];

const YOUTH_HINTS = [
  "u17",
  "u18",
  "u19",
  "u20",
  "u21",
  "u22",
  "u23",
  "sub-17",
  "sub-18",
  "sub-19",
  "sub-20",
  "sub-21",
  "sub-23",
  "youth",
  "juvenil",
  "junior",
  "reserve",
  "development",
  "academy",
  "primavera",
];

function nameMatches(name, hints) {
  const n = name.toLowerCase();
  return hints.some((h) => n.includes(h));
}

// País tal como lo devuelve BSD (sports.bzzoiro.com) -> continente. A
// diferencia de API-Football (que usaba guiones: "Saudi-Arabia"), BSD usa
// espacios normales ("Saudi Arabia") y para las competencias
// internacionales/continentales el "país" YA es directamente el
// continente ("Europe", "South America", "Africa", "Asia", "Oceania",
// "North America", "International") — se mapean tal cual, sin necesidad
// de una lista aparte de países "World".
//
// Esta lista está verificada contra el directorio real de ligas de BSD
// (GET /api/v2/leagues/) al migrar el 3/9/2026, no adivinada: BSD cubre
// "30+ ligas", así que el universo de países posibles es chico y cerrado
// — mucho más corto que el mapa anterior (pensado para API-Football, que
// sí cubría todo el mundo). Un país nuevo que BSD sume más adelante y no
// esté acá cae en "Otros" (ver categoryForLeague) en vez de romper nada.
const COUNTRY_CONTINENT = {
  // Continentes / agrupaciones que BSD ya manda como "país" directamente
  Africa: "África",
  Asia: "Asia",
  Europe: "Europa",
  "North America": "Norteamérica",
  Oceania: "Oceanía",
  "South America": "Sudamérica",
  International: "Internacional",
  World: "Internacional",

  // Sudamérica (CONMEBOL)
  Argentina: "Sudamérica",
  Bolivia: "Sudamérica",
  Brazil: "Sudamérica",
  Chile: "Sudamérica",
  Colombia: "Sudamérica",
  Ecuador: "Sudamérica",
  Paraguay: "Sudamérica",
  Peru: "Sudamérica",
  Uruguay: "Sudamérica",
  Venezuela: "Sudamérica",

  // Norteamérica (CONCACAF)
  USA: "Norteamérica",
  "United States": "Norteamérica",
  Canada: "Norteamérica",
  Mexico: "Norteamérica",

  // Europa (UEFA) — Turquía va acá porque así compite en la vida real
  England: "Europa",
  Scotland: "Europa",
  Wales: "Europa",
  Ireland: "Europa",
  Spain: "Europa",
  Portugal: "Europa",
  France: "Europa",
  Germany: "Europa",
  Italy: "Europa",
  Netherlands: "Europa",
  Belgium: "Europa",
  Switzerland: "Europa",
  Austria: "Europa",
  Poland: "Europa",
  Denmark: "Europa",
  Sweden: "Europa",
  Norway: "Europa",
  Finland: "Europa",
  Greece: "Europa",
  Turkey: "Europa",
  Romania: "Europa",
  Bulgaria: "Europa",

  // Asia (AFC)
  China: "Asia",
  Japan: "Asia",
  "South Korea": "Asia",
  "Saudi Arabia": "Asia",

  // África (CAF)
  Morocco: "África",
  Nigeria: "África",
  Tunisia: "África",

  // Oceanía (OFC)
  Australia: "Oceanía",
};

export const CATEGORY_ORDER = [
  "Sudamérica",
  "Europa",
  "Norteamérica",
  "Asia",
  "África",
  "Oceanía",
  "Internacional",
  "Juveniles",
  "Femenino",
  "Otros",
];

const COUNTRY_STOPWORDS = new Set(["and", "de", "the", "of"]);

// Abreviatura corta de país para el chip circular del sidebar — no son
// banderas reales (ver DESIGN.md: nada de emoji/glifos haciendo de ícono,
// y muchas banderas son visualmente casi idénticas entre sí, ej.
// Chad/Rumania). Un chip circular con el mismo hash de color que ya usan
// los escudos de respaldo evita ambas cosas: encaja con "círculo =
// identidad" y nunca es ambiguo. "World" (competencias internacionales)
// no tiene país real — se maneja aparte, ver LeagueSidebar.jsx.
export function countryAbbr(country) {
  if (!country) return "";
  const words = country
    .split(/[-\s]+/)
    .filter((w) => w && !COUNTRY_STOPWORDS.has(w.toLowerCase()));
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

export function categoryForLeague(leagueName, country) {
  if (nameMatches(leagueName, WOMEN_HINTS)) return "Femenino";
  if (nameMatches(leagueName, YOUTH_HINTS)) return "Juveniles";
  return COUNTRY_CONTINENT[country] || "Otros";
}

// Arma la estructura del sidebar a partir de los partidos ya cargados
// (no hace ninguna request nueva: reusa lo que trajo el feed del día).
// Devuelve pares [categoría, ligas[]] en el orden fijo de CATEGORY_ORDER,
// salteando categorías vacías.
export function groupLeaguesByCategory(matches) {
  const seen = new Map();
  for (const m of matches) {
    if (seen.has(m.league)) continue;
    seen.set(m.league, {
      name: m.league,
      country: m.leagueCountry,
      category: categoryForLeague(m.league, m.leagueCountry),
    });
  }

  const groups = {};
  for (const league of seen.values()) {
    if (!groups[league.category]) groups[league.category] = [];
    groups[league.category].push(league);
  }
  for (const list of Object.values(groups)) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }

  return CATEGORY_ORDER.filter((c) => groups[c]).map((c) => [c, groups[c]]);
}
