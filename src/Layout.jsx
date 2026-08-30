import { useCallback, useEffect, useState } from "react";
import { Outlet, useNavigate, useMatch } from "react-router-dom";
import { fetchDay } from "./api";
import { toDateKey, addDays } from "./utils";
import { useFavorites } from "./useFavorites";
import LeagueSidebar from "./components/LeagueSidebar";
import SearchBar from "./components/SearchBar";
import DateStrip from "./components/DateStrip";

const POLL_MS = 60000;

export default function Layout() {
  const navigate = useNavigate();
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeLeague, setActiveLeague] = useState(null);

  const [matches, setMatches] = useState([]);
  const [matchesStatus, setMatchesStatus] = useState("loading"); // loading | ok | error
  // Si el backend no pudo pedirle nada nuevo a la API (cuota agotada,
  // caída) pero tenía algo cacheado, igual manda esos datos con
  // `stale: true` en vez de un error — así se lo hacemos saber al
  // usuario en vez de mostrar resultados posiblemente viejos como si
  // fueran al toque.
  const [staleMatches, setStaleMatches] = useState(false);

  const favorites = useFavorites();

  // Solo en la ruta del feed por día mostramos el paginador de fechas —
  // en cualquier otra ruta (equipo, partido) no tiene sentido. El sidebar
  // de ligas sí necesita SIEMPRE una fecha de referencia (así el usuario
  // ve categorías con contenido incluso mirando una ficha de equipo) —
  // por default usa hoy.
  const dayMatch = useMatch("/fecha/:date");
  const activeDate = dayMatch?.params.date;
  const feedDate = activeDate || toDateKey(new Date());

  const load = useCallback(async (dateKey) => {
    try {
      const { matches, stale } = await fetchDay(dateKey);
      setMatches(matches);
      setStaleMatches(!!stale);
      setMatchesStatus("ok");
    } catch (err) {
      console.error(err);
      setMatchesStatus("error");
    }
  }, []);

  useEffect(() => {
    setMatchesStatus("loading");
    setActiveLeague(null); // cambiar de día invalida el filtro de liga anterior
    load(feedDate);
  }, [feedDate, load]);

  useEffect(() => {
    const id = setInterval(() => load(feedDate), POLL_MS);
    return () => clearInterval(id);
  }, [feedDate, load]);

  const goHome = () => navigate(`/fecha/${toDateKey(new Date())}`);
  const openTeam = (id) => navigate(`/equipo/${id}`);

  return (
    <div className="app-shell">
      {/* El backdrop solo se ve (y solo existe en el DOM con la clase
          "visible") en mobile, cuando el cajón de ligas está abierto. */}
      <div
        className={"sidebar-backdrop" + (sidebarOpen ? " visible" : "")}
        onClick={() => setSidebarOpen(false)}
      />

      <LeagueSidebar
        matches={matches}
        activeLeague={activeLeague}
        onSelect={setActiveLeague}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="wrap">
        <header>
          <div className="logo-row">
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir ligas"
            >
              ☰
            </button>
            <button className="logo logo-btn" onClick={goHome}>
              <img className="logo-icon" src="/iconoPARTIDOS.png" alt="" />
              PARTIDOS
            </button>
            <button
              className={"fav-filter" + (onlyFavorites ? " active" : "")}
              onClick={() => setOnlyFavorites((v) => !v)}
              title="Mostrar solo mis favoritos"
            >
              ★ Favoritos
            </button>
          </div>

          <SearchBar onSelectTeam={openTeam} />

          {activeDate && (
            <div className="day-nav">
              <button
                className="day-arrow"
                onClick={() => navigate(`/fecha/${addDays(activeDate, -1)}`)}
                aria-label="Día anterior"
              >
                ‹
              </button>
              <DateStrip
                activeDate={activeDate}
                onSelect={(d) => navigate(`/fecha/${d}`)}
              />
              <button
                className="day-arrow"
                onClick={() => navigate(`/fecha/${addDays(activeDate, 1)}`)}
                aria-label="Día siguiente"
              >
                ›
              </button>
            </div>
          )}
        </header>

        <Outlet
          context={{
            matches,
            matchesStatus,
            staleMatches,
            reloadMatches: () => load(feedDate),
            onlyFavorites,
            activeLeague,
            onClearLeagueFilter: () => setActiveLeague(null),
            ...favorites,
          }}
        />
      </div>
    </div>
  );
}
