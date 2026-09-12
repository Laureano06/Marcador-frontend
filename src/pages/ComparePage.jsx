import { useCallback, useEffect, useRef, useState } from "react";
import { search, fetchPlayerDetail, fetchCompetitionDetail } from "../api";
import { COMPETITION_REGISTRY } from "../competitions/config";
import PlayerFace from "../components/PlayerFace";
import PlayerLink from "../components/PlayerLink";
import TeamLink from "../components/TeamLink";
import { useDocumentMeta } from "../useDocumentMeta";

const DEBOUNCE_MS = 450;

const LEAGUE_OPTIONS = Object.entries(COMPETITION_REGISTRY)
  .map(([id, entry]) => ({ id, name: entry.names[0] }))
  .sort((a, b) => a.name.localeCompare(b.name, "es"));

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

// "higher" = gana el número más alto, "lower" = gana el más bajo, null =
// solo informativo, no se resalta ningún lado (ej. minutos jugados: más
// no es "mejor", solo distinto).
const PLAYER_STAT_ROWS = [
  { key: "appearances", label: "Partidos", direction: null },
  { key: "minutes", label: "Minutos", direction: null },
  { key: "goals", label: "Goles", direction: "higher" },
  { key: "assists", label: "Asistencias", direction: "higher" },
  { key: "shots", label: "Remates", direction: "higher" },
  { key: "shotsOnTarget", label: "Remates al arco", direction: "higher" },
  { key: "yellowCards", label: "Amarillas", direction: "lower" },
  { key: "redCards", label: "Rojas", direction: "lower" },
  { key: "averageRating", label: "Rating promedio", direction: "higher", decimals: 2 },
];

const TEAM_STAT_ROWS = [
  { key: "position", label: "Posición", direction: "lower" },
  { key: "played", label: "PJ", direction: null },
  { key: "won", label: "Ganados", direction: "higher" },
  { key: "drawn", label: "Empatados", direction: null },
  { key: "lost", label: "Perdidos", direction: "lower" },
  { key: "goalsFor", label: "GF", direction: "higher" },
  { key: "goalsAgainst", label: "GC", direction: "lower" },
  { key: "goalDiff", label: "DG", direction: "higher" },
  { key: "points", label: "Puntos", direction: "higher" },
  { key: "xgFor", label: "xG a favor", direction: "higher", decimals: 1 },
  { key: "xgAgainst", label: "xG en contra", direction: "lower", decimals: 1 },
];

function formatStatValue(value, decimals) {
  if (value === null || value === undefined) return "—";
  if (decimals != null) return value.toFixed(decimals);
  return value.toLocaleString("es-AR");
}

// "a" | "b" | null — de qué lado va el resaltado de "mejor valor" en esta
// fila, según la dirección de la métrica. Empate no resalta ningún lado.
function betterSide(row, a, b) {
  if (!row.direction || a == null || b == null || a === b) return null;
  if (row.direction === "higher") return a > b ? "a" : "b";
  return a < b ? "a" : "b";
}

function StatCompareTable({ rows, valuesA, valuesB }) {
  return (
    <table className="compare-table">
      <tbody>
        {rows.map((row) => {
          const a = valuesA[row.key] ?? null;
          const b = valuesB[row.key] ?? null;
          const winner = betterSide(row, a, b);
          return (
            <tr key={row.key}>
              <td className={"compare-value" + (winner === "a" ? " compare-winner" : "")}>
                {formatStatValue(a, row.decimals)}
              </td>
              <td className="compare-label">{row.label}</td>
              <td className={"compare-value" + (winner === "b" ? " compare-winner" : "")}>
                {formatStatValue(b, row.decimals)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function PlayerPicker({ label, player, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setOpen(true);
    clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const data = await search(value);
      setResults(data?.players || []);
    }, DEBOUNCE_MS);
  };

  const handlePick = (p) => {
    onSelect(p);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  if (player) {
    return (
      <div className="compare-picker compare-picker-selected">
        <PlayerFace photo={player.photo} name={player.name} size="md" />
        <div className="compare-picker-info">
          <strong>{player.name}</strong>
          {player.teamName && <span>{player.teamName}</span>}
        </div>
        <button className="compare-picker-clear" onClick={() => onSelect(null)} aria-label="Quitar jugador">
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="compare-picker" ref={boxRef}>
      <input
        className="compare-picker-input"
        type="text"
        placeholder={label}
        value={query}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div className="compare-picker-dropdown">
          {results.map((p) => (
            <button key={p.id} className="compare-picker-option" onClick={() => handlePick(p)}>
              <PlayerFace photo={p.photo} name={p.name} size="sm" />
              <span>{p.name}</span>
              <span className="compare-picker-option-team">{p.teamName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PlayerCompare() {
  const [playerA, setPlayerA] = useState(null);
  const [playerB, setPlayerB] = useState(null);
  const [statsA, setStatsA] = useState(null);
  const [statsB, setStatsB] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ok | error

  useEffect(() => {
    if (!playerA || !playerB) {
      setStatsA(null);
      setStatsB(null);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    Promise.all([fetchPlayerDetail(playerA.id), fetchPlayerDetail(playerB.id)])
      .then(([a, b]) => {
        setStatsA(a);
        setStatsB(b);
        setStatus("ok");
      })
      .catch((err) => {
        console.error(err);
        setStatus("error");
      });
  }, [playerA, playerB]);

  return (
    <>
      <div className="compare-pickers">
        <PlayerPicker label="Buscar primer jugador…" player={playerA} onSelect={setPlayerA} />
        <span className="compare-vs">VS</span>
        <PlayerPicker label="Buscar segundo jugador…" player={playerB} onSelect={setPlayerB} />
      </div>

      {status === "loading" && <p className="empty">Comparando…</p>}
      {status === "error" && <p className="empty">No pudimos comparar estos jugadores.</p>}

      {status === "ok" && statsA && statsB && (
        <>
          <div className="compare-heads">
            <PlayerLink playerId={statsA.id} className="compare-head">
              <PlayerFace photo={statsA.photo} name={statsA.name} size="lg" />
              <strong>{statsA.name}</strong>
              {statsA.teamName && <TeamLink teamId={statsA.teamId}>{statsA.teamName}</TeamLink>}
            </PlayerLink>
            <PlayerLink playerId={statsB.id} className="compare-head">
              <PlayerFace photo={statsB.photo} name={statsB.name} size="lg" />
              <strong>{statsB.name}</strong>
              {statsB.teamName && <TeamLink teamId={statsB.teamId}>{statsB.teamName}</TeamLink>}
            </PlayerLink>
          </div>

          {statsA.stats && statsB.stats ? (
            <StatCompareTable rows={PLAYER_STAT_ROWS} valuesA={statsA.stats} valuesB={statsB.stats} />
          ) : (
            <p className="empty">
              No hay estadísticas de la temporada disponibles para{" "}
              {!statsA.stats ? statsA.name : statsB.name}.
            </p>
          )}
        </>
      )}
    </>
  );
}

function TeamCompare() {
  const [leagueId, setLeagueId] = useState("");
  const [teams, setTeams] = useState([]);
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | ok | error

  const loadLeague = useCallback((id) => {
    setLeagueId(id);
    setTeamAId("");
    setTeamBId("");
    setTeams([]);
    if (!id) {
      setStatus("idle");
      return;
    }
    setStatus("loading");
    fetchCompetitionDetail(id)
      .then((data) => {
        const flat = (data.standings || []).flatMap((table) => table.rows);
        setTeams(flat);
        setStatus("ok");
      })
      .catch((err) => {
        console.error(err);
        setStatus("error");
      });
  }, []);

  const rowA = teams.find((t) => String(t.teamId) === teamAId);
  const rowB = teams.find((t) => String(t.teamId) === teamBId);

  return (
    <>
      <div className="compare-league-select-wrap">
        <select
          className="compare-league-select"
          value={leagueId}
          onChange={(e) => loadLeague(e.target.value)}
        >
          <option value="">Elegí una liga…</option>
          {LEAGUE_OPTIONS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      {status === "loading" && <p className="empty">Cargando tabla…</p>}
      {status === "error" && <p className="empty">No pudimos cargar esta liga.</p>}

      {status === "ok" && teams.length > 0 && (
        <>
          <div className="compare-pickers">
            <select className="compare-team-select" value={teamAId} onChange={(e) => setTeamAId(e.target.value)}>
              <option value="">Elegí un equipo…</option>
              {teams.map((t) => (
                <option key={t.teamId} value={t.teamId}>
                  {t.teamName}
                </option>
              ))}
            </select>
            <span className="compare-vs">VS</span>
            <select className="compare-team-select" value={teamBId} onChange={(e) => setTeamBId(e.target.value)}>
              <option value="">Elegí un equipo…</option>
              {teams.map((t) => (
                <option key={t.teamId} value={t.teamId}>
                  {t.teamName}
                </option>
              ))}
            </select>
          </div>

          {rowA && rowB && (
            <>
              <div className="compare-heads">
                <TeamLink teamId={rowA.teamId} className="compare-head">
                  {rowA.teamCrest && <img src={rowA.teamCrest} alt="" className="compare-head-crest" />}
                  <strong>{rowA.teamName}</strong>
                  <FormChips form={rowA.form} />
                </TeamLink>
                <TeamLink teamId={rowB.teamId} className="compare-head">
                  {rowB.teamCrest && <img src={rowB.teamCrest} alt="" className="compare-head-crest" />}
                  <strong>{rowB.teamName}</strong>
                  <FormChips form={rowB.form} />
                </TeamLink>
              </div>

              <StatCompareTable rows={TEAM_STAT_ROWS} valuesA={rowA} valuesB={rowB} />
            </>
          )}
        </>
      )}
    </>
  );
}

const MODES = [
  { key: "jugadores", label: "Jugadores" },
  { key: "equipos", label: "Equipos" },
];

export default function ComparePage() {
  const [mode, setMode] = useState("jugadores");

  useDocumentMeta({
    title: "Comparar jugadores y equipos | PARTIDOS",
    description: "Comparación cara a cara de estadísticas de jugadores y de equipos en su tabla de posiciones.",
  });

  return (
    <div className="compare-page">
      <h1 className="compare-heading">Comparar</h1>

      <div className="feed-filter-group" role="radiogroup" aria-label="Comparar jugadores o equipos">
        {MODES.map((m) => (
          <button
            key={m.key}
            role="radio"
            aria-checked={mode === m.key}
            className={"feed-filter-btn" + (mode === m.key ? " active" : "")}
            onClick={() => setMode(m.key)}
          >
            <span className="feed-filter-label">{m.label}</span>
          </button>
        ))}
      </div>

      {mode === "jugadores" ? <PlayerCompare /> : <TeamCompare />}
    </div>
  );
}
