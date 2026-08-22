import { useEffect, useState } from "react";
import { Outlet, useNavigate, useMatch } from "react-router-dom";
import { fetchLeagues } from "./api";
import { toDateKey, addDays } from "./utils";
import { useFavorites } from "./useFavorites";
import LeagueSidebar from "./components/LeagueSidebar";
import SearchBar from "./components/SearchBar";
import DateStrip from "./components/DateStrip";

export default function Layout() {
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const favorites = useFavorites();

  // Solo en la ruta del feed por día mostramos el paginador de fechas —
  // en cualquier otra ruta (equipo, liga, partido) no tiene sentido.
  const dayMatch = useMatch("/fecha/:date");
  const activeDate = dayMatch?.params.date;

  const leagueMatch = useMatch("/liga/:slug");
  const activeLeagueSlug = leagueMatch?.params.slug;

  useEffect(() => {
    fetchLeagues()
      .then(setLeagues)
      .catch((err) => console.error("No se pudo cargar la lista de ligas", err));
  }, []);

  const goHome = () => navigate(`/fecha/${toDateKey(new Date())}`);
  const openLeague = (slug) => navigate(`/liga/${slug}`);
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
        leagues={leagues}
        activeSlug={activeLeagueSlug}
        onSelect={openLeague}
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

        <Outlet context={{ leagues, onlyFavorites, ...favorites }} />
      </div>
    </div>
  );
}
