import { useParams, useNavigate } from "react-router-dom";
import CompetitionDetail from "../components/CompetitionDetail";

export default function CompetitionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return <CompetitionDetail leagueId={id} onBack={() => navigate(-1)} />;
}
