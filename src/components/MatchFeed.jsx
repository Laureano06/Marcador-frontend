import { groupByLeague } from "../utils";
import MatchCard from "./MatchCard";
import FavoriteButton from "./FavoriteButton";

const EMPTY_COPY = {
  todos: "No hay partidos cargados para este día.",
  vivo: "No hay partidos en vivo ahora mismo.",
  favoritos: "No tenés partidos de tus favoritos este día.",
};

export default function MatchFeed({
  matches,
  onSelectTeam,
  onSelectMatch,
  isLeagueFavorite,
  onToggleLeague,
  isTeamFavorite,
  onToggleTeam,
  feedFilter,
  onShowAll,
}) {
  const groups = groupByLeague(matches);
  const leagues = Object.entries(groups);

  if (leagues.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty">{EMPTY_COPY[feedFilter] || EMPTY_COPY.todos}</p>
        {/* Salida de un toque: un filtro vacío nunca deja al usuario en un
            callejón sin salida — puede volver a "Todos" sin buscar el
            control de filtro de nuevo. */}
        {feedFilter !== "todos" && (
          <button className="empty-state-action" onClick={onShowAll}>
            Ver todos
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {leagues.map(([league, leagueMatches]) => (
        <div key={league}>
          <div className="league-bar">
            <span>{league}</span>
            <FavoriteButton
              active={isLeagueFavorite(league)}
              onClick={() => onToggleLeague(league)}
            />
          </div>
          {leagueMatches.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              onSelectTeam={onSelectTeam}
              onSelectMatch={onSelectMatch}
              isTeamFavorite={isTeamFavorite}
              onToggleTeam={onToggleTeam}
            />
          ))}
        </div>
      ))}
    </>
  );
}
