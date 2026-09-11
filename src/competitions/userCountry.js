// Detección de país del usuario SIN GPS y SIN backend — punto 3 de la
// Parte 1: alcanza con una señal a nivel país.
//
// La señal principal es el TIMEZONE del dispositivo (Intl.DateTimeFormat
// ...resolvedOptions().timeZone), no el idioma del navegador. Motivo real:
// se probó con un navegador cuyo idioma principal era "en-US" (algo común
// — mucha gente en Argentina usa el sistema/navegador en inglés) y el
// país detectado terminaba siendo Estados Unidos, aunque el timezone del
// mismo dispositivo decía correctamente "America/Buenos_Aires". El
// idioma es una preferencia de interfaz; el timezone refleja de dónde es
// realmente el dispositivo (normalmente se configura solo, y aunque se
// configure a mano casi nadie elige uno de otro país). Se deja el idioma
// como respaldo, solo para el puñado de países que no están en el mapa
// de timezones de abajo.
//
// Override manual para QA/demos: ?country=BR en la URL, o
// localStorage["partidos:country-override"] — sin esto, probar el
// ranking para otro país obligaba a cambiar el reloj del sistema entero.

const OVERRIDE_KEY = "partidos:country-override";

// Mismo universo de países que COUNTRY_META (config.js). Argentina y
// Brasil son casos especiales: IANA tiene ~10-25 zonas propias por país
// (America/Argentina/Cordoba, America/Sao_Paulo, America/Manaus...) en
// vez de una sola — se resuelven por PREFIJO en vez de listar cada
// ciudad. El resto del mundo entra con una sola zona por país porque
// políticamente ya comparte una hora oficial (o la ciudad más poblada
// alcanza como proxy razonable).
const TIMEZONE_PREFIX_TO_ISO = [
  ["America/Argentina/", "AR"],
  // Alias legado (pre-1993) del mismo timezone — IANA lo sigue
  // reconociendo y algunos navegadores/SO todavía lo resuelven así en
  // vez de la forma canónica "America/Argentina/Buenos_Aires". Sin
  // esto, exactamente el dispositivo con el que se probó este archivo
  // caía al idioma del navegador como respaldo y terminaba detectando
  // "US" en vez de "AR".
  ["America/Buenos_Aires", "AR"],
  ["America/Cordoba", "AR"],
  ["America/Mendoza", "AR"],
  ["America/Sao_Paulo", "BR"],
  ["America/Bahia", "BR"],
  ["America/Fortaleza", "BR"],
  ["America/Recife", "BR"],
  ["America/Belem", "BR"],
  ["America/Manaus", "BR"],
  ["America/Cuiaba", "BR"],
  ["America/Campo_Grande", "BR"],
  ["America/Porto_Velho", "BR"],
  ["America/Boa_Vista", "BR"],
  ["America/Maceio", "BR"],
  ["America/Araguaina", "BR"],
  ["America/Rio_Branco", "BR"],
  ["America/Noronha", "BR"],
  ["America/Montevideo", "UY"],
  ["America/Santiago", "CL"],
  ["America/Punta_Arenas", "CL"],
  ["America/Bogota", "CO"],
  ["America/Guayaquil", "EC"],
  ["America/Asuncion", "PY"],
  ["America/Lima", "PE"],
  ["America/La_Paz", "BO"],
  ["America/Caracas", "VE"],
  ["America/Mexico_City", "MX"],
  ["America/Tijuana", "MX"],
  ["America/Cancun", "MX"],
  ["America/Monterrey", "MX"],
  ["America/Merida", "MX"],
  ["America/Chihuahua", "MX"],
  ["America/Hermosillo", "MX"],
  ["America/Mazatlan", "MX"],
  ["America/New_York", "US"],
  ["America/Chicago", "US"],
  ["America/Denver", "US"],
  ["America/Los_Angeles", "US"],
  ["America/Anchorage", "US"],
  ["America/Phoenix", "US"],
  ["America/Detroit", "US"],
  ["Pacific/Honolulu", "US"],
  ["America/Toronto", "CA"],
  ["America/Vancouver", "CA"],
  ["America/Edmonton", "CA"],
  ["America/Winnipeg", "CA"],
  ["America/Halifax", "CA"],
  ["America/St_Johns", "CA"],
  ["Europe/Madrid", "ES"],
  ["Atlantic/Canary", "ES"],
  ["Europe/London", "GB"],
  ["Europe/Rome", "IT"],
  ["Europe/Berlin", "DE"],
  ["Europe/Paris", "FR"],
  ["Europe/Lisbon", "PT"],
  ["Europe/Amsterdam", "NL"],
  ["Europe/Brussels", "BE"],
  ["Europe/Zurich", "CH"],
  ["Europe/Vienna", "AT"],
  ["Europe/Warsaw", "PL"],
  ["Europe/Copenhagen", "DK"],
  ["Europe/Stockholm", "SE"],
  ["Europe/Oslo", "NO"],
  ["Europe/Helsinki", "FI"],
  ["Europe/Athens", "GR"],
  ["Europe/Istanbul", "TR"],
  ["Europe/Bucharest", "RO"],
  ["Europe/Sofia", "BG"],
  ["Asia/Shanghai", "CN"],
  ["Asia/Tokyo", "JP"],
  ["Asia/Seoul", "KR"],
  ["Asia/Riyadh", "SA"],
  ["Africa/Casablanca", "MA"],
  ["Africa/Lagos", "NG"],
  ["Africa/Tunis", "TN"],
  ["Australia/Sydney", "AU"],
  ["Australia/Melbourne", "AU"],
  ["Australia/Brisbane", "AU"],
  ["Australia/Perth", "AU"],
  ["Australia/Adelaide", "AU"],
];

function fromTimezone() {
  let timeZone;
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return null;
  }
  if (!timeZone) return null;
  const match = TIMEZONE_PREFIX_TO_ISO.find(([prefix]) => timeZone.startsWith(prefix));
  return match ? match[1] : null;
}

function fromLocale(locale) {
  if (!locale) return null;
  // "es-AR" -> "AR", "pt-BR" -> "BR". Intl.Locale es más robusto que un
  // split manual (normaliza casos como "es-419" que no traen región).
  try {
    const region = new Intl.Locale(locale).maximize().region;
    return region || null;
  } catch {
    const parts = locale.split("-");
    return parts.length > 1 ? parts[1].toUpperCase() : null;
  }
}

export function detectUserCountry() {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("country");
    if (fromQuery) return fromQuery.toUpperCase();
  } catch {
    // window/URLSearchParams no disponible (SSR/tests) — seguimos.
  }

  try {
    const override = localStorage.getItem(OVERRIDE_KEY);
    if (override) return override.toUpperCase();
  } catch {
    // localStorage bloqueado (modo privado estricto) — no es crítico acá.
  }

  const fromTz = fromTimezone();
  if (fromTz) return fromTz;

  // Respaldo solo para países fuera del mapa de timezones de arriba —
  // en la práctica, casi nunca se llega hasta acá.
  const languages =
    (typeof navigator !== "undefined" && (navigator.languages || [navigator.language])) || [];
  for (const lang of languages) {
    const country = fromLocale(lang);
    if (country) return country;
  }

  // Sin ninguna señal: ranking global (ver rankCompetitions.js), tal como
  // pide el punto 3 — nunca asumir Argentina por default para todo el
  // mundo, aunque hoy sea el público principal del sitio.
  return null;
}
