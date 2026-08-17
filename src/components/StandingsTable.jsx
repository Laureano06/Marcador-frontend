export default function StandingsTable({ standings, onSelectTeam, highlightTeamId }) {
  if (!standings || standings.length === 0) {
    return (
      <p className="empty">
        Esta competencia no tiene tabla de posiciones (por ejemplo, una copa
        eliminatoria).
      </p>
    );
  }

  return (
    <div className="standings-wrap">
      <table className="standings-table">
        <thead>
          <tr>
            <th className="col-rank">#</th>
            <th className="col-team">Equipo</th>
            <th>PJ</th>
            <th>G</th>
            <th>E</th>
            <th>P</th>
            <th>GF</th>
            <th>GC</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => (
            <tr
              key={row.teamId}
              onClick={() => onSelectTeam(row.teamId)}
              className={
                highlightTeamId != null && String(row.teamId) === String(highlightTeamId)
                  ? "standings-row-highlight"
                  : undefined
              }
            >
              <td className="col-rank">{row.rank ?? "-"}</td>
              <td className="col-team">
                <div className="standings-team">
                  {row.crest && <img src={row.crest} alt="" loading="lazy" />}
                  <span>{row.teamName}</span>
                </div>
              </td>
              <td>{row.played ?? "-"}</td>
              <td>{row.wins ?? "-"}</td>
              <td>{row.draws ?? "-"}</td>
              <td>{row.losses ?? "-"}</td>
              <td>{row.goalsFor ?? "-"}</td>
              <td>{row.goalsAgainst ?? "-"}</td>
              <td className="col-points">{row.points ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
