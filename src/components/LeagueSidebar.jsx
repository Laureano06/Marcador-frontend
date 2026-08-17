export default function LeagueSidebar({ leagues, activeSlug, onSelect }) {
  return (
    <nav className="league-sidebar">
      <div className="league-sidebar-title">Ligas</div>
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
