// SYSTEM B del pedido: "¿dónde encuentro una competencia?" — árbol
// ESTRUCTURAL para el sidebar (Región -> País/Organización ->
// Competencia). A propósito NO usa rankCompetitions.js/priorityScore:
// ver el comentario grande al final de rankCompetitions.js para el
// porqué de la separación.
//
// Fuente de datos: los partidos del día ya cargados (mismo dato que usa
// el feed, sin pedir nada nuevo — BSD no tiene un endpoint "todas las
// competencias que existen alguna vez", solo "partidos de tal día"). Una
// región/país sin ningún partido HOY simplemente no aparece — misma
// limitación que ya tenía el sidebar viejo (groupLeaguesByCategory).
import { COUNTRY_META, REGION_META } from "./config";
import { categoryForLeague } from "../leagueCategories";

const REGION_ORDER = REGION_META.filter((r) => !r.isLocalShortcut);

function byName(a, b) {
  return a.name.localeCompare(b.name);
}

// Dedup por id de BSD (estable) — antes se deduplicaba por NOMBRE, lo que
// podía fusionar dos competencias distintas que compartan nombre. Un
// partido sin leagueId (no debería pasar, pero por las dudas) cae al
// nombre como respaldo.
function dedupCompetitions(matches) {
  const seen = new Map();
  for (const m of matches) {
    const key = m.leagueId ?? `name:${m.league}`;
    if (seen.has(key)) continue;
    seen.set(key, { id: m.leagueId, name: m.league, country: m.leagueCountry });
  }
  return [...seen.values()];
}

/**
 * buildRegionTree(matches, userCountryIso2) -> {
 *   localShortcut: { id, name, competitions } | null,
 *   regions: [{ id, name, countries: [{id,name,competitions}],
 *               organizations: [{id,name,competitions}],
 *               directCompetitions: [...] }]
 * }
 */
export function buildRegionTree(matches, userCountryIso2) {
  const competitions = dedupCompetitions(matches);

  const buckets = new Map(REGION_ORDER.map((r) => [r.id, { countries: new Map(), org: [], direct: [] }]));
  const unclassified = [];

  for (const comp of competitions) {
    // Femenino/Juveniles no tienen su propio lugar en el árbol
    // estructural — el sidebar organiza por región/país, no por
    // categoría de edad/género (eso es un filtro distinto, fuera de
    // alcance de esta feature).
    if (["Femenino", "Juveniles"].includes(categoryForLeague(comp.name, comp.country))) continue;

    const meta = COUNTRY_META[comp.country];
    if (!meta) {
      unclassified.push(comp);
      continue;
    }
    const bucket = buckets.get(meta.region);
    if (!bucket) continue;

    if (!meta.iso2) {
      // El "país" que manda BSD es en realidad un continente/alcance
      // internacional (ej. country: "South America" para Copa
      // Libertadores) — esta competencia es de la ORGANIZACIÓN
      // continental, no de un país puntual.
      if (meta.region === "international") bucket.direct.push(comp);
      else bucket.org.push(comp);
      continue;
    }

    if (!bucket.countries.has(meta.iso2)) {
      bucket.countries.set(meta.iso2, { id: meta.iso2, name: comp.country, competitions: [] });
    }
    bucket.countries.get(meta.iso2).competitions.push(comp);
  }

  const regions = REGION_ORDER.map((meta) => {
    const bucket = buckets.get(meta.id);
    const countries = [...bucket.countries.values()]
      .map((c) => ({ ...c, competitions: c.competitions.sort(byName) }))
      .sort(byName);
    const organizations = bucket.org.length
      ? [{ id: `org:${meta.org}`, name: meta.org, competitions: bucket.org.sort(byName) }]
      : [];
    return {
      id: meta.id,
      name: meta.name,
      countries,
      organizations,
      directCompetitions: bucket.direct.sort(byName),
    };
  }).filter((r) => r.countries.length || r.organizations.length || r.directCompetitions.length);

  if (unclassified.length) {
    regions.push({
      id: "other",
      name: "Otros",
      countries: [],
      organizations: [],
      directCompetitions: unclassified.sort(byName),
    });
  }

  // Atajo local: el país del usuario, si tiene contenido hoy, se expone
  // aparte del árbol (además de seguir viviendo adentro de su región
  // real — "Argentina" no se duplica como dato, solo como acceso). Sin
  // esto, un usuario de Argentina tendría que abrir Sudamérica -> buscar
  // Argentina en una lista de 10 países cada vez.
  let localShortcut = null;
  if (userCountryIso2) {
    for (const region of regions) {
      const country = region.countries.find((c) => c.id === userCountryIso2);
      if (country) {
        localShortcut = { id: `local:${country.id}`, name: country.name, competitions: country.competitions };
        break;
      }
    }
  }

  return { localShortcut, regions };
}
