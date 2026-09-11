import { useCallback, useEffect, useState } from "react";
import { fetchRefereeDetail } from "../api";
import { ChevronLeftIcon } from "./icons";
import { useDocumentMeta } from "../useDocumentMeta";

export default function RefereeDetail({ refereeId, onBack }) {
  const [referee, setReferee] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(() => {
    setStatus("loading");
    setReferee(null);
    fetchRefereeDetail(refereeId)
      .then((data) => {
        setReferee(data);
        setStatus("ok");
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage(err.message);
        setStatus("error");
      });
  }, [refereeId]);

  useEffect(() => {
    load();
  }, [load]);

  useDocumentMeta({
    title: referee ? `${referee.name}: estadísticas arbitrales | PARTIDOS` : "PARTIDOS",
    description: referee
      ? `Promedio de tarjetas, goles y faltas por partido de ${referee.name} en PARTIDOS.`
      : undefined,
  });

  return (
    <div className="player-detail">
      <button className="back-btn" onClick={onBack}>
        <ChevronLeftIcon />Volver
      </button>

      {status === "loading" && <p className="empty">Cargando árbitro…</p>}
      {status === "error" && (
        <div className="error-state">
          <p className="error-state-title">No pudimos cargar este árbitro</p>
          <p className="error-state-subtitle">{errorMessage}</p>
          <button className="error-state-retry" onClick={load}>
            Reintentar
          </button>
        </div>
      )}

      {status === "ok" && referee && (
        <>
          <div className="player-header">
            <div className="referee-icon" aria-hidden="true">
              🟨
            </div>
            <div className="player-header-info">
              <h1>{referee.name}</h1>
              <div className="player-header-meta">
                {referee.country && <span>{referee.country}</span>}
                <span>{referee.matches} partidos dirigidos</span>
              </div>
            </div>
          </div>

          <div className="player-stats-grid">
            {referee.avgYellowPerMatch != null && (
              <div className="player-stat-card">
                <span className="player-stat-value">{referee.avgYellowPerMatch.toFixed(1)}</span>
                <span className="player-stat-label">Amarillas / partido</span>
              </div>
            )}
            {referee.avgRedPerMatch != null && (
              <div className="player-stat-card">
                <span className="player-stat-value">{referee.avgRedPerMatch.toFixed(2)}</span>
                <span className="player-stat-label">Rojas / partido</span>
              </div>
            )}
            {referee.avgFoulsPerMatch != null && (
              <div className="player-stat-card">
                <span className="player-stat-value">{referee.avgFoulsPerMatch.toFixed(1)}</span>
                <span className="player-stat-label">Faltas / partido</span>
              </div>
            )}
            {referee.avgGoalsPerMatch != null && (
              <div className="player-stat-card">
                <span className="player-stat-value">{referee.avgGoalsPerMatch.toFixed(1)}</span>
                <span className="player-stat-label">Goles / partido</span>
              </div>
            )}
            {referee.totalYellowCards != null && (
              <div className="player-stat-card">
                <span className="player-stat-value">{referee.totalYellowCards}</span>
                <span className="player-stat-label">Amarillas totales</span>
              </div>
            )}
            {referee.totalRedCards != null && (
              <div className="player-stat-card">
                <span className="player-stat-value">{referee.totalRedCards}</span>
                <span className="player-stat-label">Rojas totales</span>
              </div>
            )}
          </div>

          {referee.recentMatches?.length > 0 && (
            <div className="team-section">
              <h2 className="team-section-title">Últimos partidos dirigidos</h2>
              <ul className="h2h-recent-list">
                {referee.recentMatches.map((m) => (
                  <li key={m.id} className="h2h-recent-row">
                    <span className="h2h-recent-date">
                      {new Date(m.date).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </span>
                    <span className="h2h-recent-teams">
                      {m.home} <strong>{m.homeScore} - {m.awayScore}</strong> {m.away}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
