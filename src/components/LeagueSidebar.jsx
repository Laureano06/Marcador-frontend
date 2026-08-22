import { useState } from "react";

function groupByRegion(leagues) {
  const groups = {};
  for (const l of leagues) {
    const key = l.region || "Otras";
    if (!groups[key]) groups[key] = [];
    groups[key].push(l);
  }
  return groups;
}

export default function LeagueSidebar({ leagues, activeSlug, onSelect, open, onClose }) {
  // Qué regiones están COLAPSADAS (no las que están abiertas) — así todas
  // arrancan expandidas por default sin tener que inicializar la lista.
  const [collapsedRegions, setCollapsedRegions] = useState(() => new Set());

  const toggleRegion = (region) => {
    setCollapsedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(region)) next.delete(region);
      else next.add(region);
      return next;
    });
  };

  const groups = groupByRegion(leagues);

  const handleSelect = (slug) => {
    onSelect(slug);
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

      {Object.entries(groups).map(([region, regionLeagues]) => {
        const isCollapsed = collapsedRegions.has(region);
        return (
          <div className="region-group" key={region}>
            <button
              className="region-header"
              onClick={() => toggleRegion(region)}
            >
              <span>{region}</span>
              <span className={"chevron" + (isCollapsed ? "" : " open")}>▾</span>
            </button>
            {!isCollapsed && (
              <ul>
                {regionLeagues.map((l) => (
                  <li key={l.slug}>
                    <button
                      className={
                        "league-sidebar-item" + (l.slug === activeSlug ? " active" : "")
                      }
                      onClick={() => handleSelect(l.slug)}
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
