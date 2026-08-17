import { groupByLeague } from "../utils";
import MatchCard from "./MatchCard";
import FavoriteButton from "./FavoriteButton";

export default function MatchFeed({
  matches,
  onSelectTeam,
  onSelectMatch,
  isLeagueFavorite,
  onToggleLeague,
  isTeamFavorite,
  onToggleTeam,
  onlyFavorites,
}) {
  // "Solo favoritos" muestra un partido si la LIGA es favorita, o si
  // cualquiera de los dos EQUIPOS lo es — así cubre a alguien que solo
  // sigue a un club puntual, no toda la competencia.
  const visibleMatches = onlyFavorites
    ? matches.filter(
        (m) =>
          isLeagueFavorite(m.league) ||
          isTeamFavorite(m.homeId) ||
          isTeamFavorite(m.awayId)
      )
    : matches;

  const groups = groupByLeague(visibleMatches);
  const leagues = Object.entries(groups);

  if (leagues.length === 0) {
    return (
      <p className="empty">
        {onlyFavorites
          ? "No tenés partidos de tus favoritos este día."
          : "No hay partidos cargados para este día."}
      </p>
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
