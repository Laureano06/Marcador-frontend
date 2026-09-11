// Detección de país del usuario SIN GPS y SIN backend: alcanza con el
// idioma/región que el propio navegador ya reporta (ej. "es-AR" -> AR).
// No es perfecto (alguien con el navegador en "en-US" pero viviendo en
// Argentina va a ver el ranking global en vez del local), pero es la
// única señal que no requiere pedir permiso ni agregar infraestructura —
// exactamente lo que pide la Parte 1, punto 3: "country-level, no GPS".
//
// Override manual para QA/demos: ?country=BR en la URL, o
// localStorage["partidos:country-override"] — sin esto, probar el
// ranking para otro país obligaba a cambiar el idioma del sistema
// operativo entero.

const OVERRIDE_KEY = "partidos:country-override";

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
