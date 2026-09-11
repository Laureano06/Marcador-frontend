import { Link } from "react-router-dom";
import { groupByLeague } from "../utils";
import MatchCard from "./MatchCard";
import FavoriteButton from "./FavoriteButton";
import { FadeIn, StaggerContainer, StaggerItem } from "../motion";

const EMPTY_COPY = {
  todos: "No hay partidos cargados para este día.",
  vivo: "No hay partidos en vivo ahora mismo.",
  favoritos: "No tenés partidos de tus favoritos este día.",
};

export default function MatchFeed({
  matches,
  favorites,
  onSelectTeam,
  onSelectMatch,
  isLeagueFavorite,
  onToggleLeague,
  isTeamFavorite,
  onToggleTeam,
  feedFilter,
  onShowAll,
}) {
  const groups = groupByLeague(matches, favorites);
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
          <FadeIn className="league-bar">
            {leagueMatches[0]?.leagueId ? (
              <Link to={`/competicion/${leagueMatches[0].leagueId}`} className="league-bar-link">
                {league}
              </Link>
            ) : (
              <span>{league}</span>
            )}
            <FavoriteButton
              active={isLeagueFavorite(league)}
              onClick={() => onToggleLeague(league)}
            />
          </FadeIn>
          {/* La cabecera de liga entra primero (FadeIn arriba), los
              partidos entran después en cascada (50ms entre uno y el
              siguiente) — no todos a la vez. */}
          <StaggerContainer>
            {leagueMatches.map((m) => (
              <StaggerItem key={m.id}>
                <MatchCard
                  match={m}
                  onSelectTeam={onSelectTeam}
                  onSelectMatch={onSelectMatch}
                  isTeamFavorite={isTeamFavorite}
                  onToggleTeam={onToggleTeam}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      ))}
    </>
  );
}
