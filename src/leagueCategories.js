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

// País tal como lo devuelve API-Football (guiones en vez de espacios) ->
// continente/confederación futbolística. Los casos transcontinentales
// (Rusia, Turquía, Kazajistán, Armenia, Georgia, Azerbaiyán, Chipre,
// Israel) van a "Europa" porque así compiten en la vida real (UEFA), no
// por geografía estricta.
const COUNTRY_CONTINENT = {
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

  // Norteamérica y Caribe (CONCACAF)
  "United-States": "Norteamérica",
  USA: "Norteamérica",
  Canada: "Norteamérica",
  Mexico: "Norteamérica",
  "Costa-Rica": "Norteamérica",
  Honduras: "Norteamérica",
  Guatemala: "Norteamérica",
  "El-Salvador": "Norteamérica",
  Nicaragua: "Norteamérica",
  Panama: "Norteamérica",
  Belize: "Norteamérica",
  Jamaica: "Norteamérica",
  "Trinidad-and-Tobago": "Norteamérica",
  Haiti: "Norteamérica",
  "Dominican-Republic": "Norteamérica",
  Cuba: "Norteamérica",
  Bahamas: "Norteamérica",
  Barbados: "Norteamérica",
  Suriname: "Norteamérica",
  Guyana: "Norteamérica",
  "Puerto-Rico": "Norteamérica",
  Bermuda: "Norteamérica",
  Curacao: "Norteamérica",
  Aruba: "Norteamérica",

  // Europa (UEFA)
  England: "Europa",
  Scotland: "Europa",
  Wales: "Europa",
  "Northern-Ireland": "Europa",
  "Republic-of-Ireland": "Europa",
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
  "Czech-Republic": "Europa",
  Slovakia: "Europa",
  Hungary: "Europa",
  Romania: "Europa",
  Bulgaria: "Europa",
  Greece: "Europa",
  Turkey: "Europa",
  Russia: "Europa",
  Ukraine: "Europa",
  Belarus: "Europa",
  Serbia: "Europa",
  Croatia: "Europa",
  Slovenia: "Europa",
  "Bosnia-and-Herzegovina": "Europa",
  Bosnia: "Europa",
  "North-Macedonia": "Europa",
  Montenegro: "Europa",
  Albania: "Europa",
  Kosovo: "Europa",
  Moldova: "Europa",
  Georgia: "Europa",
  Armenia: "Europa",
  Azerbaijan: "Europa",
  Kazakhstan: "Europa",
  Cyprus: "Europa",
  Israel: "Europa",
  Denmark: "Europa",
  Sweden: "Europa",
  Norway: "Europa",
  Finland: "Europa",
  Iceland: "Europa",
  "Faroe-Islands": "Europa",
  Estonia: "Europa",
  Latvia: "Europa",
  Lithuania: "Europa",
  Luxembourg: "Europa",
  Malta: "Europa",
  "San-Marino": "Europa",
  Andorra: "Europa",
  Gibraltar: "Europa",
  Liechtenstein: "Europa",
  Monaco: "Europa",

  // Asia (AFC)
  China: "Asia",
  Japan: "Asia",
  "South-Korea": "Asia",
  "North-Korea": "Asia",
  India: "Asia",
  Iran: "Asia",
  Iraq: "Asia",
  "Saudi-Arabia": "Asia",
  "United-Arab-Emirates": "Asia",
  Qatar: "Asia",
  Kuwait: "Asia",
  Bahrain: "Asia",
  Oman: "Asia",
  Jordan: "Asia",
  Lebanon: "Asia",
  Syria: "Asia",
  Yemen: "Asia",
  Uzbekistan: "Asia",
  Turkmenistan: "Asia",
  Tajikistan: "Asia",
  Kyrgyzstan: "Asia",
  Afghanistan: "Asia",
  Pakistan: "Asia",
  Bangladesh: "Asia",
  "Sri-Lanka": "Asia",
  Nepal: "Asia",
  Myanmar: "Asia",
  Thailand: "Asia",
  Vietnam: "Asia",
  Malaysia: "Asia",
  Singapore: "Asia",
  Indonesia: "Asia",
  Philippines: "Asia",
  Cambodia: "Asia",
  Laos: "Asia",
  Mongolia: "Asia",
  "Hong-Kong": "Asia",
  "Chinese-Taipei": "Asia",
  Macau: "Asia",
  Bhutan: "Asia",
  Maldives: "Asia",
  Brunei: "Asia",
  "Timor-Leste": "Asia",

  // África (CAF)
  "South-Africa": "África",
  Nigeria: "África",
  Egypt: "África",
  Morocco: "África",
  Algeria: "África",
  Tunisia: "África",
  Libya: "África",
  Ghana: "África",
  Cameroon: "África",
  Senegal: "África",
  "Ivory-Coast": "África",
  Mali: "África",
  "Burkina-Faso": "África",
  Guinea: "África",
  Tanzania: "África",
  Kenya: "África",
  Uganda: "África",
  Ethiopia: "África",
  Zambia: "África",
  Zimbabwe: "África",
  Mozambique: "África",
  Angola: "África",
  "DR-Congo": "África",
  Congo: "África",
  Gabon: "África",
  Namibia: "África",
  Botswana: "África",
  Rwanda: "África",
  Benin: "África",
  Togo: "África",
  "Sierra-Leone": "África",
  Liberia: "África",
  Gambia: "África",
  "Guinea-Bissau": "África",
  Niger: "África",
  Chad: "África",
  Sudan: "África",
  "South-Sudan": "África",
  Somalia: "África",
  Eritrea: "África",
  Djibouti: "África",
  Comoros: "África",
  Madagascar: "África",
  Mauritius: "África",
  "Cape-Verde": "África",
  Eswatini: "África",
  Lesotho: "África",
  Malawi: "África",
  "Central-African-Republic": "África",

  // Oceanía (OFC)
  Australia: "Oceanía",
  "New-Zealand": "Oceanía",
  Fiji: "Oceanía",
  "Papua-New-Guinea": "Oceanía",
  "Solomon-Islands": "Oceanía",
  Vanuatu: "Oceanía",
  "New-Caledonia": "Oceanía",
  Tahiti: "Oceanía",
  Samoa: "Oceanía",
  Tonga: "Oceanía",

  // Internacional
  World: "Internacional",
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
