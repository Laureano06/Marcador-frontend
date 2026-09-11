import { useParams, useNavigate } from "react-router-dom";
import PlayerDetail from "../components/PlayerDetail";

export default function PlayerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <PlayerDetail
      playerId={id}
      onBack={() => navigate(-1)}
      onSelectTeam={(teamId) => navigate(`/equipo/${teamId}`)}
    />
  );
}
