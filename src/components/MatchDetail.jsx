import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { fetchMatchDetail } from "../api";
import { crestColor, liveMinuteLabel } from "../utils";
import LineupPitch from "./LineupPitch";
import MatchEvents from "./MatchEvents";
import MatchH2H from "./MatchH2H";
import MatchShotmap from "./MatchShotmap";
import MatchPlayerStats from "./MatchPlayerStats";
import { ChevronLeftIcon } from "./icons";
import { useDocumentMeta } from "../useDocumentMeta";
import { useStructuredData } from "../useStructuredData";
import { AnimatedScore, EASE_OUT } from "../motion";

// schema.org no tiene un EventStatusType limpio para "en vivo" ni
// "finalizado" (solo Scheduled/Cancelled/Postponed/Rescheduled/
// MovedOnline) — mejor omitir el campo en esos dos casos que mandar un
// valor que no es ninguno de los que Google espera.
const EVENT_STATUS = {
  scheduled: "https://schema.org/EventScheduled",
  postponed: "https://schema.org/EventPostponed",
};

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

// Reparte una estadística entre local/visitante como porcentaje de la
// SUMA de ambos (no de un total fijo de 100 — cosas como remates o
// córners no suman 100 naturalmente, la posesión sí, y esto funciona
// igual de bien para las dos). Con 0-0 (todavía no hay datos, ej. una
// estadística que arranca en cero para ambos) se reparte 50/50 en vez
// de dividir por cero.
function statSplit(home, away) {
  const h = Number(home) || 0;
  const a = Number(away) || 0;
  const total = h + a;
  if (total === 0) return { home: 50, away: 50 };
  return { home: (h / total) * 100, away: (a / total) * 100 };
}

function StatRow({ label, home, away }) {
  const split = statSplit(home, away);
  return (
    <div className="match-stat-row">
      <span className="match-stat-value">{home ?? "-"}</span>
      <span className="match-stat-label">{label}</span>
      <span className="match-stat-value">{away ?? "-"}</span>
      <div className="stat-bar-track">
        <motion.div
          className="stat-bar-home"
          initial={{ width: 0 }}
          whileInView={{ width: `${split.home}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        />
        <motion.div
          className="stat-bar-away"
          initial={{ width: 0 }}
          whileInView={{ width: `${split.away}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        />
      </div>
    </div>
  );
}

function Predictions({ predictions, home, away }) {
  return (
    <div className="team-section">
      <h2 className="team-section-title">Predicción estadística</h2>
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
      <p className="prediction-disclaimer">
        Modelo estadístico, no es una garantía de resultado ni un consejo de apuesta.
      </p>
    </div>
  );
}

const WEATHER_ICON = { clear: "☀️", cloudy: "☁️", rain: "🌧️", snow: "❄️", extreme: "⛈️" };

function MatchMeta({ detail }) {
  const parts = [];
  if (detail.roundLabel) parts.push(detail.roundLabel);
  else if (detail.stageName) parts.push(detail.stageName);
  if (detail.isDerby) parts.push("Clásico");
  if (detail.attendance) parts.push(`${detail.attendance.toLocaleString("es-AR")} espectadores`);

  if (parts.length === 0 && !detail.weather) return null;

  return (
    <div className="match-meta-row">
      {parts.length > 0 && <span className="match-meta-text">{parts.join(" · ")}</span>}
      {detail.weather && (detail.weather.temperatureC != null || detail.weather.description) && (
        <span className="match-meta-weather">
          {WEATHER_ICON[detail.weather.description] || ""}
          {detail.weather.temperatureC != null ? ` ${Math.round(detail.weather.temperatureC)}°C` : ""}
        </span>
      )}
    </div>
  );
}

const LIVE_POLL_MS = 30000; // alineado con el TTL de detalle en vivo del backend (server.js)

const TABS = [
  { key: "resumen", label: "Resumen" },
  { key: "alineaciones", label: "Alineaciones" },
  { key: "estadisticas", label: "Estadísticas" },
  { key: "eventos", label: "Eventos" },
  { key: "xg", label: "xG" },
  { key: "h2h", label: "H2H" },
  { key: "pronostico", label: "Pronóstico" },
];

export default function MatchDetail({ matchId, onBack }) {
  const [detail, setDetail] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("resumen");

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

  useEffect(() => {
    setActiveTab("resumen"); // otro partido -> volvemos a la pestaña por defecto
  }, [matchId]);

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

  useStructuredData(
    detail
      ? {
          "@context": "https://schema.org",
          "@type": "SportsEvent",
          name: `${detail.home?.name} vs ${detail.away?.name}`,
          startDate: detail.start,
          sport: "Football",
          ...(EVENT_STATUS[detail.status] ? { eventStatus: EVENT_STATUS[detail.status] } : {}),
          homeTeam: { "@type": "SportsTeam", name: detail.home?.name },
          awayTeam: { "@type": "SportsTeam", name: detail.away?.name },
        }
      : null
  );

  // Nombre + foto de cada jugador por id, para mostrarlos en el shotmap
  // y en las estadísticas por jugador (esos dos endpoints solo traen el
  // id) — se arma solo cuando hay alineación, así las dos secciones
  // siguen funcionando (con "Jugador"/sin foto) aunque la alineación
  // todavía no esté confirmada.
  const playersById = useMemo(() => {
    if (!detail?.lineups) return null;
    const map = new Map();
    for (const side of [detail.lineups.home, detail.lineups.away]) {
      for (const p of [...(side?.starters || []), ...(side?.substitutes || [])]) {
        map.set(p.id, { name: p.name, photo: p.photo });
      }
    }
    return map;
  }, [detail?.lineups]);

  const availableTabs = detail
    ? TABS.filter((t) => {
        if (t.key === "resumen") return true;
        if (t.key === "alineaciones") return !!detail.lineups;
        if (t.key === "estadisticas") return !!detail.statistics?.length || !!detail.playerStats?.length;
        if (t.key === "eventos") return !!detail.events?.length;
        if (t.key === "xg") return !!detail.xg || !!detail.shotmap?.length;
        if (t.key === "h2h") return !!detail.h2h || !!detail.form?.home?.length || !!detail.form?.away?.length;
        if (t.key === "pronostico") return !!detail.predictions;
        return false;
      })
    : [];

  const currentTab = availableTabs.some((t) => t.key === activeTab) ? activeTab : "resumen";

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
                  <AnimatedScore value={detail.home?.score} /> - <AnimatedScore value={detail.away?.score} />
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

          <MatchMeta detail={detail} />

          {availableTabs.length > 1 && (
            <div className="match-tabs" role="tablist">
              {availableTabs.map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={currentTab === t.key}
                  className={"match-tab" + (currentTab === t.key ? " active" : "")}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {currentTab === "resumen" && (
            <>
              {detail.statistics && (
                <div className="team-section">
                  <h2 className="team-section-title">Estadísticas destacadas</h2>
                  <div className="match-stats-list">
                    {detail.statistics.slice(0, 5).map((row, i) => (
                      <StatRow key={i} label={row.label} home={row.home} away={row.away} />
                    ))}
                  </div>
                </div>
              )}
              {detail.events && <MatchEvents events={detail.events.slice(0, 5)} />}
              {!detail.statistics && !detail.events && detail.status === "scheduled" && (
                <p className="empty">
                  El resumen del partido va a estar disponible cuando arranque.
                </p>
              )}
            </>
          )}

          {currentTab === "alineaciones" && (
            <>
              {detail.lineups ? (
                <LineupPitch
                  home={detail.lineups.home}
                  away={detail.lineups.away}
                  events={detail.events}
                  unavailablePlayers={detail.unavailablePlayers}
                />
              ) : (
                <p className="empty">
                  {detail.status === "scheduled"
                    ? "Alineaciones todavía no confirmadas."
                    : "No hay datos de alineación para este partido."}
                </p>
              )}
            </>
          )}

          {currentTab === "estadisticas" && (
            <>
              {detail.statistics && (
                <div className="team-section">
                  <div className="match-stats-list">
                    {detail.statistics.map((row, i) => (
                      <StatRow key={i} label={row.label} home={row.home} away={row.away} />
                    ))}
                  </div>
                </div>
              )}
              <MatchPlayerStats
                playerStats={detail.playerStats}
                homeId={detail.home?.id}
                awayId={detail.away?.id}
                homeName={detail.home?.name}
                awayName={detail.away?.name}
                playersById={playersById}
              />
            </>
          )}

          {currentTab === "eventos" && <MatchEvents events={detail.events} />}

          {currentTab === "xg" && (
            <MatchShotmap
              xg={detail.xg}
              shotmap={detail.shotmap}
              homeName={detail.home?.name}
              awayName={detail.away?.name}
              playersById={playersById}
            />
          )}

          {currentTab === "h2h" && (
            <MatchH2H
              h2h={detail.h2h}
              form={detail.form}
              homeName={detail.home?.name}
              awayName={detail.away?.name}
            />
          )}

          {currentTab === "pronostico" && detail.predictions && (
            <Predictions predictions={detail.predictions} home={detail.home} away={detail.away} />
          )}
        </>
      )}
    </div>
  );
}
