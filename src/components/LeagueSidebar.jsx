import { useState } from "react";

export default function LeagueSidebar({ leagues, activeSlug, onSelect }) {
  // Colapsado por default (especialmente pensado para mobile, donde el
  // panel es una tira horizontal). En pantallas grandes (ver CSS) queda
  // siempre expandido sin importar este estado.
  const [collapsed, setCollapsed] = useState(true);

  return (
    <nav className={"league-sidebar" + (collapsed ? " collapsed" : "")}>
      <button
        className="league-sidebar-toggle"
        onClick={() => setCollapsed((v) => !v)}
      >
        Ligas <span className={"chevron" + (collapsed ? "" : " open")}>▾</span>
      </button>
      <ul>
        {leagues.map((l) => (
          <li key={l.slug}>
            <button
              className={
                "league-sidebar-item" + (l.slug === activeSlug ? " active" : "")
              }
              onClick={() => onSelect(l.slug)}
            >
              {l.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
