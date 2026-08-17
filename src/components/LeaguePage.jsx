import { useEffect, useState } from "react";
import { fetchLeagueStandings, fetchLeagueMatches } from "../api";
import { groupByDate, labelForDate } from "../utils";
import StandingsTable from "./StandingsTable";
import MatchCard from "./MatchCard";

export default function LeaguePage({
  league,
  onBack,
  onSelectTeam,
  isTeamFavorite,
  onToggleTeam,
}) {
  const [standings, setStandings] = useState(null);
  const [matches, setMatches] = useState([]);
  const [tab, setTab] = useState("matches"); // "matches" | "table"
  const [status, setStatus] = useState("loading"); // loading | ok | error

  useEffect(() => {
    setStatus("loading");
    setStandings(null);
    setMatches([]);

    Promise.all([
      fetchLeagueStandings(league.slug),
      fetchLeagueMatches(league.slug),
    ])
      .then(([standingsRes, matchesRes]) => {
        setStandings(standingsRes.standings);
        setMatches(matchesRes.matches);
        setStatus("ok");
      })
      .catch((err) => {
        console.error(err);
        setStatus("error");
      });
  }, [league.slug]);

  const dayGroups = Object.entries(groupByDate(matches));

  return (
    <div className="league-page">
      <button className="back-btn" onClick={onBack}>
        ‹ Volver
      </button>

      <h1 className="league-page-title">{league.name}</h1>

      <div className="tabs-row">
        <button
          className={"tab-btn" + (tab === "matches" ? " active" : "")}
          onClick={() => setTab("matches")}
        >
          Partidos
        </button>
        <button
          className={"tab-btn" + (tab === "table" ? " active" : "")}
          onClick={() => setTab("table")}
        >
          Tabla
        </button>
      </div>

      {status === "loading" && <p className="empty">Cargando…</p>}
      {status === "error" && (
        <p className="error-banner">No se pudo cargar esta liga.</p>
      )}

      {status === "ok" && tab === "table" && (
        <StandingsTable standings={standings} onSelectTeam={onSelectTeam} />
      )}

      {status === "ok" && tab === "matches" && (
        <>
          {dayGroups.length === 0 && (
            <p className="empty">No hay partidos programados en estas fechas.</p>
          )}
          {dayGroups.map(([dateKey, dayMatches]) => (
            <div key={dateKey}>
              <div className="day-heading">{labelForDate(dateKey)}</div>
              {dayMatches.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  onSelectTeam={onSelectTeam}
                  isTeamFavorite={isTeamFavorite}
                  onToggleTeam={onToggleTeam}
                />
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
