import { useEffect, useRef, useState } from "react";
import { groupLeaguesByCategory, countryAbbr } from "../leagueCategories";
import { crestColor } from "../utils";
import { CloseIcon, ChevronDownIcon } from "./icons";
import { ManagerPromoCard } from "./ManagerPromo";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

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

  // Qué categorías están COLAPSADAS (no las que están abiertas) — así
  // todas arrancan expandidas por default sin tener que inicializar la
  // lista completa de antemano.
  const [collapsedCategories, setCollapsedCategories] = useState(() => new Set());

  const toggleCategory = (category) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const groups = groupLeaguesByCategory(matches);

  const favoriteLeagues = favorites?.leagues ?? [];
  const favoriteTeams = favoriteTeamsFromMatches(matches, favorites?.teams ?? []);
  const hasFavorites = favoriteLeagues.length > 0 || favoriteTeams.length > 0;

  // Clickear la liga ya activa la desactiva (vuelve a mostrar todo).
  const handleSelect = (leagueName) => {
    onSelect(leagueName === activeLeague ? null : leagueName);
    onClose?.(); // en mobile, elegir una liga cierra el cajón
  };

  return (
    <nav ref={navRef} className={"league-sidebar" + (open ? " open" : "")}>
      <div className="league-sidebar-header">
        <span className="league-sidebar-title-mobile">Ligas</span>
        <button className="league-sidebar-close" onClick={onClose} aria-label="Cerrar">
          <CloseIcon />
        </button>
      </div>

      <div className="sidebar-favorites">
        <span className="region-header-static">Favoritos</span>
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

      <ManagerPromoCard />

      {groups.length === 0 && matchesStatus === "loading" && (
        <p className="empty" style={{ padding: "0 16px" }}>
          Cargando ligas…
        </p>
      )}
      {groups.length === 0 && matchesStatus === "error" && (
        <p className="empty" style={{ padding: "0 16px" }}>
          No pudimos cargar las ligas.
        </p>
      )}
      {groups.length === 0 && matchesStatus === "ok" && (
        <p className="empty" style={{ padding: "0 16px" }}>
          No hay ligas para este día.
        </p>
      )}

      {groups.map(([category, leagues]) => {
        const isCollapsed = collapsedCategories.has(category);
        return (
          <div className="region-group" key={category}>
            <button
              className="region-header"
              onClick={() => toggleCategory(category)}
              aria-expanded={!isCollapsed}
            >
              <span>{category}</span>
              <ChevronDownIcon className={"chevron" + (isCollapsed ? "" : " open")} />
            </button>
            {!isCollapsed && (
              <ul>
                {leagues.map((l) => (
                  <li key={l.name}>
                    <button
                      className={
                        "league-sidebar-item" + (l.name === activeLeague ? " active" : "")
                      }
                      onClick={() => handleSelect(l.name)}
                    >
                      {/* No es una bandera real: DESIGN.md prohíbe
                          emoji/glifos como ícono, y muchas banderas son
                          casi idénticas entre sí (Chad/Rumania). Un chip
                          circular con el mismo hash de color que ya usan
                          los escudos de respaldo da una pista de país sin
                          ninguna de las dos ambigüedades. "World" (copas
                          internacionales) no tiene país real, se omite. */}
                      {l.country && l.country !== "World" && (
                        <span
                          className="country-chip"
                          style={{ background: crestColor(l.country) }}
                          aria-hidden="true"
                        >
                          {countryAbbr(l.country)}
                        </span>
                      )}
                      {l.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}
