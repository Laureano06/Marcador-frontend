import { useCallback, useEffect, useState } from "react";
import { fetchPlayerDetail } from "../api";
import PlayerFace from "./PlayerFace";
import { ChevronLeftIcon } from "./icons";
import { useDocumentMeta } from "../useDocumentMeta";

const AVAILABILITY_LABEL = {
  injured: "Lesionado",
  suspended: "Suspendido",
  doubtful: "Duda",
};

function formatMarketValue(eur) {
  if (eur == null) return null;
  if (eur >= 1_000_000) return `€${(eur / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (eur >= 1_000) return `€${Math.round(eur / 1000)}K`;
  return `€${eur}`;
}

const STAT_FIELDS = [
  ["appearances", "Partidos"],
  ["minutes", "Minutos"],
  ["goals", "Goles"],
  ["assists", "Asistencias"],
  ["shots", "Remates"],
  ["shotsOnTarget", "Al arco"],
  ["yellowCards", "Amarillas"],
  ["redCards", "Rojas"],
];

export default function PlayerDetail({ playerId, onBack, onSelectTeam }) {
  const [player, setPlayer] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(() => {
    setStatus("loading");
    setPlayer(null);
    fetchPlayerDetail(playerId)
      .then((data) => {
        setPlayer(data);
        setStatus("ok");
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage(err.message);
        setStatus("error");
      });
  }, [playerId]);

  useEffect(() => {
    load();
  }, [load]);

  useDocumentMeta({
    title: player ? `${player.name}: estadísticas y partidos | PARTIDOS` : "PARTIDOS",
    description: player
      ? `Perfil, estadísticas y datos de ${player.name}${player.teamName ? ` (${player.teamName})` : ""} en PARTIDOS.`
      : undefined,
  });

  const marketValue = player ? formatMarketValue(player.marketValueEur) : null;
  const availabilityLabel = player?.availability && player.availability !== "available"
    ? AVAILABILITY_LABEL[player.availability] || player.availability
    : null;

  return (
    <div className="player-detail">
      <button className="back-btn" onClick={onBack}>
        <ChevronLeftIcon />Volver
      </button>

      {status === "loading" && <p className="empty">Cargando jugador…</p>}
      {status === "error" && (
        <div className="error-state">
          <p className="error-state-title">No pudimos cargar este jugador</p>
          <p className="error-state-subtitle">{errorMessage}</p>
          <button className="error-state-retry" onClick={load}>
            Reintentar
          </button>
        </div>
      )}

      {status === "ok" && player?.stale && (
        <div className="stale-banner">
          Mostrando datos guardados — se alcanzó el límite diario de la API.
        </div>
      )}

      {status === "ok" && player && (
        <>
          <div className="player-header">
            <PlayerFace photo={player.photo} name={player.name} size="xl" />
            <div className="player-header-info">
              <h1>{player.name}</h1>
              <div className="player-header-meta">
                {player.teamName && (
                  <button className="player-header-team" onClick={() => onSelectTeam(player.teamId)}>
                    {player.teamName}
                  </button>
                )}
                {player.position && <span>{player.position}</span>}
                {player.nationality && <span>{player.nationality}</span>}
              </div>
              {availabilityLabel && (
                <span className={"player-availability player-availability-" + player.availability}>
                  {availabilityLabel}
                  {player.injuryType ? ` — ${player.injuryType}` : ""}
                </span>
              )}
            </div>
          </div>

          <div className="player-facts-grid">
            {player.number != null && <div className="player-fact"><span>Dorsal</span><strong>{player.number}</strong></div>}
            {player.age != null && <div className="player-fact"><span>Edad</span><strong>{player.age} años</strong></div>}
            {player.heightCm != null && <div className="player-fact"><span>Altura</span><strong>{player.heightCm} cm</strong></div>}
            {player.preferredFoot && <div className="player-fact"><span>Pierna hábil</span><strong>{player.preferredFoot}</strong></div>}
            {marketValue && <div className="player-fact"><span>Valor de mercado</span><strong>{marketValue}</strong></div>}
            {player.contractUntil && (
              <div className="player-fact">
                <span>Contrato hasta</span>
                <strong>{new Date(player.contractUntil).getFullYear()}</strong>
              </div>
            )}
          </div>

          {player.stats && (
            <div className="team-section">
              <h2 className="team-section-title">
                Últimos partidos registrados
                <span className="player-stats-sample"> ({player.stats.sampleSize})</span>
              </h2>
              <div className="player-stats-grid">
                {STAT_FIELDS.map(([key, label]) =>
                  player.stats[key] != null ? (
                    <div key={key} className="player-stat-card">
                      <span className="player-stat-value">{player.stats[key]}</span>
                      <span className="player-stat-label">{label}</span>
                    </div>
                  ) : null
                )}
                {player.stats.averageRating != null && (
                  <div className="player-stat-card">
                    <span className="player-stat-value">{player.stats.averageRating.toFixed(2)}</span>
                    <span className="player-stat-label">Rating prom.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
