import { useEffect, useState, useCallback, useRef } from "react";
import { fetchDay, fetchLeagues } from "./api";
import { toDateKey, addDays, labelForDate } from "./utils";
import { useFavorites } from "./useFavorites";
import DateStrip from "./components/DateStrip";
import MatchFeed from "./components/MatchFeed";
import SearchBar from "./components/SearchBar";
import TeamDetail from "./components/TeamDetail";
import LeagueSidebar from "./components/LeagueSidebar";
import LeaguePage from "./components/LeaguePage";
import MatchDetail from "./components/MatchDetail";

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
  // Panel lateral de ligas + la liga que se esté viendo (tabla + partidos).
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  // Partido puntual seleccionado (estadísticas + alineación). Tiene
  // prioridad sobre todo lo demás: se puede abrir desde el feed del día,
  // desde la página de una liga, o (más adelante) desde donde sea.
  const [selectedMatch, setSelectedMatch] = useState(null); // { id }

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

  // La lista de ligas para el panel lateral se pide una sola vez.
  useEffect(() => {
    fetchLeagues()
      .then(setLeagues)
      .catch((err) => console.error("No se pudo cargar la lista de ligas", err));
  }, []);

  const goTo = (dateKey, dir) => {
    setSlideDir(dir);
    setActiveDate(dateKey);
  };

  const goNext = () => goTo(addDays(activeDate, 1), "left");
  const goPrev = () => goTo(addDays(activeDate, -1), "right");

  const openLeague = (slug) => {
    const league = leagues.find((l) => l.slug === slug);
    if (!league) return;
    setSelectedTeamId(null);
    setSelectedMatch(null);
    setSelectedLeague(league);
  };

  const openMatch = (match) => {
    setSelectedMatch({ id: match.id });
  };

  const goHome = () => {
    setSelectedTeamId(null);
    setSelectedLeague(null);
    setSelectedMatch(null);
  };

  // --- Gestos táctiles: deslizar para cambiar de día ---
  // (deshabilitado fuera del feed principal de partidos por día)
  const swipeEnabled = !selectedTeamId && !selectedLeague && !selectedMatch;

  const handleTouchStart = (e) => {
    if (!swipeEnabled) return;
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (!swipeEnabled || touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta <= -SWIPE_THRESHOLD_PX) goNext();
    else if (delta >= SWIPE_THRESHOLD_PX) goPrev();
    touchStartX.current = null;
  };

  return (
    <div className="app-shell">
      <LeagueSidebar
        leagues={leagues}
        activeSlug={selectedLeague?.slug}
        onSelect={openLeague}
      />

      <div className="wrap">
        <header>
          <div className="logo-row">
            <button className="logo logo-btn" onClick={goHome}>
              <span className="dot" />
              MARCADOR
            </button>
            <button
              className={"fav-filter" + (onlyFavorites ? " active" : "")}
              onClick={() => setOnlyFavorites((v) => !v)}
              title="Mostrar solo mis favoritos"
            >
              ★ Favoritos
            </button>
          </div>

          <SearchBar onSelectTeam={setSelectedTeamId} />

          {!selectedTeamId && !selectedLeague && !selectedMatch && (
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

        {selectedMatch ? (
          <MatchDetail
            matchId={selectedMatch.id}
            onBack={() => setSelectedMatch(null)}
          />
        ) : selectedTeamId ? (
          <TeamDetail
            teamId={selectedTeamId}
            onBack={() => setSelectedTeamId(null)}
            onSelectTeam={setSelectedTeamId}
            isFavorite={isTeamFavorite(selectedTeamId)}
            onToggleFavorite={() => toggleTeam(selectedTeamId)}
          />
        ) : selectedLeague ? (
          <LeaguePage
            league={selectedLeague}
            onBack={() => setSelectedLeague(null)}
            onSelectTeam={setSelectedTeamId}
            onSelectMatch={openMatch}
            isTeamFavorite={isTeamFavorite}
            onToggleTeam={toggleTeam}
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
                    No pude conectar con el backend. ¿Está corriendo la API?
                  </p>
                )}
                {status === "loading" && <p className="empty">Cargando partidos…</p>}
                {status === "ok" && (
                  <MatchFeed
                    matches={matches}
                    onSelectTeam={setSelectedTeamId}
                    onSelectMatch={openMatch}
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
        )}
      </div>
    </div>
  );
}
