import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { addDays, labelForDate } from "../utils";
import MatchFeed from "../components/MatchFeed";

const SWIPE_THRESHOLD_PX = 60;

export default function DayFeedPage() {
  const { date } = useParams();
  const navigate = useNavigate();
  const {
    matches,
    matchesStatus,
    reloadMatches,
    onlyFavorites,
    activeLeague,
    onClearLeagueFilter,
    isTeamFavorite,
    isLeagueFavorite,
    toggleTeam,
    toggleLeague,
  } = useOutletContext();

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

  const visibleMatches = activeLeague
    ? matches.filter((m) => m.league === activeLeague)
    : matches;

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

          {activeLeague && (
            <div className="league-filter-chip">
              <span>{activeLeague}</span>
              <button onClick={onClearLeagueFilter} aria-label="Quitar filtro">
                ✕
              </button>
            </div>
          )}

          {matchesStatus === "error" && (
            <div className="error-state">
              <p className="error-state-title">No pudimos cargar los partidos</p>
              <p className="error-state-subtitle">
                Puede ser algo pasajero — probá de nuevo en un momento.
              </p>
              <button className="error-state-retry" onClick={reloadMatches}>
                Reintentar
              </button>
            </div>
          )}
          {matchesStatus === "loading" && <p className="empty">Cargando partidos…</p>}
          {matchesStatus === "ok" && (
            <MatchFeed
              matches={visibleMatches}
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
