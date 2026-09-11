import { useCallback, useEffect, useState } from "react";
import { fetchCompetitionDetail } from "../api";
import PlayerFace from "./PlayerFace";
import PlayerLink from "./PlayerLink";
import TeamLink from "./TeamLink";
import { ChevronLeftIcon } from "./icons";
import { useDocumentMeta } from "../useDocumentMeta";

const TABS = [
  { key: "tabla", label: "Tabla" },
  { key: "goleadores", label: "Goleadores" },
  { key: "asistencias", label: "Asistencias" },
];

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

  const load = useCallback(() => {
    setStatus("loading");
    setCompetition(null);
    fetchCompetitionDetail(leagueId)
      .then((data) => {
        setCompetition(data);
        setStatus("ok");
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage(err.message);
        setStatus("error");
      });
  }, [leagueId]);

  useEffect(() => {
    load();
  }, [load]);

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
                {competition.season?.name && <span>{competition.season.name}</span>}
              </div>
            </div>
          </div>

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

          {availableTabs.length === 0 && (
            <p className="empty">Todavía no hay tabla ni estadísticas disponibles para esta competencia.</p>
          )}
        </>
      )}
    </div>
  );
}
