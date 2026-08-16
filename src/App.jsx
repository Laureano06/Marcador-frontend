import { useEffect, useState, useCallback, useRef } from "react";
import { fetchDay } from "./api";
import { toDateKey, addDays, labelForDate } from "./utils";
import { useFavorites } from "./useFavorites";
import DateStrip from "./components/DateStrip";
import MatchFeed from "./components/MatchFeed";
import SearchBar from "./components/SearchBar";
import TeamDetail from "./components/TeamDetail";

const POLL_MS = 60000;
const SWIPE_THRESHOLD_PX = 60;

export default function App() {
  const [activeDate, setActiveDate] = useState(() => toDateKey(new Date()));
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  // "left" | "right" | null — controla hacia qué lado anima la transición
  const [slideDir, setSlideDir] = useState(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  // Si hay un equipo seleccionado, se muestra su ficha en vez del feed.
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  const touchStartX = useRef(null);

  const {
    isTeamFavorite,
    isLeagueFavorite,
    toggleTeam,
    toggleLeague,
  } = useFavorites();

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
    load(activeDate);
  }, [activeDate, load]);

  // Polling: repregunta al backend sin que el usuario recargue.
  useEffect(() => {
    const id = setInterval(() => load(activeDate), POLL_MS);
    return () => clearInterval(id);
  }, [activeDate, load]);

  const goTo = (dateKey, dir) => {
    setSlideDir(dir);
    setActiveDate(dateKey);
  };

  const goNext = () => goTo(addDays(activeDate, 1), "left");
  const goPrev = () => goTo(addDays(activeDate, -1), "right");

  // --- Gestos táctiles: deslizar para cambiar de día ---
  // (deshabilitado mientras se está viendo la ficha de un equipo)
  const handleTouchStart = (e) => {
    if (selectedTeamId) return;
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (selectedTeamId || touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta <= -SWIPE_THRESHOLD_PX) goNext();
    else if (delta >= SWIPE_THRESHOLD_PX) goPrev();
    touchStartX.current = null;
  };

  return (
    <div className="wrap">
      <header>
        <div className="logo-row">
          <div className="logo">
            <span className="dot" />
            PARTIDOS
          </div>
          <button
            className={"fav-filter" + (onlyFavorites ? " active" : "")}
            onClick={() => setOnlyFavorites((v) => !v)}
            title="Mostrar solo mis favoritos"
          >
            ★ FAVORITOS
          </button>
        </div>

        <SearchBar onSelectTeam={setSelectedTeamId} />

        {!selectedTeamId && (
          <div className="day-nav">
            <button className="day-arrow" onClick={goPrev} aria-label="Día anterior">
              ‹
            </button>
            <DateStrip activeDate={activeDate} onSelect={(d) => goTo(d, null)} />
            <button className="day-arrow" onClick={goNext} aria-label="Día siguiente">
              ›
            </button>
          </div>
        )}
      </header>

      {selectedTeamId ? (
        <TeamDetail
          teamId={selectedTeamId}
          onBack={() => setSelectedTeamId(null)}
          isFavorite={isTeamFavorite(selectedTeamId)}
          onToggleFavorite={() => toggleTeam(selectedTeamId)}
        />
      ) : (
        <>
          <div
            className="feed-viewport"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              key={activeDate}
              className={
                "feed-slide" +
                (slideDir === "left" ? " from-right" : "") +
                (slideDir === "right" ? " from-left" : "")
              }
            >
              <div className="day-heading">{labelForDate(activeDate)}</div>

              {status === "error" && (
                <p className="error-banner">
                 Solucionando errores...
                </p>
              )}
              {status === "loading" && <p className="empty">Cargando partidos…</p>}
              {status === "ok" && (
                <MatchFeed
                  matches={matches}
                  onSelectTeam={setSelectedTeamId}
                  isLeagueFavorite={isLeagueFavorite}
                  onToggleLeague={toggleLeague}
                  isTeamFavorite={isTeamFavorite}
                  onToggleTeam={toggleTeam}
                  onlyFavorites={onlyFavorites}
                />
              )}
            </div>
          </div>

           </>
      )}
    </div>
  );
}
