// Resumen head-to-head + últimos enfrentamientos — todo sale de
// info.head_to_head en la MISMA respuesta de detalle del partido (ver
// dataSource.js), no hace falta pedir nada aparte.
export default function MatchH2H({ h2h, homeName, awayName }) {
  if (!h2h || h2h.totalMatches === 0) return null;

  return (
    <div className="team-section">
      <h2 className="team-section-title">Historial entre ambos</h2>
      <div className="h2h-summary">
        <div className="h2h-summary-col">
          <span className="h2h-summary-value">{h2h.homeWins}</span>
          <span className="h2h-summary-label">{homeName}</span>
        </div>
        <div className="h2h-summary-col">
          <span className="h2h-summary-value">{h2h.draws}</span>
          <span className="h2h-summary-label">Empates</span>
        </div>
        <div className="h2h-summary-col">
          <span className="h2h-summary-value">{h2h.awayWins}</span>
          <span className="h2h-summary-label">{awayName}</span>
        </div>
      </div>
      <p className="h2h-goals">
        {h2h.homeGoals} - {h2h.awayGoals} en goles, últimos {h2h.totalMatches} partidos
      </p>

      {h2h.recentMatches?.length > 0 && (
        <ul className="h2h-recent-list">
          {h2h.recentMatches.map((m) => (
            <li key={m.event_id} className="h2h-recent-row">
              <span className="h2h-recent-date">
                {new Date(m.date).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
              </span>
              <span className="h2h-recent-teams">
                {m.home} <strong>{m.home_score} - {m.away_score}</strong> {m.away}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
