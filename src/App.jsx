import { Routes, Route, Navigate } from "react-router-dom";
import { toDateKey } from "./utils";
import Layout from "./Layout";
import DayFeedPage from "./pages/DayFeedPage";
import TeamDetailPage from "./pages/TeamDetailPage";
import LeaguePageRoute from "./pages/LeaguePageRoute";
import MatchDetailPage from "./pages/MatchDetailPage";

const todayKey = toDateKey(new Date());

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to={`/fecha/${todayKey}`} replace />} />
        <Route path="fecha/:date" element={<DayFeedPage />} />
        <Route path="equipo/:id" element={<TeamDetailPage />} />
        <Route path="liga/:slug" element={<LeaguePageRoute />} />
        <Route path="partido/:id" element={<MatchDetailPage />} />
        <Route path="*" element={<Navigate to={`/fecha/${todayKey}`} replace />} />
      </Route>
    </Routes>
  );
}
