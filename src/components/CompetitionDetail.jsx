import { useCallback, useEffect, useState } from "react";
import { fetchCompetitionDetail, fetchBestXI } from "../api";
import PlayerFace from "./PlayerFace";
import PlayerLink from "./PlayerLink";
import TeamLink from "./TeamLink";
import { ChevronLeftIcon } from "./icons";
import { useDocumentMeta } from "../useDocumentMeta";

const TABS = [
  { key: "tabla", label: "Tabla" },
  { key: "goleadores", label: "Goleadores" },
  { key: "asistencias", label: "Asistencias" },
  { key: "once-ideal", label: "Once ideal" },
];

const BEST_XI_ROWS = [
  { key: "goalkeepers", label: "Arquero" },
  { key: "defenders", label: "Defensores" },
  { key: "midfielders", label: "Mediocampistas" },
  { key: "forwards", label: "Delanteros" },
];

function BestXI({ bestXI }) {
  return (
    <div className="best-xi">
      {bestXI.season?.name && <p className="best-xi-season">{bestXI.season.name}</p>}
      {BEST_XI_ROWS.map((row) => (
        <div key={row.key} className="best-xi-row">
          <div className="best-xi-row-label">{row.label}</div>
          <div className="best-xi-players">
            {bestXI[row.key].map((p) => (
              <PlayerLink key={p.playerId} playerId={p.playerId} className="best-xi-player">
                <PlayerFace photo={p.photo} name={p.playerName} size="md" />
                <span className="best-xi-player-name">{p.playerName}</span>
                <TeamLink teamId={p.teamId} className="best-xi-player-team">
                  {p.teamName}
                </TeamLink>
                <span className="best-xi-player-rating">{p.avgRating.toFixed(2)}</span>
              </PlayerLink>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FormChips({ form }) {
  if (!form) return null;
  return (
    <span className="standings-form">
      {[...form].map((r, i) => (
        <span key={i} className={"form-chip form-chip-sm form-chip-" + r}>
          {r}
        </span>
      ))}
    </span>
  );
}

function StandingsTable({ table }) {
  return (
    <div className="standings-table-wrap">
      {table.groupName && <div className="standings-group-title">{table.groupName}</div>}
      <div className="standings-scroll">
        <table className="standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th className="standings-team-col">Equipo</th>
              <th>PJ</th>
              <th>G</th>
              <th>E</th>
              <th>P</th>
              <th>GF</th>
              <th>GC</th>
              <th>DG</th>
              <th>Pts</th>
              <th className="standings-form-col">Forma</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.teamId} className={row.zone ? "standings-zone-" + row.zone.type : ""}>
                <td>{row.position}</td>
                <td className="standings-team-col">
                  <TeamLink teamId={row.teamId} className="standings-team">
                    {row.teamCrest && <img src={row.teamCrest} alt="" className="standings-crest" />}
                    {row.teamName}
                  </TeamLink>
                </td>
                <td>{row.played}</td>
                <td>{row.won}</td>
                <td>{row.drawn}</td>
                <td>{row.lost}</td>
                <td>{row.goalsFor}</td>
                <td>{row.goalsAgainst}</td>
                <td>{row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}</td>
                <td className="standings-pts">{row.points}</td>
                <td className="standings-form-col">
                  <FormChips form={row.form} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.rows.some((r) => r.zone) && (
        <ul className="standings-legend">
          {[...new Map(table.rows.filter((r) => r.zone).map((r) => [r.zone.label, r.zone])).values()].map(
            (zone) => (
              <li key={zone.label} className={"standings-legend-item standings-zone-" + zone.type}>
                <span className="standings-legend-dot" />
                {zone.label}
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}

function Leaderboard({ leaders }) {
  return (
    <ol className="leaderboard-list">
      {leaders.map((l) => (
        <li key={l.playerId} className="leaderboard-row">
          <span className="leaderboard-rank">{l.rank}</span>
          <PlayerLink playerId={l.playerId} className="leaderboard-player">
            <PlayerFace photo={l.photo} name={l.playerName} size="sm" />
            <span className="leaderboard-player-info">
              <span className="leaderboard-player-name">{l.playerName}</span>
              <TeamLink teamId={l.teamId} className="leaderboard-team">
                {l.teamName}
              </TeamLink>
            </span>
          </PlayerLink>
          <span className="leaderboard-value">{l.value}</span>
        </li>
      ))}
    </ol>
  );
}

export default function CompetitionDetail({ leagueId, onBack }) {
  const [competition, setCompetition] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("tabla");
  // undefined = "temporada actual, la que decida el backend" — solo pasa
  // a tener un valor puntual cuando el usuario elige una temporada
  // vieja en el selector. Volver a null en vez de guardar el id de la
  // actual evita que quedar "pisada" en una temporada vieja si el
  // usuario cambia de competencia sin tocar el selector.
  const [selectedSeasonId, setSelectedSeasonId] = useState(undefined);

  // Pedido aparte de fetchCompetitionDetail (endpoint propio en el
  // backend) — corre en paralelo, así una demora en el once ideal nunca
  // bloquea que se vea la tabla. null = "no calificó nadie todavía" (RULE
  // 1: si no hay datos, la pestaña ni aparece) — undefined = "sin pedir
  // todavía"/cargando.
  const [bestXI, setBestXI] = useState(undefined);

  const load = useCallback(() => {
    setStatus("loading");
    setCompetition(null);
    fetchCompetitionDetail(leagueId, selectedSeasonId)
      .then((data) => {
        setCompetition(data);
        setStatus("ok");
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage(err.message);
        setStatus("error");
      });
  }, [leagueId, selectedSeasonId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSelectedSeasonId(undefined); // otra competencia -> volvemos a "temporada actual"
  }, [leagueId]);

  useEffect(() => {
    setBestXI(undefined);
    fetchBestXI(leagueId, selectedSeasonId)
      .then(setBestXI)
      .catch((err) => {
        console.error(err);
        setBestXI(null);
      });
  }, [leagueId, selectedSeasonId]);

  useDocumentMeta({
    title: competition ? `${competition.name}: tabla, partidos y goleadores | PARTIDOS` : "PARTIDOS",
    description: competition
      ? `Tabla de posiciones, goleadores y asistencias de ${competition.name}${
          competition.country ? ` (${competition.country})` : ""
        } en PARTIDOS.`
      : undefined,
  });

  const availableTabs = competition
    ? TABS.filter((t) => {
        if (t.key === "tabla") return !!competition.standings?.length;
        if (t.key === "goleadores") return !!competition.topScorers?.length;
        if (t.key === "asistencias") return !!competition.topAssists?.length;
        if (t.key === "once-ideal") return !!bestXI;
        return false;
      })
    : [];
  const currentTab = availableTabs.some((t) => t.key === activeTab) ? activeTab : availableTabs[0]?.key;

  return (
    <div className="competition-detail">
      <button className="back-btn" onClick={onBack}>
        <ChevronLeftIcon />Volver
      </button>

      {status === "loading" && <p className="empty">Cargando competencia…</p>}
      {status === "error" && (
        <div className="error-state">
          <p className="error-state-title">No pudimos cargar esta competencia</p>
          <p className="error-state-subtitle">{errorMessage}</p>
          <button className="error-state-retry" onClick={load}>
            Reintentar
          </button>
        </div>
      )}

      {status === "ok" && competition?.stale && (
        <div className="stale-banner">
          Mostrando datos guardados — se alcanzó el límite diario de la API.
        </div>
      )}

      {status === "ok" && competition && (
        <>
          <div className="competition-header">
            {competition.logo && (
              <div className="competition-header-logo">
                <img src={competition.logo} alt="" />
              </div>
            )}
            <div>
              <h1>{competition.name}</h1>
              <div className="competition-header-meta">
                {competition.country && <span>{competition.country}</span>}
                {!competition.seasons?.length && competition.season?.name && (
                  <span>{competition.season.name}</span>
                )}
              </div>
            </div>
          </div>

          {competition.seasons?.length > 1 && (
            <label className="season-select-wrap">
              <span className="sr-only">Temporada</span>
              <select
                className="season-select"
                value={competition.season?.id ?? ""}
                onChange={(e) => setSelectedSeasonId(e.target.value)}
              >
                {competition.seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {availableTabs.length > 0 && (
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

          {currentTab === "tabla" &&
            competition.standings?.map((table, i) => <StandingsTable key={i} table={table} />)}

          {currentTab === "goleadores" && competition.topScorers && (
            <Leaderboard leaders={competition.topScorers} />
          )}

          {currentTab === "asistencias" && competition.topAssists && (
            <Leaderboard leaders={competition.topAssists} />
          )}

          {currentTab === "once-ideal" && bestXI && <BestXI bestXI={bestXI} />}

          {availableTabs.length === 0 && (
            <p className="empty">Todavía no hay tabla ni estadísticas disponibles para esta competencia.</p>
          )}
        </>
      )}
    </div>
  );
}
