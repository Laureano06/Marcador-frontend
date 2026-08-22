import { useParams, useNavigate } from "react-router-dom";
import MatchDetail from "../components/MatchDetail";

export default function MatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return <MatchDetail matchId={id} onBack={() => navigate(-1)} />;
}
