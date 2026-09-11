const RESULT_LABEL = { W: "Ganó", D: "Empató", L: "Perdió" };

// Forma reciente de un equipo: últimos 5 resultados como chips W/D/L,
// más reciente a la derecha (mismo sentido de lectura que "cómo llega"
// se suele mostrar). form ya viene ordenado más reciente primero desde
// el backend, se invierte acá para mostrarlo cronológico.
function FormStrip({ name, form }) {
  if (!form || form.length === 0) return null;
  const chronological = [...form].reverse();
  return (
    <div className="form-strip-row">
      <span className="form-strip-team">{name}</span>
      <span className="form-strip-chips">
        {chronological.map((m, i) => (
          <span
            key={i}
            className={"form-chip form-chip-" + m.result}
            title={`${RESULT_LABEL[m.result]} ${m.goalsFor}-${m.goalsAgainst} vs ${m.opponent}`}
          >
            {m.result}
          </span>
        ))}
      </span>
    </div>
  );
}

// Resumen head-to-head + últimos enfrentamientos (info.head_to_head, ya
// viaja en la respuesta del partido) + forma reciente de cada equipo
// (últimos 5 partidos antes de este, ver dataSource.js fetchRecentForm)
// — dos datos relacionados ("quién llega mejor" / "cómo les fue entre
// sí"), pero independientes: puede faltar uno sin que falte el otro.
export default function MatchH2H({ h2h, form, homeName, awayName }) {
  const hasH2H = h2h && h2h.totalMatches > 0;
  const hasForm = form && (form.home?.length || form.away?.length);
  if (!hasH2H && !hasForm) return null;

  return (
    <>
      {hasForm && (
        <div className="team-section">
          <h2 className="team-section-title">Forma reciente</h2>
          <FormStrip name={homeName} form={form.home} />
          <FormStrip name={awayName} form={form.away} />
        </div>
      )}

      {hasH2H && (
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
      )}
    </>
  );
}
