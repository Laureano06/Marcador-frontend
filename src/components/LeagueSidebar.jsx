import { useState } from "react";
import { groupLeaguesByCategory } from "../leagueCategories";

export default function LeagueSidebar({ matches, activeLeague, onSelect, open, onClose }) {
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

  // Clickear la liga ya activa la desactiva (vuelve a mostrar todo).
  const handleSelect = (leagueName) => {
    onSelect(leagueName === activeLeague ? null : leagueName);
    onClose?.(); // en mobile, elegir una liga cierra el cajón
  };

  return (
    <nav className={"league-sidebar" + (open ? " open" : "")}>
      <div className="league-sidebar-header">
        <span className="league-sidebar-title-mobile">Ligas</span>
        <button className="league-sidebar-close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
      </div>

      {groups.length === 0 && (
        <p className="empty" style={{ padding: "0 16px" }}>
          Cargando ligas…
        </p>
      )}

      {groups.map(([category, leagues]) => {
        const isCollapsed = collapsedCategories.has(category);
        return (
          <div className="region-group" key={category}>
            <button className="region-header" onClick={() => toggleCategory(category)}>
              <span>{category}</span>
              <span className={"chevron" + (isCollapsed ? "" : " open")}>▾</span>
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
