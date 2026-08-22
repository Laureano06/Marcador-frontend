import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { fetchDay } from "../api";
import { addDays, labelForDate } from "../utils";
import MatchFeed from "../components/MatchFeed";

const POLL_MS = 60000;
const SWIPE_THRESHOLD_PX = 60;

export default function DayFeedPage() {
  const { date } = useParams();
  const navigate = useNavigate();
  const {
    onlyFavorites,
    isTeamFavorite,
    isLeagueFavorite,
    toggleTeam,
    toggleLeague,
  } = useOutletContext();

  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  // "left" | "right" | null — de qué lado entra la animación, detectado
  // comparando la fecha nueva con la anterior (funciona tanto con swipe
  // como con el botón atrás/adelante del navegador).
  const [slideDir, setSlideDir] = useState(null);
  const prevDateRef = useRef(date);

  const touchStartX = useRef(null);

  useEffect(() => {
    const prev = prevDateRef.current;
    if (prev !== date) {
      // Comparación de strings "YYYY-MM-DD" funciona como comparación
      // cronológica directamente.
      setSlideDir(date > prev ? "left" : "right");
      prevDateRef.current = date;
    }
  }, [date]);

  const load = useCallback(async (dateKey) => {
    try {
      const { matches } = await fetchDay(dateKey);
      setMatches(matches);
      setStatus("ok");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    setStatus("loading");
    load(date);
  }, [date, load]);

  useEffect(() => {
    const id = setInterval(() => load(date), POLL_MS);
    return () => clearInterval(id);
  }, [date, load]);

  const goNext = () => navigate(`/fecha/${addDays(date, 1)}`);
  const goPrev = () => navigate(`/fecha/${addDays(date, -1)}`);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta <= -SWIPE_THRESHOLD_PX) goNext();
    else if (delta >= SWIPE_THRESHOLD_PX) goPrev();
    touchStartX.current = null;
  };

  return (
    <>
      <div
        className="feed-viewport"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          key={date}
          className={
            "feed-slide" +
            (slideDir === "left" ? " from-right" : "") +
            (slideDir === "right" ? " from-left" : "")
          }
        >
          <div className="day-heading">{labelForDate(date)}</div>

          {status === "error" && (
            <p className="error-banner">
              No pude conectar con el backend. ¿Está corriendo la API?
            </p>
          )}
          {status === "loading" && <p className="empty">Cargando partidos…</p>}
          {status === "ok" && (
            <MatchFeed
              matches={matches}
              onSelectTeam={(id) => navigate(`/equipo/${id}`)}
              onSelectMatch={(match) => navigate(`/partido/${match.id}`)}
              isLeagueFavorite={isLeagueFavorite}
              onToggleLeague={toggleLeague}
              isTeamFavorite={isTeamFavorite}
              onToggleTeam={toggleTeam}
              onlyFavorites={onlyFavorites}
            />
          )}
        </div>
      </div>

      <footer>Deslizá a los costados (o usá las flechas) para cambiar de día.</footer>
    </>
  );
}
