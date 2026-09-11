import { useMemo, useState } from "react";
import PlayerFace from "./PlayerFace";
import PlayerLink from "./PlayerLink";

const COLUMNS = [
  { key: "minutesPlayed", label: "Min" },
  { key: "goals", label: "G" },
  { key: "assists", label: "A" },
  { key: "xg", label: "xG", decimals: 2 },
  { key: "rating", label: "Rating", decimals: 1 },
];

function PlayerRow({ row, playerInfo }) {
  return (
    <li className="player-stats-row">
      <PlayerLink playerId={row.playerId} className="player-stats-row-name">
        <PlayerFace photo={playerInfo?.photo} name={playerInfo?.name} size="sm" />
        <span>{playerInfo?.name || `#${row.playerId}`}</span>
      </PlayerLink>
      {COLUMNS.map((c) => (
        <span key={c.key} className="player-stats-cell">
          {row[c.key] != null ? (c.decimals ? row[c.key].toFixed(c.decimals) : row[c.key]) : "-"}
        </span>
      ))}
    </li>
  );
}

// Tabla de estadísticas individuales — separada por equipo, se puede
// ordenar tocando una columna (los datos ya están todos cargados del
// lado del cliente, no hace falta pedir nada de nuevo por eso).
function TeamPlayerStats({ teamName, rows, playersById }) {
  const [sortKey, setSortKey] = useState("minutesPlayed");

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => (b[sortKey] ?? -1) - (a[sortKey] ?? -1));
  }, [rows, sortKey]);

  if (rows.length === 0) return null;

  return (
    <div className="player-stats-table">
      <div className="player-stats-team-title">{teamName}</div>
      <div className="player-stats-header">
        <span className="player-stats-row-name">Jugador</span>
        {COLUMNS.map((c) => (
          <button
            key={c.key}
            className={"player-stats-sort" + (sortKey === c.key ? " active" : "")}
            onClick={() => setSortKey(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <ul className="player-stats-list">
        {sorted.map((row) => (
          <PlayerRow key={row.playerId} row={row} playerInfo={playersById?.get(row.playerId)} />
        ))}
      </ul>
    </div>
  );
}

export default function MatchPlayerStats({ playerStats, homeId, awayId, homeName, awayName, playersById }) {
  if (!playerStats || playerStats.length === 0) return null;

  const homeRows = playerStats.filter((p) => p.teamId === homeId);
  const awayRows = playerStats.filter((p) => p.teamId === awayId);

  return (
    <div className="team-section">
      <h2 className="team-section-title">Estadísticas por jugador</h2>
      <TeamPlayerStats teamName={homeName} rows={homeRows} playersById={playersById} />
      <TeamPlayerStats teamName={awayName} rows={awayRows} playersById={playersById} />
    </div>
  );
}
