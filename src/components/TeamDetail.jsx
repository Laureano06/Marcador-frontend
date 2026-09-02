import { useCallback, useEffect, useState } from "react";
import { fetchTeamProfile } from "../api";
import { crestColor } from "../utils";
import FavoriteButton from "./FavoriteButton";
import { ChevronLeftIcon } from "./icons";

const POSITION_ORDER = ["Goalkeepers", "Defenders", "Midfielders", "Forwards"];
const POSITION_LABEL = {
  Goalkeepers: "Arqueros",
  Defenders: "Defensores",
  Midfielders: "Mediocampistas",
  Forwards: "Delanteros",
};

function groupSquadByPosition(squad) {
  const groups = {};
  for (const p of squad) {
    const key = p.position || "Otros";
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }
  return Object.entries(groups).sort(
    (a, b) => POSITION_ORDER.indexOf(a[0]) - POSITION_ORDER.indexOf(b[0])
  );
}

export default function TeamDetail({ teamId, onBack, isFavorite, onToggleFavorite }) {
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(() => {
    setStatus("loading");
    setProfile(null);
    fetchTeamProfile(teamId)
      .then((data) => {
        setProfile(data);
        setStatus("ok");
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage(err.message);
        setStatus("error");
      });
  }, [teamId]);

  useEffect(() => {
    load();
  }, [load]);

  // "Impronta" del club: no todos tienen colores de marca cargados en la
  // API, así que usamos el mismo hash de color que ya se usa como
  // fallback del escudo — cada club se ve siempre con SU color, estable
  // entre visitas, sin depender de un dato que puede faltar.
  const identityColor = profile ? crestColor(profile.name) : null;

  return (
    <div className="team-detail">
      <button className="back-btn" onClick={onBack}>
        <ChevronLeftIcon />Volver
      </button>

      {status === "loading" && <p className="empty">Cargando equipo…</p>}
      {status === "error" && (
        <div className="error-state">
          <p className="error-state-title">No pudimos cargar este equipo</p>
          <p className="error-state-subtitle">{errorMessage}</p>
          <button className="error-state-retry" onClick={load}>
            Reintentar
          </button>
        </div>
      )}

      {status === "ok" && profile?.stale && (
        <div className="stale-banner">
          Mostrando datos guardados — se alcanzó el límite diario de la API.
        </div>
      )}

      {status === "ok" && profile && (
        <>
          <div
            className="team-header"
            style={{ "--identity-color": identityColor }}
          >
            {profile.crest && (
              <div className="team-header-crest">
                <img src={profile.crest} alt="" />
              </div>
            )}
            <div className="team-header-info">
              <div className="team-header-name-row">
                <h1>{profile.name}</h1>
                <FavoriteButton
                  active={isFavorite}
                  onClick={onToggleFavorite}
                  size="lg"
                />
              </div>
              {(profile.country || profile.founded) && (
                <div className="team-header-meta">
                  {profile.country}
                  {profile.founded ? ` · Fundado en ${profile.founded}` : ""}
                </div>
              )}
              {profile.venue?.name && (
                <div className="team-header-meta">
                  {profile.venue.name}
                  {profile.venue.city ? `, ${profile.venue.city}` : ""}
                  {profile.venue.capacity
                    ? ` · Capacidad ${profile.venue.capacity.toLocaleString("es-AR")}`
                    : ""}
                </div>
              )}
            </div>
          </div>

          {profile.squad.length > 0 && (
            <div className="team-section">
              <h2 className="team-section-title">Plantel</h2>
              {groupSquadByPosition(profile.squad).map(([position, players]) => (
                <div key={position}>
                  <div className="squad-position-label">
                    {POSITION_LABEL[position] || position}
                  </div>
                  <div className="squad-list">
                    {players.map((p) => (
                      <div key={p.id} className="squad-player">
                        <div className="squad-player-photo">
                          {p.photo && <img src={p.photo} alt="" loading="lazy" />}
                          {p.number != null && (
                            <span className="squad-player-number">{p.number}</span>
                          )}
                        </div>
                        <div className="squad-player-name">{p.name}</div>
                        {p.age != null && (
                          <div className="squad-player-age">{p.age} años</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
