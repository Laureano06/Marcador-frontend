import { useParams, useNavigate } from "react-router-dom";
import VenueDetail from "../components/VenueDetail";

export default function VenueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return <VenueDetail venueId={id} onBack={() => navigate(-1)} />;
}
