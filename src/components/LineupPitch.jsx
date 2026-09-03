import { useState } from "react";

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

function Pitch({ side }) {
  const placed = layoutPlayers(side.starters, side.formation);

  if (!placed) {
    // Respaldo: sin grid ni formación reconocible, mostramos la lista
    // plana de toda la vida en vez de una cancha vacía.
    return (
      <div className="lineup-fallback-list">
        {side.starters.map((p) => (
          <div key={p.id} className="lineup-player">
            <span className="lineup-player-number">{p.number ?? "-"}</span>
            <span className="lineup-player-name">{p.name}</span>
            {p.position && <span className="lineup-player-position">{p.position}</span>}
          </div>
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
      {readingOrder.map(({ player, top, left }) => (
        <div
          key={player.id}
          className="pitch-player"
          style={{ top: `${top}%`, left: `${left}%` }}
        >
          <span className="pitch-player-dot">{player.number ?? "-"}</span>
          <span className="pitch-player-name">{player.name}</span>
        </div>
      ))}
    </div>
  );
}

export default function LineupPitch({ home, away }) {
  const [activeSide, setActiveSide] = useState("home");
  const side = activeSide === "home" ? home : away;

  if (!side || side.starters.length === 0) return null;

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
      <Pitch side={side} />
    </div>
  );
}
