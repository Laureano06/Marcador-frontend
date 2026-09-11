import { useState } from "react";
import { crestColor } from "../utils";

// Mismo patrón que el escudo de equipo (MatchCard.jsx's Crest): si hay
// foto la mostramos, si falla al cargar (o nunca hubo URL) caemos a un
// círculo con las iniciales — nunca una imagen rota, nunca un hueco
// vacío. Reusado en TODOS lados donde aparezca un jugador (alineaciones,
// plantel, eventos del partido, goleadores) para que la identidad visual
// sea consistente en toda la app.
export default function PlayerFace({ photo, name, size = "md" }) {
  const [failed, setFailed] = useState(false);
  const initials = (name || "?").slice(0, 2).toUpperCase();

  if (photo && !failed) {
    return (
      <span className={"player-face player-face-" + size}>
        <img src={photo} alt="" loading="lazy" onError={() => setFailed(true)} />
      </span>
    );
  }

  return (
    <span
      className={"player-face player-face-" + size + " player-face-fallback"}
      style={{ background: crestColor(name || "?") }}
    >
      {initials}
    </span>
  );
}
