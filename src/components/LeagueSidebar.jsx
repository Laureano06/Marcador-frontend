import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { crestColor } from "../utils";
import { buildRegionTree } from "../competitions/regionTree";
import { detectUserCountry } from "../competitions/userCountry";
import { CloseIcon, ChevronDownIcon, SearchIcon, StarIcon } from "./icons";
import { DURATION, EASE_OUT } from "../motion";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

const SIDEBAR_STATE_KEY = "partidos:sidebar-state";

// SYSTEM B del pedido (ver src/competitions/rankCompetitions.js para el
// porqué de la separación): esta navegación es ESTRUCTURAL, no dinámica.
// Nunca se reordena por partidos en vivo — Región -> País/Organización ->
// Competencia, siempre en el mismo orden, para que aprender "dónde está
// Europa" sirva de una vez y para siempre.

function loadSidebarState() {
  try {
    const raw = localStorage.getItem(SIDEBAR_STATE_KEY);
    if (!raw) return { openRegionId: null, openCountryId: null };
    const parsed = JSON.parse(raw);
    return {
      openRegionId: typeof parsed.openRegionId === "string" ? parsed.openRegionId : null,
      openCountryId: typeof parsed.openCountryId === "string" ? parsed.openCountryId : null,
    };
  } catch {
    return { openRegionId: null, openCountryId: null };
  }
}

// El feed del día solo trae los partidos de HOY — un equipo favorito que
// hoy no juega no tiene nombre/escudo para mostrar acá (la API no nos da
// un "buscar equipo por id" fuera del feed). Mostrar solo lo que hoy
// aparece es la lectura honesta: nunca "N favoritos" con menos filas
// abajo, y nunca un id pelado en vez de un nombre.
function favoriteTeamsFromMatches(matches, teamIds) {
  if (teamIds.length === 0) return [];
  const found = new Map();
  for (const m of matches) {
    if (teamIds.includes(m.homeId) && !found.has(m.homeId)) {
      found.set(m.homeId, { id: m.homeId, name: m.home, ab: m.homeAb, crest: m.homeCrest });
    }
    if (teamIds.includes(m.awayId) && !found.has(m.awayId)) {
      found.set(m.awayId, { id: m.awayId, name: m.away, ab: m.awayAb, crest: m.awayCrest });
    }
  }
  return teamIds.map((id) => found.get(id)).filter(Boolean);
}

function FavoriteTeamRow({ team, onSelectTeam, onClose }) {
  return (
    <li>
      <button
        className="league-sidebar-item favorite-row"
        onClick={() => {
          onSelectTeam(team.id);
          onClose?.();
        }}
      >
        {team.crest ? (
          <span className="favorite-crest favorite-crest-img">
            <img src={team.crest} alt="" loading="lazy" />
          </span>
        ) : (
          <span className="favorite-crest" style={{ background: crestColor(team.ab) }}>
            {team.ab}
          </span>
        )}
        {team.name}
      </button>
    </li>
  );
}

function CompetitionRow({ competition, isActive, onSelect }) {
  return (
    <li>
      <button
        className={"league-sidebar-item competition-row" + (isActive ? " active" : "")}
        onClick={() => onSelect(competition.name)}
      >
        {isActive && <span className="active-dot" aria-hidden="true" />}
        {competition.name}
      </button>
    </li>
  );
}

// Un nodo "hoja de segundo nivel": un país o una organización continental
// (CONMEBOL, UEFA...) dentro de una región ya abierta. Expande a una
// lista plana de competencias — un país nunca tiene un tercer nivel.
function CountryAccordion({ node, isOpen, onToggle, activeLeague, onSelect }) {
  return (
    <div className="sidebar-country">
      <button className="country-header" onClick={onToggle} aria-expanded={isOpen}>
        <span className="country-header-label">{node.name}</span>
        <ChevronDownIcon className={"chevron" + (isOpen ? " open" : "")} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0, y: -4 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -4 }}
            transition={{ duration: DURATION.normal, ease: EASE_OUT }}
            style={{ overflow: "hidden" }}
          >
            <ul className="sidebar-competitions">
              {node.competitions.map((c) => (
                <CompetitionRow
                  key={c.id ?? c.name}
                  competition={c}
                  isActive={c.name === activeLeague}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Una región/continente (o el atajo local del país del usuario, que usa
// este mismo componente — estructuralmente es lo mismo: un encabezado que
// expande a países/organizaciones/competencias).
function RegionAccordion({ region, isOpen, onToggleRegion, openCountryId, onToggleCountry, activeLeague, onSelect }) {
  const hasChildren = region.countries.length > 0 || region.organizations.length > 0;
  return (
    <div className="sidebar-region">
      <button
        className="region-header"
        onClick={onToggleRegion}
        aria-expanded={isOpen}
      >
        <span className="region-header-label">{region.name}</span>
        <ChevronDownIcon className={"chevron" + (isOpen ? " open" : "")} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0, y: -4 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -4 }}
            transition={{ duration: DURATION.normal, ease: EASE_OUT }}
            style={{ overflow: "hidden" }}
          >
            <div className="sidebar-region-body">
              {region.directCompetitions.length > 0 && (
                <ul className="sidebar-competitions">
                  {region.directCompetitions.map((c) => (
                    <CompetitionRow
                      key={c.id ?? c.name}
                      competition={c}
                      isActive={c.name === activeLeague}
                      onSelect={onSelect}
                    />
                  ))}
                </ul>
              )}
              {hasChildren && (
                <div className="sidebar-countries">
                  {region.countries.map((country) => (
                    <CountryAccordion
                      key={country.id}
                      node={country}
                      isOpen={openCountryId === country.id}
                      onToggle={() => onToggleCountry(country.id)}
                      activeLeague={activeLeague}
                      onSelect={onSelect}
                    />
                  ))}
                  {region.organizations.map((org) => (
                    <CountryAccordion
                      key={org.id}
                      node={org}
                      isOpen={openCountryId === org.id}
                      onToggle={() => onToggleCountry(org.id)}
                      activeLeague={activeLeague}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Resultados de búsqueda: lista plana con la región/país como pista de
// contexto — sin esto, buscar "champ" y ver dos filas idénticas
// ("Championship"/"Champions League") sin más info no ayuda a distinguir
// cuál es cuál antes de tocarlas.
function flattenCompetitions(tree) {
  const all = [];
  for (const region of tree.regions) {
    for (const c of region.directCompetitions) all.push({ ...c, context: region.name });
    for (const country of region.countries) {
      for (const c of country.competitions) all.push({ ...c, context: country.name });
    }
    for (const org of region.organizations) {
      for (const c of org.competitions) all.push({ ...c, context: org.name });
    }
  }
  return all;
}

export default function LeagueSidebar({
  matches,
  matchesStatus,
  activeLeague,
  onSelect,
  open,
  onClose,
  favorites,
  onSelectTeam,
}) {
  const navRef = useRef(null);

  // En mobile el drawer tapa el resto de la página (ver .sidebar-backdrop)
  // pero sin esto Tab seguía moviendo el foco hacia contenido de atrás,
  // invisible detrás del backdrop, y no había forma de cerrar con
  // teclado más que llegar hasta el botón de cerrar a mano.
  useEffect(() => {
    if (!open) return;
    const closeBtn = navRef.current?.querySelector(".league-sidebar-close");
    closeBtn?.focus();

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose?.();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = navRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Sin esto, al cerrar (Escape, botón X, o click en el backdrop) el
      // foco se quedaba en el botón de cerrar, ahora oculto fuera de
      // pantalla por el transform del drawer — el siguiente Tab saltaba
      // a cualquier lado en vez de volver al hamburger que lo abrió.
      // Confirmado el bug probando el drawer de verdad, no solo leyendo
      // el CSS: no era visible desde el código.
      document.querySelector(".hamburger-btn")?.focus();
    };
  }, [open, onClose]);

  const userCountry = useMemo(() => detectUserCountry(), []);
  const tree = useMemo(() => buildRegionTree(matches, userCountry), [matches, userCountry]);

  // Un solo nivel superior abierto a la vez (región O el atajo local,
  // comparten el mismo estado bajo el id especial "local") — punto 15:
  // evita que el sidebar crezca sin límite. Se persiste en localStorage
  // para sobrevivir a la navegación (punto 14), sin backend.
  const [{ openRegionId, openCountryId }, setOpenState] = useState(loadSidebarState);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify({ openRegionId, openCountryId }));
    } catch {
      // localStorage bloqueado — el sidebar sigue funcionando, solo no
      // recuerda el estado entre visitas.
    }
  }, [openRegionId, openCountryId]);

  const toggleRegion = (id) => {
    setOpenState((prev) => ({
      openRegionId: prev.openRegionId === id ? null : id,
      openCountryId: prev.openRegionId === id ? prev.openCountryId : null,
    }));
  };
  const toggleCountry = (id) => {
    setOpenState((prev) => ({
      ...prev,
      openCountryId: prev.openCountryId === id ? null : id,
    }));
  };

  // Si la competencia activa cambia (hoy solo pasa al clickearla acá
  // mismo, pero queda listo para un futuro link directo a una
  // competencia), abrimos su región/país automáticamente — punto 13.
  useEffect(() => {
    if (!activeLeague) return;
    if (tree.localShortcut?.competitions.some((c) => c.name === activeLeague)) {
      setOpenState({ openRegionId: "local", openCountryId: null });
      return;
    }
    for (const region of tree.regions) {
      if (region.directCompetitions.some((c) => c.name === activeLeague)) {
        setOpenState({ openRegionId: region.id, openCountryId: null });
        return;
      }
      const country = region.countries.find((c) => c.competitions.some((comp) => comp.name === activeLeague));
      if (country) {
        setOpenState({ openRegionId: region.id, openCountryId: country.id });
        return;
      }
      const org = region.organizations.find((o) => o.competitions.some((comp) => comp.name === activeLeague));
      if (org) {
        setOpenState({ openRegionId: region.id, openCountryId: org.id });
        return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLeague]);

  const favoriteLeagues = favorites?.leagues ?? [];
  const favoriteTeams = favoriteTeamsFromMatches(matches, favorites?.teams ?? []);
  const hasFavorites = favoriteLeagues.length > 0 || favoriteTeams.length > 0;

  // Clickear la liga ya activa la desactiva (vuelve a mostrar todo).
  const handleSelect = (leagueName) => {
    onSelect(leagueName === activeLeague ? null : leagueName);
    onClose?.(); // en mobile, elegir una liga cierra el cajón
  };

  const trimmedQuery = searchQuery.trim();
  const searchResults = useMemo(() => {
    if (!trimmedQuery) return null;
    const q = trimmedQuery.toLowerCase();
    return flattenCompetitions(tree).filter((c) => c.name.toLowerCase().includes(q));
  }, [tree, trimmedQuery]);

  const isEmpty = !tree.localShortcut && tree.regions.length === 0;

  return (
    <nav ref={navRef} className={"league-sidebar" + (open ? " open" : "")}>
      <div className="league-sidebar-header">
        <span className="league-sidebar-title-mobile">Ligas</span>
        <button className="league-sidebar-close" onClick={onClose} aria-label="Cerrar">
          <CloseIcon />
        </button>
      </div>

      <div className="sidebar-search">
        <SearchIcon className="sidebar-search-icon" />
        <input
          type="text"
          className="sidebar-search-input"
          placeholder="Buscar liga…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Buscar competencia"
        />
      </div>

      <div className="sidebar-favorites">
        <span className="region-header-static">
          <StarIcon active className="favorites-star" /> Mis competiciones
        </span>
        {hasFavorites ? (
          <ul>
            {favoriteLeagues.map((name) => (
              <li key={name}>
                <button
                  className={"league-sidebar-item" + (name === activeLeague ? " active" : "")}
                  onClick={() => handleSelect(name)}
                >
                  {name}
                </button>
              </li>
            ))}
            {favoriteTeams.map((team) => (
              <FavoriteTeamRow
                key={team.id}
                team={team}
                onSelectTeam={onSelectTeam}
                onClose={onClose}
              />
            ))}
          </ul>
        ) : (
          <p className="sidebar-favorites-empty">
            Marcá equipos y ligas con la estrella para verlos acá.
          </p>
        )}
      </div>

      {isEmpty && matchesStatus === "loading" && (
        <p className="empty" style={{ padding: "0 16px" }}>
          Cargando ligas…
        </p>
      )}
      {isEmpty && matchesStatus === "error" && (
        <p className="empty" style={{ padding: "0 16px" }}>
          No pudimos cargar las ligas.
        </p>
      )}
      {isEmpty && matchesStatus === "ok" && (
        <p className="empty" style={{ padding: "0 16px" }}>
          No hay ligas para este día.
        </p>
      )}

      {searchResults ? (
        <ul className="sidebar-competitions sidebar-search-results">
          {searchResults.length === 0 ? (
            <li className="sidebar-search-empty">Sin resultados para "{trimmedQuery}"</li>
          ) : (
            searchResults.map((c) => (
              <li key={c.id ?? c.name}>
                <button
                  className={"league-sidebar-item competition-row" + (c.name === activeLeague ? " active" : "")}
                  onClick={() => handleSelect(c.name)}
                >
                  {c.name}
                  <span className="competition-row-context">{c.context}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : (
        <>
          {tree.localShortcut && (
            <RegionAccordion
              region={{
                id: "local",
                name: tree.localShortcut.name,
                directCompetitions: tree.localShortcut.competitions,
                countries: [],
                organizations: [],
              }}
              isOpen={openRegionId === "local"}
              onToggleRegion={() => toggleRegion("local")}
              openCountryId={openCountryId}
              onToggleCountry={toggleCountry}
              activeLeague={activeLeague}
              onSelect={handleSelect}
            />
          )}
          {tree.regions.map((region) => (
            <RegionAccordion
              key={region.id}
              region={region}
              isOpen={openRegionId === region.id}
              onToggleRegion={() => toggleRegion(region.id)}
              openCountryId={openCountryId}
              onToggleCountry={toggleCountry}
              activeLeague={activeLeague}
              onSelect={handleSelect}
            />
          ))}
        </>
      )}
    </nav>
  );
}
