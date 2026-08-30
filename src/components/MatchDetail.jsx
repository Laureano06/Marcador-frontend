import { useEffect, useState } from "react";
import { fetchMatchDetail } from "../api";
import { crestColor } from "../utils";
import LineupPitch from "./LineupPitch";

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

function Predictions({ predictions, home, away }) {
  return (
    <div className="team-section">
      <div className="team-section-title">Pronóstico</div>
      <div className="prob">
        <div className="prob-bar">
          <div className="home" style={{ width: `${predictions.home}%` }} />
          <div className="draw" style={{ width: `${predictions.draw}%` }} />
          <div className="away" style={{ width: `${predictions.away}%` }} />
        </div>
        <div className="prob-labels">
          <span>
            {home?.name ?? "Local"} {predictions.home.toFixed(0)}%
          </span>
          <span>Empate {predictions.draw.toFixed(0)}%</span>
          <span>
            {away?.name ?? "Visitante"} {predictions.away.toFixed(0)}%
          </span>
        </div>
      </div>
      {predictions.advice && <p className="prediction-advice">{predictions.advice}</p>}
    </div>
  );
}

export default function MatchDetail({ matchId, onBack }) {
  const [detail, setDetail] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | error

  useEffect(() => {
    setStatus("loading");
    setDetail(null);
    fetchMatchDetail(matchId)
      .then((data) => {
        setDetail(data);
        setStatus("ok");
      })
      .catch((err) => {
        console.error(err);
        setStatus("error");
      });
  }, [matchId]);

  return (
    <div className="match-detail">
      <button className="back-btn" onClick={onBack}>
        ‹ Volver
      </button>

      {status === "loading" && <p className="empty">Cargando partido…</p>}
      {status === "error" && (
        <p className="error-banner">No se pudo cargar este partido.</p>
      )}

      {status === "ok" && detail?.stale && (
        <div className="stale-banner">
          Mostrando datos guardados — se alcanzó el límite diario de la API.
        </div>
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

          {detail.predictions && (
            <Predictions predictions={detail.predictions} home={detail.home} away={detail.away} />
          )}

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
              <LineupPitch home={detail.lineups.home} away={detail.lineups.away} />
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
