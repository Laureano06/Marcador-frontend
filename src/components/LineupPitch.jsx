import { useState } from "react";
import { motion } from "motion/react";
import PlayerFace from "./PlayerFace";
import PlayerLink from "./PlayerLink";
import { DURATION, EASE_OUT } from "../motion";

// "4-4-2" -> [4, 4, 2] (sin contar al arquero, que siempre va aparte).
function parseFormationLines(formation) {
  if (!formation) return null;
  const parts = formation
    .split("-")
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0);
  return parts.length > 0 ? parts : null;
}

// Ubica cada titular en coordenadas (top/left, en %) para dibujarlo sobre
// la cancha. Preferimos el campo "grid" que manda la API ("fila:columna",
// fila 1 = arquero y crece hacia adelante) porque refleja la posición
// real que jugó cada uno. Cuando no está disponible — pasa seguido en
// ligas con poca cobertura de datos — reconstruimos filas parejas a
// partir del string de formación ("4-4-2"); si tampoco hay formación,
// devolvemos null y el que llama cae a la lista plana de siempre.
function layoutPlayers(starters, formation) {
  const withGrid = starters.filter((p) => p.grid);
  if (withGrid.length === starters.length && starters.length > 0) {
    const rows = [...new Set(starters.map((p) => Number(p.grid.split(":")[0])))].sort(
      (a, b) => a - b
    );
    return starters.map((p) => {
      const [row, col] = p.grid.split(":").map(Number);
      const rowPlayers = starters.filter((q) => Number(q.grid.split(":")[0]) === row);
      const rowIndex = rows.indexOf(row);
      return {
        player: p,
        top: (rowIndex / (rows.length - 1 || 1)) * 82 + 6,
        left: ((col - 0.5) / rowPlayers.length) * 100,
      };
    });
  }

  const lines = parseFormationLines(formation);
  const gk = starters.find((p) => p.position === "G");
  const outfield = starters.filter((p) => p.position !== "G");
  if (!lines || outfield.length === 0) return null;

  const rowsCount = lines.length + 1; // + arquero
  const result = [];
  if (gk) result.push({ player: gk, top: 4, left: 50 });

  let idx = 0;
  lines.forEach((count, lineIdx) => {
    const top = ((lineIdx + 1) / (rowsCount - 1 || 1)) * 82 + 6;
    for (let c = 0; c < count && idx < outfield.length; c++, idx++) {
      result.push({ player: outfield[idx], top, left: ((c + 0.5) / count) * 100 });
    }
  });
  return result;
}

// De la línea de tiempo del partido (MatchDetail la pasa entera) saca,
// por jugador: goles convertidos, tarjetas, y si entró/salió por cambio
// — todo lo que la cancha táctica necesita mostrar como badge sin volver
// a pedir nada. Un jugador puede tener más de un gol o tarjeta, por eso
// goles/tarjetas son contadores, no booleanos.
function badgesByPlayer(events) {
  const byId = new Map();
  const get = (id) => {
    if (!byId.has(id)) byId.set(id, { goals: 0, yellow: 0, red: 0, subOutMinute: null, subInMinute: null });
    return byId.get(id);
  };
  for (const ev of events || []) {
    if (ev.type === "goal" && ev.playerId) get(ev.playerId).goals += 1;
    if (ev.type === "card" && ev.playerId) {
      if (ev.cardType === "yellow") get(ev.playerId).yellow += 1;
      else if (ev.cardType === "red") get(ev.playerId).red += 1;
    }
    if (ev.type === "substitution") {
      if (ev.playerOutId) get(ev.playerOutId).subOutMinute = ev.minute;
      if (ev.playerInId) get(ev.playerInId).subInMinute = ev.minute;
    }
  }
  return byId;
}

function PlayerBadges({ badges }) {
  if (!badges) return null;
  const items = [];
  if (badges.goals > 0) items.push(<span key="g" className="player-badge player-badge-goal">⚽{badges.goals > 1 ? `×${badges.goals}` : ""}</span>);
  if (badges.yellow > 0) items.push(<span key="y" className="player-badge player-badge-yellow" />);
  if (badges.red > 0) items.push(<span key="r" className="player-badge player-badge-red" />);
  if (badges.subOutMinute != null) items.push(<span key="out" className="player-badge player-badge-sub-out">{badges.subOutMinute}'</span>);
  if (items.length === 0) return null;
  return <span className="player-badges">{items}</span>;
}

function TacticalPlayer({ player, badges, index }) {
  return (
    <motion.div
      className="pitch-player"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: DURATION.fast, ease: EASE_OUT, delay: index * 0.025 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.96 }}
    >
      <PlayerLink
        playerId={player.id}
        className="pitch-player-link"
        aria-label={`Ver perfil de ${player.name}`}
      >
        <span className="pitch-player-face-wrap">
          <PlayerFace photo={player.photo} name={player.name} size="md" />
          <span className="pitch-player-number">{player.number ?? "-"}</span>
          <PlayerBadges badges={badges} />
        </span>
        <span className="pitch-player-name">{player.name}</span>
      </PlayerLink>
    </motion.div>
  );
}

function Pitch({ side, badgesById }) {
  const placed = layoutPlayers(side.starters, side.formation);

  if (!placed) {
    // Respaldo: sin grid ni formación reconocible, mostramos la lista
    // plana de toda la vida en vez de una cancha vacía.
    return (
      <div className="lineup-fallback-list">
        {side.starters.map((p) => (
          <PlayerLink key={p.id} playerId={p.id} className="lineup-player" aria-label={`Ver perfil de ${p.name}`}>
            <PlayerFace photo={p.photo} name={p.name} size="sm" />
            <span className="lineup-player-number">{p.number ?? "-"}</span>
            <span className="lineup-player-name">{p.name}</span>
            {p.position && <span className="lineup-player-position">{p.position}</span>}
          </PlayerLink>
        ))}
      </div>
    );
  }

  // El orden visual (arriba a abajo: arquero -> defensa -> mediocampo ->
  // ataque) no coincidía con el orden en el DOM, que seguía el array
  // crudo de la API — un lector de pantalla recorría la formación en un
  // orden que no tenía relación con la cancha dibujada. `top` ya
  // codifica la fila real de cada jugador; ordenar por ahí antes de
  // pintar alinea lectura y layout sin tocar el posicionamiento (que
  // sigue siendo absoluto, por `top`/`left`).
  const readingOrder = [...placed].sort((a, b) => a.top - b.top);

  return (
    <div className="pitch">
      {readingOrder.map(({ player, top, left }, i) => (
        <div key={player.id} style={{ position: "absolute", top: `${top}%`, left: `${left}%`, transform: "translate(-50%, -50%)" }}>
          <TacticalPlayer player={player} badges={badgesById.get(player.id)} index={i} />
        </div>
      ))}
    </div>
  );
}

function Bench({ substitutes, badgesById }) {
  if (!substitutes || substitutes.length === 0) return null;
  return (
    <div className="lineup-bench">
      <div className="lineup-bench-title">Suplentes</div>
      <div className="lineup-bench-list">
        {substitutes.map((p) => {
          const badges = badgesById.get(p.id);
          return (
            <PlayerLink
              key={p.id}
              playerId={p.id}
              className="lineup-bench-player"
              aria-label={`Ver perfil de ${p.name}`}
            >
              <PlayerFace photo={p.photo} name={p.name} size="sm" />
              <span className="lineup-bench-info">
                <span className="lineup-bench-number">{p.number ?? "-"}</span>
                <span className="lineup-bench-name">{p.name}</span>
              </span>
              {badges?.subInMinute != null && (
                <span className="player-badge player-badge-sub-in">{badges.subInMinute}' IN</span>
              )}
            </PlayerLink>
          );
        })}
      </div>
    </div>
  );
}

function Unavailable({ list }) {
  if (!list || list.length === 0) return null;
  const STATUS_LABEL = { injured: "Lesionado", suspended: "Suspendido", doubtful: "Duda" };
  return (
    <div className="lineup-unavailable">
      <div className="lineup-bench-title">Bajas</div>
      <ul>
        {list.map((p) => (
          <li key={p.id ?? p.name} className={"unavailable-row unavailable-" + p.status}>
            <PlayerLink playerId={p.id} className="unavailable-name" aria-label={`Ver perfil de ${p.name}`}>
              {p.name}
            </PlayerLink>
            <span className="unavailable-status">{STATUS_LABEL[p.status] || p.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LineupPitch({ home, away, events, unavailablePlayers }) {
  const [activeSide, setActiveSide] = useState("home");
  const side = activeSide === "home" ? home : away;

  if (!side || side.starters.length === 0) return null;

  const badgesById = badgesByPlayer(events);
  const unavailable = activeSide === "home" ? unavailablePlayers?.home : unavailablePlayers?.away;

  return (
    <div className="lineup-pitch-wrap">
      <div className="lineup-side-tabs">
        {[
          ["home", home],
          ["away", away],
        ].map(([key, s]) =>
          s ? (
            <button
              key={key}
              className={"lineup-side-tab" + (activeSide === key ? " active" : "")}
              onClick={() => setActiveSide(key)}
            >
              {s.teamName}
              {s.formation ? ` (${s.formation})` : ""}
            </button>
          ) : null
        )}
      </div>
      <Pitch side={side} badgesById={badgesById} />
      <Bench substitutes={side.substitutes} badgesById={badgesById} />
      <Unavailable list={unavailable} />
    </div>
  );
}
