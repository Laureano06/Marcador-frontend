import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, useMatch, useLocation } from "react-router-dom";
import { fetchDay } from "./api";
import { toDateKey, addDays } from "./utils";
import { useFavorites } from "./useFavorites";
import { useInstallPrompt } from "./useInstallPrompt";
import LeagueSidebar from "./components/LeagueSidebar";
import SearchBar from "./components/SearchBar";
import DateStrip from "./components/DateStrip";
import { HamburgerIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from "./components/icons";
import { PageTransition } from "./motion";

const POLL_MS = 60000;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeLeague, setActiveLeague] = useState(null);
  // Datos cacheados por el service worker (network-first) mientras el
  // dispositivo está offline se veían igual que datos frescos — nada
  // distinguía "sin conexión, mostrando cache" de "conectado, en vivo".
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  // Anuncio para lectores de pantalla en cada actualización del feed —
  // un solo resumen por refresh (no uno por partido/score cambiado, eso
  // sería su propio problema de "over-announcing").
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  const [matches, setMatches] = useState([]);
  const [matchesStatus, setMatchesStatus] = useState("loading"); // loading | ok | error
  // Si el backend no pudo pedirle nada nuevo a la API (cuota agotada,
  // caída) pero tenía algo cacheado, igual manda esos datos con
  // `stale: true` en vez de un error — así se lo hacemos saber al
  // usuario en vez de mostrar resultados posiblemente viejos como si
  // fueran al toque.
  const [staleMatches, setStaleMatches] = useState(false);

  const favorites = useFavorites();
  const { canInstall, promptInstall } = useInstallPrompt();

  // Solo en la ruta del feed por día mostramos el paginador de fechas —
  // en cualquier otra ruta (equipo, partido) no tiene sentido. El sidebar
  // de ligas sí necesita SIEMPRE una fecha de referencia (así el usuario
  // ve categorías con contenido incluso mirando una ficha de equipo) —
  // por default usa hoy.
  const dayMatch = useMatch("/fecha/:date");
  const activeDate = dayMatch?.params.date;
  const feedDate = activeDate || toDateKey(new Date());

  // No anunciamos la primera carga de cada fecha (es solo "la pantalla
  // apareció", no una actualización) — solo los refreshes del polling
  // sobre la MISMA fecha ya visible.
  const hasLoadedOnce = useRef(false);

  const load = useCallback(async (dateKey, { isRefresh = false } = {}) => {
    try {
      const { matches, stale } = await fetchDay(dateKey);
      setMatches(matches);
      setStaleMatches(!!stale);
      setMatchesStatus("ok");
      if (isRefresh) {
        setLiveAnnouncement(
          `Partidos actualizados${stale ? " (datos guardados)" : ""}.`
        );
      }
    } catch (err) {
      console.error(err);
      setMatchesStatus("error");
    }
  }, []);

  useEffect(() => {
    setMatchesStatus("loading");
    setActiveLeague(null); // cambiar de día invalida el filtro de liga anterior
    hasLoadedOnce.current = false;
    load(feedDate).then(() => {
      hasLoadedOnce.current = true;
    });
  }, [feedDate, load]);

  useEffect(() => {
    const id = setInterval(
      () => load(feedDate, { isRefresh: hasLoadedOnce.current }),
      POLL_MS
    );
    return () => clearInterval(id);
  }, [feedDate, load]);

  // Sin esto, un dispositivo sin conexión mostraba el mismo cache que uno
  // conectado viendo datos en vivo — no había ninguna señal de que lo que
  // se ve podría estar desactualizado por estar offline, no por cuota.
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const goHome = () => navigate(`/fecha/${toDateKey(new Date())}`);
  const openTeam = (id) => navigate(`/equipo/${id}`);
  const openPlayer = (id) => navigate(`/jugador/${id}`);

  // Transición de página SOLO entre TIPOS de pantalla distintos (feed de
  // un día -> ficha de equipo -> detalle de partido) — navegar entre
  // fechas dentro del feed usa su propia animación de swipe/slide
  // (DayFeedPage, pensada específicamente para eso); si esta transición
  // también se disparara ahí, las dos animaciones se pisarían. Por eso
  // toda "/fecha/*" comparte una sola key: para el feed, cambiar de
  // fecha NO cuenta como "cambiar de página".
  const pageKey = location.pathname.startsWith("/fecha/") ? "fecha" : location.pathname;

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Saltar al contenido
      </a>

      {/* El backdrop solo se ve (y solo existe en el DOM con la clase
          "visible") en mobile, cuando el cajón de ligas está abierto. */}
      <div
        className={"sidebar-backdrop" + (sidebarOpen ? " visible" : "")}
        onClick={() => setSidebarOpen(false)}
      />

      <LeagueSidebar
        matches={matches}
        matchesStatus={matchesStatus}
        activeLeague={activeLeague}
        onSelect={setActiveLeague}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        favorites={favorites.favorites}
        onSelectTeam={openTeam}
      />

      <div className="wrap">
        <header>
          <div className="logo-row">
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir ligas"
            >
              <HamburgerIcon />
            </button>
            <button className="logo logo-btn" onClick={goHome}>
              <img className="logo-icon" src="/iconoPARTIDOS.png" alt="" />
              PARTIDOS
            </button>

            {canInstall && (
              <button className="install-btn" onClick={promptInstall} aria-label="Instalar app">
                <DownloadIcon /> <span aria-hidden="true">Instalar app</span>
              </button>
            )}
          </div>

          <SearchBar onSelectTeam={openTeam} onSelectPlayer={openPlayer} />

          {activeDate && (
            <div className="day-nav">
              <button
                className="day-arrow"
                onClick={() => navigate(`/fecha/${addDays(activeDate, -1)}`)}
                aria-label="Día anterior"
              >
                <ChevronLeftIcon />
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
                <ChevronRightIcon />
              </button>
            </div>
          )}
        </header>

        {!isOnline && (
          <div className="offline-banner" role="status">
            Sin conexión — mostrando lo último guardado en el dispositivo.
          </div>
        )}

        {/* Anuncio no visual de cada refresh del feed — un resumen por
            actualización, no uno por partido, para no saturar de avisos
            a quien usa lector de pantalla. */}
        <span className="sr-only" role="status" aria-live="polite">
          {liveAnnouncement}
        </span>

        <main id="main-content">
          {/* Sin AnimatePresence a propósito: <Outlet> está conectado al
              contexto de ruteo de React Router — si AnimatePresence
              preserva el wrapper "saliente" para animar su salida, ese
              Outlet sigue montado y se re-resuelve a la ruta NUEVA de
              todos modos (confirmado en vivo: terminaba mostrando la
              página nueva duplicada, pegada en opacity:0). La solución
              correcta de raíz existe (pinnear el location con
              <Routes location={...}>) pero exige reestructurar el
              routing entero y arriesga romper el shell persistente
              (sidebar/header perderían su estado en cada navegación).
              Animar solo la ENTRADA (remount limpio con key={pageKey},
              sin intentar preservar la salida) da la mayor parte del
              pulido sin ese riesgo. */}
          <PageTransition key={pageKey}>
            <Outlet
              context={{
                matches,
                matchesStatus,
                staleMatches,
                reloadMatches: () => load(feedDate),
                activeLeague,
                onClearLeagueFilter: () => setActiveLeague(null),
                ...favorites,
              }}
            />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
