import { useEffect, useState } from "react";
import { fetchTeamProfile } from "../api";
import FavoriteButton from "./FavoriteButton";

const POSITION_ORDER = ["Goalkeeper", "Defender", "Midfielder", "Attacker"];
const POSITION_LABEL = {
  Goalkeeper: "Arqueros",
  Defender: "Defensores",
  Midfielder: "Mediocampistas",
  Attacker: "Delanteros",
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

const RESULT_LABEL = { G: "G", E: "E", P: "P" };

export default function TeamDetail({ teamId, onBack, isFavorite, onToggleFavorite }) {
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | error

  useEffect(() => {
    setStatus("loading");
    setProfile(null);
    fetchTeamProfile(teamId)
      .then((data) => {
        setProfile(data);
        setStatus("ok");
      })
      .catch((err) => {
        console.error(err);
        setStatus("error");
      });
  }, [teamId]);

  return (
    <div className="team-detail">
      <button className="back-btn" onClick={onBack}>
        ‹ Volver
      </button>

      {status === "loading" && <p className="empty">Cargando equipo…</p>}
      {status === "error" && (
        <p className="error-banner">No se pudo cargar este equipo.</p>
      )}

      {status === "ok" && profile && (
        <>
          <div className="team-header">
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
              <div className="team-header-meta">
                {profile.country}
                {profile.founded ? ` · Fundado en ${profile.founded}` : ""}
              </div>
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

          {profile.recentForm.length > 0 && (
            <div className="team-section">
              <div className="team-section-title">Últimos partidos</div>
              <div className="form-strip">
                {profile.recentForm.map((m, i) => (
                  <div key={i} className={"form-chip result-" + m.result}>
                    {RESULT_LABEL[m.result]}
                  </div>
                ))}
              </div>
              <div className="form-list">
                {profile.recentForm.map((m, i) => (
                  <div key={i} className="form-row">
                    <span className={"form-badge result-" + m.result}>
                      {RESULT_LABEL[m.result]}
                    </span>
                    <span className="form-opponent">vs {m.opponent}</span>
                    <span className="form-score">
                      {m.goalsFor}-{m.goalsAgainst}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {profile.squad.length > 0 && (
            <div className="team-section">
              <div className="team-section-title">Plantel</div>
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
