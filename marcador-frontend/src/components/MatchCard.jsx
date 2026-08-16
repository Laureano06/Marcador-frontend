import { useState } from "react";
import { crestColor, formatTime } from "../utils";
import FavoriteButton from "./FavoriteButton";

// Muestra el escudo real (fondo blanco) si la API nos dio una URL. Si no
// hay URL, o si la imagen falla al cargar, cae a un círculo de color con
// las iniciales — así nunca queda un hueco vacío.
function Crest({ abbr, crestUrl }) {
  const [failed, setFailed] = useState(false);

  if (crestUrl && !failed) {
    return (
      <div className="crest crest-img">
        <img
          src={crestUrl}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className="crest crest-fallback" style={{ background: crestColor(abbr) }}>
      {abbr}
    </div>
  );
}

function StatusBadge({ status, start }) {
  if (status === "live") {
    return (
      <span className="status-badge live">
        <span className="blip" /> EN VIVO
      </span>
    );
  }
  if (status === "final") {
    return <span className="status-badge final">FINAL</span>;
  }
  return <span className="status-badge scheduled">{formatTime(start)}</span>;
}

// El nombre + escudo de cada equipo es clickeable: lleva a la ficha del
// equipo (plantel, últimos partidos). La estrellita permite marcarlo como
// favorito sin salir de la lista de partidos.
function TeamSide({ id, name, ab, crest, side, onSelectTeam, isFavorite, onToggleFavorite }) {
  return (
    <div className={"side " + side}>
      <button
        className="side-clickable"
        onClick={() => onSelectTeam(id)}
        title={`Ver ${name}`}
      >
        <Crest abbr={ab} crestUrl={crest} />
        <div className="team-name">{name}</div>
      </button>
      <FavoriteButton active={isFavorite} onClick={onToggleFavorite} />
    </div>
  );
}

export default function MatchCard({
  match,
  onSelectTeam,
  isTeamFavorite,
  onToggleTeam,
}) {
  const hasScore = match.scoreHome !== null && match.scoreAway !== null;

  return (
    <div className="match">
      <div className="match-top">
        <TeamSide
          id={match.homeId}
          name={match.home}
          ab={match.homeAb}
          crest={match.homeCrest}
          side="home"
          onSelectTeam={onSelectTeam}
          isFavorite={isTeamFavorite(match.homeId)}
          onToggleFavorite={() => onToggleTeam(match.homeId)}
        />

        <div className="center">
          <div className="score">
            {hasScore ? `${match.scoreHome} - ${match.scoreAway}` : "VS"}
          </div>
          <StatusBadge status={match.status} start={match.start} />
        </div>

        <TeamSide
          id={match.awayId}
          name={match.away}
          ab={match.awayAb}
          crest={match.awayCrest}
          side="away"
          onSelectTeam={onSelectTeam}
          isFavorite={isTeamFavorite(match.awayId)}
          onToggleFavorite={() => onToggleTeam(match.awayId)}
        />
      </div>

      {match.prob && (
        <div className="prob">
          <div className="prob-bar">
            <div className="home" style={{ width: `${match.prob.home}%` }} />
            <div className="draw" style={{ width: `${match.prob.draw}%` }} />
            <div className="away" style={{ width: `${match.prob.away}%` }} />
          </div>
          <div className="prob-labels">
            <span>{match.prob.home.toFixed(0)}%</span>
            <span>Empate {match.prob.draw.toFixed(0)}%</span>
            <span>{match.prob.away.toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
