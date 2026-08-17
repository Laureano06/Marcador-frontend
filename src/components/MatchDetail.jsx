import { useEffect, useState } from "react";
import { fetchMatchDetail } from "../api";
import { crestColor } from "../utils";

function TeamHeader({ team, side }) {
  if (!team) return <div className={"match-detail-team " + side} />;
  return (
    <div className={"match-detail-team " + side}>
      {team.crest ? (
        <div className="crest crest-img">
          <img src={team.crest} alt="" />
        </div>
      ) : (
        <div className="crest crest-fallback" style={{ background: crestColor(team.name) }}>
          {team.name?.slice(0, 3).toUpperCase()}
        </div>
      )}
      <div className="match-detail-team-name">{team.name}</div>
    </div>
  );
}

function LineupSide({ side }) {
  if (!side) return null;
  return (
    <div className="lineup-side">
      <div className="lineup-team-name">
        {side.teamName}
        {side.formation ? ` (${side.formation})` : ""}
      </div>
      {side.starters.length === 0 && (
        <p className="empty" style={{ marginTop: 0 }}>
          Sin datos todavía.
        </p>
      )}
      {side.starters.map((p) => (
        <div key={p.id} className="lineup-player">
          <span className="lineup-player-number">{p.number ?? "-"}</span>
          <span className="lineup-player-name">{p.name}</span>
          {p.position && <span className="lineup-player-position">{p.position}</span>}
        </div>
      ))}
    </div>
  );
}

export default function MatchDetail({ matchId, leagueSlug, onBack }) {
  const [detail, setDetail] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | error

  useEffect(() => {
    setStatus("loading");
    setDetail(null);
    fetchMatchDetail(matchId, leagueSlug)
      .then((data) => {
        setDetail(data);
        setStatus("ok");
      })
      .catch((err) => {
        console.error(err);
        setStatus("error");
      });
  }, [matchId, leagueSlug]);

  return (
    <div className="match-detail">
      <button className="back-btn" onClick={onBack}>
        ‹ Volver
      </button>

      {status === "loading" && <p className="empty">Cargando partido…</p>}
      {status === "error" && (
        <p className="error-banner">No se pudo cargar este partido.</p>
      )}

      {status === "ok" && detail && (
        <>
          <div className="match-detail-header">
            <TeamHeader team={detail.home} side="home" />
            <div className="match-detail-score">
              {detail.status === "scheduled" ? (
                "VS"
              ) : (
                <>
                  {detail.home?.score} - {detail.away?.score}
                </>
              )}
              {detail.status === "live" && (
                <div className="status-badge live" style={{ marginTop: 6 }}>
                  <span className="blip" /> EN VIVO
                </div>
              )}
              {detail.status === "final" && (
                <div className="status-badge final" style={{ marginTop: 6 }}>
                  FINAL
                </div>
              )}
            </div>
            <TeamHeader team={detail.away} side="away" />
          </div>

          {detail.statistics && (
            <div className="team-section">
              <div className="team-section-title">Estadísticas</div>
              <div className="match-stats-list">
                {detail.statistics.map((row, i) => (
                  <div key={i} className="match-stat-row">
                    <span className="match-stat-value">{row.home ?? "-"}</span>
                    <span className="match-stat-label">{row.label}</span>
                    <span className="match-stat-value">{row.away ?? "-"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detail.lineups && (
            <div className="team-section">
              <div className="team-section-title">
                {detail.lineupsAreProbable
                  ? "Alineación probable"
                  : "Alineación"}
              </div>
              <div className="lineup-columns">
                <LineupSide side={detail.lineups.home} />
                <LineupSide side={detail.lineups.away} />
              </div>
            </div>
          )}

          {!detail.statistics && detail.status === "scheduled" && (
            <p className="empty">
              Las estadísticas van a estar disponibles cuando arranque el
              partido.
            </p>
          )}

          {!detail.lineups && (
            <p className="empty">
              {detail.status === "scheduled"
                ? "Todavía no hay una alineación probable disponible."
                : "No hay datos de alineación para este partido."}
            </p>
          )}
        </>
      )}
    </div>
  );
}
