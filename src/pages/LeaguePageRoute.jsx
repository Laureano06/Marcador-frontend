import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import LeaguePage from "../components/LeaguePage";

export default function LeaguePageRoute() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { leagues, isTeamFavorite, toggleTeam } = useOutletContext();

  const league = leagues.find((l) => l.slug === slug);

  if (!league) {
    // Puede pasar mientras la lista de ligas todavía está cargando (viene
    // de una request al montar el Layout) — no es un error real.
    return <p className="empty">Cargando…</p>;
  }

  return (
    <LeaguePage
      league={league}
      onBack={() => navigate(-1)}
      onSelectTeam={(id) => navigate(`/equipo/${id}`)}
      onSelectMatch={(match) => navigate(`/partido/${match.id}`)}
      isTeamFavorite={isTeamFavorite}
      onToggleTeam={toggleTeam}
    />
  );
}
