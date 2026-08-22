import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import TeamDetail from "../components/TeamDetail";

export default function TeamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isTeamFavorite, toggleTeam } = useOutletContext();

  return (
    <TeamDetail
      teamId={id}
      onBack={() => navigate(-1)}
      onSelectTeam={(newId) => navigate(`/equipo/${newId}`)}
      isFavorite={isTeamFavorite(id)}
      onToggleFavorite={() => toggleTeam(id)}
    />
  );
}
