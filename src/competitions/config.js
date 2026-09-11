// Capa de configuración de competencias — a propósito NO tiene ninguna
// lógica, solo datos. rankCompetitions.js (feed) y regionTree.js (sidebar)
// leen de acá; ninguno de los dos hardcodea estos números/nombres.
//
// IDs verificados contra la API real de producción (GET /api/search y
// GET /api/matches) el 11/9/2026 — no adivinados. BSD asigna un id
// numérico estable por liga (`league_id` en cada evento, ver dataSource.js
// del backend); ese id es la clave PRIMARIA acá. El nombre solo se usa
// como fallback para una liga que todavía no vimos en producción (ID
// desconocido) — ej. una edición nueva de Copa América con id distinto al
// de la edición 2024 ya vista.

// --- Continentes/confederación --------------------------------------
// Reusa exactamente las mismas etiquetas en español que ya usa
// leagueCategories.js (Sudamérica/Europa/...) — así "continente de esta
// competencia" y "categoría del sidebar viejo" son un solo concepto, no
// dos mapas separados que puedan desincronizarse.
export const REGION_META = [
  { id: "argentina-local", name: "Argentina", isLocalShortcut: true },
  { id: "south-america", name: "Sudamérica", org: "CONMEBOL" },
  { id: "europe", name: "Europa", org: "UEFA" },
  { id: "north-america", name: "Norteamérica", org: "CONCACAF" },
  { id: "international", name: "Internacional" },
  { id: "asia", name: "Asia", org: "AFC" },
  { id: "africa", name: "África", org: "CAF" },
  { id: "oceania", name: "Oceanía", org: "OFC" },
];

// País tal como lo devuelve BSD -> {region, iso2}. iso2 sirve para
// comparar contra el país del usuario (userCountry, ver userCountry.js)
// sin necesidad de un segundo mapa en sentido inverso.
export const COUNTRY_META = {
  // Continentes que BSD manda directamente como "país" de la competencia
  // (ver dataSource.js) — sin iso2 propio, van a la región tal cual.
  Africa: { region: "africa" },
  Asia: { region: "asia" },
  Europe: { region: "europe" },
  "North America": { region: "north-america" },
  Oceania: { region: "oceania" },
  "South America": { region: "south-america" },
  International: { region: "international" },
  World: { region: "international" },

  // Sudamérica
  Argentina: { region: "south-america", iso2: "AR" },
  Bolivia: { region: "south-america", iso2: "BO" },
  Brazil: { region: "south-america", iso2: "BR" },
  Chile: { region: "south-america", iso2: "CL" },
  Colombia: { region: "south-america", iso2: "CO" },
  Ecuador: { region: "south-america", iso2: "EC" },
  Paraguay: { region: "south-america", iso2: "PY" },
  Peru: { region: "south-america", iso2: "PE" },
  Uruguay: { region: "south-america", iso2: "UY" },
  Venezuela: { region: "south-america", iso2: "VE" },

  // Norteamérica
  USA: { region: "north-america", iso2: "US" },
  "United States": { region: "north-america", iso2: "US" },
  Canada: { region: "north-america", iso2: "CA" },
  Mexico: { region: "north-america", iso2: "MX" },

  // Europa
  England: { region: "europe", iso2: "GB" },
  Scotland: { region: "europe", iso2: "GB" },
  Wales: { region: "europe", iso2: "GB" },
  Ireland: { region: "europe", iso2: "IE" },
  Spain: { region: "europe", iso2: "ES" },
  Portugal: { region: "europe", iso2: "PT" },
  France: { region: "europe", iso2: "FR" },
  Germany: { region: "europe", iso2: "DE" },
  Italy: { region: "europe", iso2: "IT" },
  Netherlands: { region: "europe", iso2: "NL" },
  Belgium: { region: "europe", iso2: "BE" },
  Switzerland: { region: "europe", iso2: "CH" },
  Austria: { region: "europe", iso2: "AT" },
  Poland: { region: "europe", iso2: "PL" },
  Denmark: { region: "europe", iso2: "DK" },
  Sweden: { region: "europe", iso2: "SE" },
  Norway: { region: "europe", iso2: "NO" },
  Finland: { region: "europe", iso2: "FI" },
  Greece: { region: "europe", iso2: "GR" },
  Turkey: { region: "europe", iso2: "TR" },
  Romania: { region: "europe", iso2: "RO" },
  Bulgaria: { region: "europe", iso2: "BG" },

  // Asia
  China: { region: "asia", iso2: "CN" },
  Japan: { region: "asia", iso2: "JP" },
  "South Korea": { region: "asia", iso2: "KR" },
  "Saudi Arabia": { region: "asia", iso2: "SA" },

  // África
  Morocco: { region: "africa", iso2: "MA" },
  Nigeria: { region: "africa", iso2: "NG" },
  Tunisia: { region: "africa", iso2: "TN" },

  // Oceanía
  Australia: { region: "oceania", iso2: "AU" },
};

// --- Tiers de importancia base (0-100), independientes del usuario ----
export const BASE_IMPORTANCE = {
  GLOBAL_ELITE: 100, // Mundial
  CONTINENTAL_ELITE: 85, // Champions League, Libertadores
  CONTINENTAL_NATIONAL_TEAM: 82, // Copa América, Eurocopa
  TOP_DOMESTIC: 80, // Premier League, Liga Profesional Argentina
  TOP_DOMESTIC_SECONDARY: 75, // LaLiga/Serie A/Bundesliga tier
  CONTINENTAL_SECONDARY: 70, // Copa Sudamericana
  MID_DOMESTIC: 68, // Ligue 1 y similares
  CONTINENTAL_MINOR: 60, // Recopa, Europa League
  REGIONAL_TOP: 55, // Brasileirão, Liga MX, Saudi Pro League, MLS
  REGIONAL_SECONDARY: 45, // Categoría Primera A, ligas regionales top-flight
  LOWER_DIVISION: 30, // Championship, Serie B, Segunda División
  DEFAULT: 25, // cualquier otra liga no listada
};

// Bonus por "alcance" del torneo (mundial/continental/doméstico) — ver
// rankCompetitions.js: se suma un bonus extra si además coincide con la
// confederación del propio usuario (Libertadores pesa más para alguien de
// Sudamérica que para alguien de Europa, aunque sea la misma competencia).
export const SCOPE_BONUS = {
  global: 15,
  continental: 12,
  domestic: 8,
  minor: 3,
};
export const HOME_CONFEDERATION_BONUS = 15;

// Popularidad mundial (0-30) — independiente de dónde sea el usuario.
export const POPULARITY = {
  DEFAULT: 3,
};

export const EVENT_IMPORTANCE = {
  final: 100,
  semifinal: 70,
  quarterfinal: 40,
  knockout: 25,
  regular: 0,
};

export const LIVE_BOOST = 10;

// Boost de personalización — arquitectura lista, sin infraestructura
// nueva: favoritos YA existen (useFavorites.js, por nombre de liga/id de
// equipo). "vista frecuente" no se trackea todavía en ningún lado — el
// campo queda previsto (frequentlyViewedBoost) y el ranking simplemente
// no lo aplica hasta que exista esa señal.
export const FAVORITE_BOOST = {
  favoriteCompetition: 45,
  favoriteTeamPlaying: 35,
  frequentlyViewed: 15, // reservado — no hay señal real todavía
};

// --- Registro de competencias conocidas -------------------------------
// Clave PRIMARIA: id numérico de BSD (competitionId). "names" es una
// lista de fallback para cuando la competencia todavía no tiene id
// confirmado en este archivo (torneo nuevo, edición con id distinto) —
// se usa solo si el id no matcheó nada, nunca al revés.
//
// scope: "global" | "continental" | "domestic" | "minor"
// tier: una clave de BASE_IMPORTANCE
export const COMPETITION_REGISTRY = {
  27: { tier: "GLOBAL_ELITE", scope: "global", popularity: 30, names: ["World Cup", "FIFA World Cup"] },
  7: { tier: "CONTINENTAL_ELITE", scope: "continental", popularity: 25, names: ["Champions League", "UEFA Champions League"] },
  32: { tier: "CONTINENTAL_ELITE", scope: "continental", popularity: 15, names: ["Copa Libertadores", "CONMEBOL Libertadores"] },
  67: { tier: "CONTINENTAL_NATIONAL_TEAM", scope: "continental", popularity: 10, names: ["Copa America", "Copa América"] },
  33: { tier: "CONTINENTAL_SECONDARY", scope: "continental", popularity: 8, names: ["Copa Sudamericana", "CONMEBOL Sudamericana"] },
  8: { tier: "CONTINENTAL_MINOR", scope: "continental", popularity: 11, names: ["Europa League", "UEFA Europa League"] },
  83: { tier: "CONTINENTAL_MINOR", scope: "continental", popularity: 6, names: ["Conference League", "UEFA Europa Conference League"] },
  1: { tier: "TOP_DOMESTIC", scope: "domestic", popularity: 20, names: ["Premier League"] },
  85: { tier: "TOP_DOMESTIC", scope: "domestic", popularity: 10, names: ["Liga Profesional de Fútbol", "Liga Profesional Argentina"] },
  3: { tier: "TOP_DOMESTIC_SECONDARY", scope: "domestic", popularity: 18, names: ["La Liga", "LaLiga"] },
  4: { tier: "TOP_DOMESTIC_SECONDARY", scope: "domestic", popularity: 15, names: ["Serie A"] },
  5: { tier: "TOP_DOMESTIC_SECONDARY", scope: "domestic", popularity: 13, names: ["Bundesliga"] },
  6: { tier: "MID_DOMESTIC", scope: "domestic", popularity: 10, names: ["Ligue 1"] },
  9: { tier: "REGIONAL_TOP", scope: "domestic", popularity: 12, names: ["Brasileirão Serie A", "Brasileirão"] },
  18: { tier: "REGIONAL_TOP", scope: "domestic", popularity: 8, names: ["MLS"] },
  19: { tier: "REGIONAL_TOP", scope: "domestic", popularity: 6, names: ["Liga MX Apertura", "Liga MX"] },
  20: { tier: "REGIONAL_TOP", scope: "domestic", popularity: 6, names: ["Liga MX Clausura"] },
  17: { tier: "REGIONAL_TOP", scope: "domestic", popularity: 8, names: ["Saudi Pro League"] },
  80: { tier: "REGIONAL_SECONDARY", scope: "domestic", popularity: 5, names: ["Categoría Primera A"] },
  12: { tier: "LOWER_DIVISION", scope: "domestic", popularity: 8, names: ["Championship"] },
  34: { tier: "LOWER_DIVISION", scope: "domestic", popularity: 5, names: ["Brasileirão Serie B"] },
  38: { tier: "LOWER_DIVISION", scope: "domestic", popularity: 3, names: ["Segunda División"] },
  89: { tier: "LOWER_DIVISION", scope: "domestic", popularity: 3, names: ["Ligue 2"] },
  88: { tier: "LOWER_DIVISION", scope: "domestic", popularity: 2, names: ["Liga Portugal 2"] },
  2: { tier: "TOP_DOMESTIC_SECONDARY", scope: "domestic", popularity: 6, names: ["Liga Portugal Betclic", "Primeira Liga"] },
  35: { tier: "REGIONAL_SECONDARY", scope: "domestic", popularity: 4, names: ["Copa do Brasil"] },
};

// Fallback por NOMBRE — última red antes de caer al default genérico.
// Cada entrada de COMPETITION_REGISTRY ya trae sus propios "names" (así
// una liga vista con un id nuevo pero nombre conocido no cae al default).
export function findRegistryEntryByName(name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  for (const entry of Object.values(COMPETITION_REGISTRY)) {
    if (entry.names.some((n) => n.toLowerCase() === lower)) return entry;
  }
  return null;
}
