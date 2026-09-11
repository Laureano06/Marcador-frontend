import { useParams, useNavigate } from "react-router-dom";
import RefereeDetail from "../components/RefereeDetail";

export default function RefereeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return <RefereeDetail refereeId={id} onBack={() => navigate(-1)} />;
}
