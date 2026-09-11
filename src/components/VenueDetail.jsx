import { useCallback, useEffect, useState } from "react";
import { fetchVenueDetail } from "../api";
import TeamLink from "./TeamLink";
import { ChevronLeftIcon } from "./icons";
import { useDocumentMeta } from "../useDocumentMeta";

export default function VenueDetail({ venueId, onBack }) {
  const [venue, setVenue] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(() => {
    setStatus("loading");
    setVenue(null);
    fetchVenueDetail(venueId)
      .then((data) => {
        setVenue(data);
        setStatus("ok");
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage(err.message);
        setStatus("error");
      });
  }, [venueId]);

  useEffect(() => {
    load();
  }, [load]);

  useDocumentMeta({
    title: venue ? `${venue.name}: estadio | PARTIDOS` : "PARTIDOS",
    description: venue
      ? `Capacidad, ubicación y datos de ${venue.name}${venue.city ? ` en ${venue.city}` : ""} en PARTIDOS.`
      : undefined,
  });

  return (
    <div className="player-detail">
      <button className="back-btn" onClick={onBack}>
        <ChevronLeftIcon />Volver
      </button>

      {status === "loading" && <p className="empty">Cargando estadio…</p>}
      {status === "error" && (
        <div className="error-state">
          <p className="error-state-title">No pudimos cargar este estadio</p>
          <p className="error-state-subtitle">{errorMessage}</p>
          <button className="error-state-retry" onClick={load}>
            Reintentar
          </button>
        </div>
      )}

      {status === "ok" && venue && (
        <>
          <div className="player-header">
            <div className="referee-icon" aria-hidden="true">
              🏟️
            </div>
            <div className="player-header-info">
              <h1>{venue.name}</h1>
              <div className="player-header-meta">
                {venue.city && <span>{venue.city}</span>}
                {venue.country && <span>{venue.country}</span>}
                {venue.homeTeamId && (
                  <TeamLink teamId={venue.homeTeamId} className="player-header-team">
                    Ver equipo local
                  </TeamLink>
                )}
              </div>
            </div>
          </div>

          <div className="player-facts-grid">
            {venue.capacity != null && (
              <div className="player-fact">
                <span>Capacidad</span>
                <strong>{venue.capacity.toLocaleString("es-AR")}</strong>
              </div>
            )}
            {venue.builtYear != null && (
              <div className="player-fact">
                <span>Inaugurado</span>
                <strong>{venue.builtYear}</strong>
              </div>
            )}
            {venue.pitchLengthM != null && venue.pitchWidthM != null && (
              <div className="player-fact">
                <span>Cancha</span>
                <strong>{venue.pitchLengthM} × {venue.pitchWidthM} m</strong>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
