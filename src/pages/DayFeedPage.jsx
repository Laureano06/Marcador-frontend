import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { addDays, labelForDate } from "../utils";
import MatchFeed from "../components/MatchFeed";
import { CloseIcon } from "../components/icons";

const SWIPE_THRESHOLD_PX = 60;

// Un solo control segmentado en vez de dos toggles independientes (antes:
// "Favoritos" vivía solo en el header, separado de cualquier filtro de
// liga) — mismo tipo de acción (filtrar la lista visible), un solo lugar
// para pensarlo. "vivo" y "favoritos" son mutuamente excluyentes con
// "todos", no acumulables entre sí — más simple de razonar que un feed
// que combina ambos silenciosamente.
const FEED_FILTERS = [
  { key: "todos", label: "Todos" },
  { key: "vivo", label: "En vivo" },
  { key: "favoritos", label: "Favoritos" },
];

export default function DayFeedPage() {
  const { date } = useParams();
  const navigate = useNavigate();
  const {
    matches,
    matchesStatus,
    staleMatches,
    reloadMatches,
    activeLeague,
    onClearLeagueFilter,
    isTeamFavorite,
    isLeagueFavorite,
    toggleTeam,
    toggleLeague,
  } = useOutletContext();

  const [feedFilter, setFeedFilter] = useState("todos");

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

  const leagueFiltered = activeLeague
    ? matches.filter((m) => m.league === activeLeague)
    : matches;

  const visibleMatches =
    feedFilter === "vivo"
      ? leagueFiltered.filter((m) => m.status === "live")
      : feedFilter === "favoritos"
      ? leagueFiltered.filter(
          (m) =>
            isLeagueFavorite(m.league) ||
            isTeamFavorite(m.homeId) ||
            isTeamFavorite(m.awayId)
        )
      : leagueFiltered;

  // El badge de cantidad describe SIEMPRE lo que hay debajo, nunca el
  // total sin filtrar — un número que no se mueve con el filtro activo es
  // tan engañoso como un contador de "urgencia" inventado, aunque no haya
  // intención de engañar a nadie.
  const countLabel =
    feedFilter === "vivo"
      ? `${visibleMatches.length} en vivo`
      : feedFilter === "favoritos"
      ? `${visibleMatches.length} de tus favoritos`
      : `${visibleMatches.length} partido${visibleMatches.length === 1 ? "" : "s"}`;

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
          <h1 className="day-heading">
            {labelForDate(date)}
            {matchesStatus === "ok" && (
              <span className="match-count"> · {countLabel}</span>
            )}
          </h1>

          <div
            className="feed-filter-group"
            role="radiogroup"
            aria-label="Filtrar partidos"
          >
            {FEED_FILTERS.map((f) => (
              <button
                key={f.key}
                role="radio"
                aria-checked={feedFilter === f.key}
                className={
                  "feed-filter-btn" + (feedFilter === f.key ? " active" : "")
                }
                onClick={() => setFeedFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {matchesStatus === "ok" && staleMatches && (
            <div className="stale-banner">
              Mostrando datos guardados — se alcanzó el límite diario de la
              API. Puede que falten resultados recientes.
            </div>
          )}

          {activeLeague && (
            <div className="league-filter-chip">
              <span>{activeLeague}</span>
              <button onClick={onClearLeagueFilter} aria-label="Quitar filtro">
                <CloseIcon />
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
              feedFilter={feedFilter}
              onShowAll={() => setFeedFilter("todos")}
            />
          )}
        </div>
      </div>

      <footer>Deslizá a los costados (o usá las flechas) para cambiar de día.</footer>
    </>
  );
}
