import { useParams, useNavigate } from "react-router-dom";
import ManagerDetail from "../components/ManagerDetail";

export default function ManagerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return <ManagerDetail managerId={id} onBack={() => navigate(-1)} />;
}
