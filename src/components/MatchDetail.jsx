import { useCallback, useEffect, useState } from "react";
import { fetchMatchDetail } from "../api";
import { crestColor, liveMinuteLabel } from "../utils";
import LineupPitch from "./LineupPitch";
import { ChevronLeftIcon } from "./icons";
import { useDocumentMeta } from "../useDocumentMeta";

function matchTitle(detail) {
  if (!detail) return "PARTIDOS";
  const { home, away, status } = detail;
  const names = `${home?.name ?? "?"} vs ${away?.name ?? "?"}`;
  if (status === "scheduled") return `${names} | PARTIDOS`;
  const score = `${home?.score ?? "-"}-${away?.score ?? "-"}`;
  const label = status === "live" ? "En vivo" : "Final";
  return `${home?.name} ${score} ${away?.name} — ${label} | PARTIDOS`;
}

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
      <h2 className="team-section-title">Pronóstico</h2>
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

const LIVE_POLL_MS = 30000; // alineado con el TTL de detalle en vivo del backend (server.js)

export default function MatchDetail({ matchId, onBack }) {
  const [detail, setDetail] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [errorMessage, setErrorMessage] = useState("");

  // isRefresh=true es un refresh de fondo (polling de un partido en vivo):
  // no vuelve a "loading" ni borra el detalle ya mostrado, así no hay
  // parpadeo cada 30s. Un error en un refresh de fondo tampoco tira la
  // pantalla a error state — se mantiene el último dato bueno y se
  // reintenta en el próximo tick, igual que ya hace el feed del día.
  const load = useCallback(
    ({ isRefresh = false } = {}) => {
      if (!isRefresh) {
        setStatus("loading");
        setDetail(null);
      }
      return fetchMatchDetail(matchId)
        .then((data) => {
          setDetail(data);
          setStatus("ok");
        })
        .catch((err) => {
          if (isRefresh) {
            console.error("[match-detail] refresh en vivo falló:", err.message);
            return;
          }
          console.error(err);
          setErrorMessage(err.message);
          setStatus("error");
        });
    },
    [matchId]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Antes esta pantalla no se actualizaba sola nunca — para ver el
  // minuto o un gol nuevo había que volver atrás y entrar de nuevo. Con
  // la cuota de BSD (7.500/día) actualizar cada 30s es asequible incluso
  // si varias personas miran el mismo partido a la vez (comparten la
  // misma entrada de cache del backend). Se corta solo en cuanto el
  // partido pasa a FINAL — ahí ya no hay nada más que vaya a cambiar.
  useEffect(() => {
    if (status !== "ok" || detail?.status !== "live") return;
    const id = setInterval(() => load({ isRefresh: true }), LIVE_POLL_MS);
    return () => clearInterval(id);
  }, [status, detail?.status, load]);

  useDocumentMeta({
    title: matchTitle(detail),
    description: detail
      ? `${detail.home?.name} vs ${detail.away?.name}: resultado, estadísticas y alineación en PARTIDOS.`
      : undefined,
  });

  return (
    <div className="match-detail">
      <button className="back-btn" onClick={onBack}>
        <ChevronLeftIcon />Volver
      </button>

      {status === "loading" && <p className="empty">Cargando partido…</p>}
      {status === "error" && (
        <div className="error-state">
          <p className="error-state-title">No pudimos cargar este partido</p>
          <p className="error-state-subtitle">{errorMessage}</p>
          <button className="error-state-retry" onClick={load}>
            Reintentar
          </button>
        </div>
      )}

      {status === "ok" && detail?.stale && (
        <div className="stale-banner">
          Mostrando datos guardados — se alcanzó el límite diario de la API.
        </div>
      )}

      {status === "ok" && detail && (
        <>
          {/* Visualmente los dos nombres de equipo alrededor del score ya
              comunican esto — el h1 es solo para navegación por
              encabezados de lectores de pantalla, esta pantalla no tenía
              ninguno. */}
          <h1 className="sr-only">
            {detail.home?.name} vs {detail.away?.name}
          </h1>
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
                  <span className="blip" />{" "}
                  {liveMinuteLabel(detail.elapsed, detail.statusShort) || "EN VIVO"}
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
              <h2 className="team-section-title">Estadísticas</h2>
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
              <h2 className="team-section-title">
                {detail.lineupsAreProbable
                  ? "Alineación probable"
                  : "Alineación"}
              </h2>
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
