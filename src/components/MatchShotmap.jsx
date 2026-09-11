import { motion } from "motion/react";
import PlayerLink from "./PlayerLink";
import { EASE_OUT } from "../motion";

const RESULT_LABEL = { goal: "GOL", miss: "Afuera", save: "Atajado", block: "Bloqueado", post: "Palo" };

function ShotRow({ shot }) {
  return (
    <li className={"shot-row" + (shot.result === "goal" ? " shot-row-goal" : "")}>
      <span className="shot-minute">{shot.addedTime ? `${shot.minute}+${shot.addedTime}'` : `${shot.minute}'`}</span>
      <PlayerLink playerId={shot.playerId} className="shot-player">
        {shot.playerName || "Jugador"}
      </PlayerLink>
      <span className="shot-xg">xG {shot.xg != null ? shot.xg.toFixed(2) : "-"}</span>
      <span className={"shot-result shot-result-" + shot.result}>{RESULT_LABEL[shot.result] || shot.result}</span>
    </li>
  );
}

// Total de xG (barra comparativa, mismo patrón que MatchDetail.jsx ya
// usa para estadísticas) + lista de remates ordenada por minuto,
// separada por equipo. Se evita dibujar un scatter sobre la cancha con
// las coordenadas x/y de BSD: no hay forma de confirmar desde acá si
// vienen normalizadas por lado de ataque o son posición absoluta de
// campo, y una cancha que "miente" sobre dónde se pateó es peor que una
// lista de texto correcta.
export default function MatchShotmap({ xg, shotmap, homeName, awayName, playersById }) {
  if (!xg && (!shotmap || shotmap.length === 0)) return null;

  const total = (xg?.home ?? 0) + (xg?.away ?? 0) || 1;
  const homePct = xg ? (xg.home / total) * 100 : 50;
  const awayPct = xg ? (xg.away / total) * 100 : 50;

  const withNames = (shotmap || []).map((s) => ({ ...s, playerName: playersById?.get(s.playerId)?.name }));
  const homeShots = withNames.filter((s) => s.isHome).sort((a, b) => b.minute - a.minute);
  const awayShots = withNames.filter((s) => !s.isHome).sort((a, b) => b.minute - a.minute);

  return (
    <div className="team-section">
      <h2 className="team-section-title">
        Goles esperados (xG)
        {xg?.estimated && <span className="xg-estimated-tag">estimado</span>}
      </h2>

      {xg && (
        <div className="xg-total-row">
          <span className="xg-total-value">{xg.home.toFixed(2)}</span>
          <div className="stat-bar-track">
            <motion.div
              className="stat-bar-home"
              initial={{ width: 0 }}
              whileInView={{ width: `${homePct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
            />
            <motion.div
              className="stat-bar-away"
              initial={{ width: 0 }}
              whileInView={{ width: `${awayPct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
            />
          </div>
          <span className="xg-total-value">{xg.away.toFixed(2)}</span>
        </div>
      )}

      {shotmap && shotmap.length > 0 && (
        <div className="shotmap-columns">
          <div className="shotmap-column">
            <div className="shotmap-column-title">{homeName}</div>
            <ul className="shot-list">
              {homeShots.map((s, i) => (
                <ShotRow key={i} shot={s} />
              ))}
            </ul>
          </div>
          <div className="shotmap-column">
            <div className="shotmap-column-title">{awayName}</div>
            <ul className="shot-list">
              {awayShots.map((s, i) => (
                <ShotRow key={i} shot={s} />
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
