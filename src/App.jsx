import { Routes, Route, Navigate } from "react-router-dom";
import { toDateKey } from "./utils";
import Layout from "./Layout";
import DayFeedPage from "./pages/DayFeedPage";
import TeamDetailPage from "./pages/TeamDetailPage";
import MatchDetailPage from "./pages/MatchDetailPage";
import PlayerDetailPage from "./pages/PlayerDetailPage";
import CompetitionDetailPage from "./pages/CompetitionDetailPage";

const todayKey = toDateKey(new Date());

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to={`/fecha/${todayKey}`} replace />} />
        <Route path="fecha/:date" element={<DayFeedPage />} />
        <Route path="equipo/:id" element={<TeamDetailPage />} />
        <Route path="partido/:id" element={<MatchDetailPage />} />
        <Route path="jugador/:id" element={<PlayerDetailPage />} />
        <Route path="competicion/:id" element={<CompetitionDetailPage />} />
        <Route path="*" element={<Navigate to={`/fecha/${todayKey}`} replace />} />
      </Route>
    </Routes>
  );
}
