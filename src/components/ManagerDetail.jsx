import { useCallback, useEffect, useState } from "react";
import { fetchManagerDetail } from "../api";
import TeamLink from "./TeamLink";
import { ChevronLeftIcon } from "./icons";
import { useDocumentMeta } from "../useDocumentMeta";

const TACTICAL_LABEL = { attacking: "Ofensivo", defensive: "Defensivo", balanced: "Equilibrado" };

function formatDate(d) {
  if (!d) return "actualidad";
  return new Date(d).toLocaleDateString("es-AR", { month: "short", year: "numeric" });
}

export default function ManagerDetail({ managerId, onBack }) {
  const [manager, setManager] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(() => {
    setStatus("loading");
    setManager(null);
    fetchManagerDetail(managerId)
      .then((data) => {
        setManager(data);
        setStatus("ok");
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage(err.message);
        setStatus("error");
      });
  }, [managerId]);

  useEffect(() => {
    load();
  }, [load]);

  useDocumentMeta({
    title: manager ? `${manager.name}: estadísticas y trayectoria | PARTIDOS` : "PARTIDOS",
    description: manager
      ? `Rendimiento, formación preferida y trayectoria de ${manager.name} en PARTIDOS.`
      : undefined,
  });

  return (
    <div className="player-detail">
      <button className="back-btn" onClick={onBack}>
        <ChevronLeftIcon />Volver
      </button>

      {status === "loading" && <p className="empty">Cargando entrenador…</p>}
      {status === "error" && (
        <div className="error-state">
          <p className="error-state-title">No pudimos cargar este entrenador</p>
          <p className="error-state-subtitle">{errorMessage}</p>
          <button className="error-state-retry" onClick={load}>
            Reintentar
          </button>
        </div>
      )}

      {status === "ok" && manager && (
        <>
          <div className="player-header">
            <div className="referee-icon" aria-hidden="true">
              📋
            </div>
            <div className="player-header-info">
              <h1>{manager.name}</h1>
              <div className="player-header-meta">
                {manager.country && <span>{manager.country}</span>}
                {manager.currentTeamId && (
                  <TeamLink teamId={manager.currentTeamId} className="player-header-team">
                    Ver equipo actual
                  </TeamLink>
                )}
              </div>
            </div>
          </div>

          <div className="player-facts-grid">
            {manager.preferredFormation && (
              <div className="player-fact">
                <span>Formación preferida</span>
                <strong>{manager.preferredFormation}</strong>
              </div>
            )}
            {manager.tacticalProfile && (
              <div className="player-fact">
                <span>Perfil táctico</span>
                <strong>{TACTICAL_LABEL[manager.tacticalProfile] || manager.tacticalProfile}</strong>
              </div>
            )}
            {manager.avgPossession != null && (
              <div className="player-fact">
                <span>Posesión promedio</span>
                <strong>{manager.avgPossession.toFixed(0)}%</strong>
              </div>
            )}
          </div>

          <div className="player-stats-grid">
            <div className="player-stat-card">
              <span className="player-stat-value">{manager.matchesTotal}</span>
              <span className="player-stat-label">Partidos</span>
            </div>
            {manager.winPct != null && (
              <div className="player-stat-card">
                <span className="player-stat-value">{manager.winPct.toFixed(0)}%</span>
                <span className="player-stat-label">Victorias</span>
              </div>
            )}
            <div className="player-stat-card">
              <span className="player-stat-value">{manager.wins}-{manager.draws}-{manager.losses}</span>
              <span className="player-stat-label">G-E-P</span>
            </div>
            {manager.avgGoalsScored != null && (
              <div className="player-stat-card">
                <span className="player-stat-value">{manager.avgGoalsScored.toFixed(2)}</span>
                <span className="player-stat-label">Goles a favor</span>
              </div>
            )}
            {manager.avgGoalsConceded != null && (
              <div className="player-stat-card">
                <span className="player-stat-value">{manager.avgGoalsConceded.toFixed(2)}</span>
                <span className="player-stat-label">Goles en contra</span>
              </div>
            )}
            {manager.cleanSheetPct != null && (
              <div className="player-stat-card">
                <span className="player-stat-value">{manager.cleanSheetPct.toFixed(0)}%</span>
                <span className="player-stat-label">Valla invicta</span>
              </div>
            )}
            {manager.bttsPct != null && (
              <div className="player-stat-card">
                <span className="player-stat-value">{manager.bttsPct.toFixed(0)}%</span>
                <span className="player-stat-label">Ambos anotan</span>
              </div>
            )}
            {manager.over25Pct != null && (
              <div className="player-stat-card">
                <span className="player-stat-value">{manager.over25Pct.toFixed(0)}%</span>
                <span className="player-stat-label">Más de 2.5 goles</span>
              </div>
            )}
          </div>

          {manager.career?.length > 0 && (
            <div className="team-section">
              <h2 className="team-section-title">Trayectoria</h2>
              <ul className="h2h-recent-list">
                {manager.career.map((t, i) => (
                  <li key={i} className="h2h-recent-row">
                    <span className="h2h-recent-date">
                      {formatDate(t.dateFrom)} — {formatDate(t.dateTo)}
                    </span>
                    <span className="h2h-recent-teams">
                      <TeamLink teamId={t.teamId}>{t.teamName}</TeamLink>
                      {t.matches > 0 && ` · ${t.matches} PJ, ${t.winPct?.toFixed(0) ?? "-"}% victorias`}
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
