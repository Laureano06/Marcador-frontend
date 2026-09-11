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

// Sigue usada por utils.js (para sacar Juveniles/Femenino del ranking del
// feed) y por src/competitions/regionTree.js (para lo mismo, en el árbol
// del sidebar) — un solo lugar para "esto es una reserva/juvenil/
// femenino", pese a que ninguna de las dos la use ya para categorizar por
// continente (eso ahora vive en src/competitions/config.js, ver
// COUNTRY_META, que además necesitaba distinguir país de organización
// continental — algo que esta función no hacía).
export function categoryForLeague(leagueName, country) {
  if (nameMatches(leagueName, WOMEN_HINTS)) return "Femenino";
  if (nameMatches(leagueName, YOUTH_HINTS)) return "Juveniles";
  return COUNTRY_CONTINENT[country] || "Otros";
}
