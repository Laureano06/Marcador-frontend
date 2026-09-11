import { Link } from "react-router-dom";

// Punto único de navegación a un jugador — todo lo que en la app
// muestra un nombre de jugador con un id estable pasa por acá, así el
// link a /jugador/:id nunca se reimplementa distinto en cada lugar (ver
// PARTIDOS: alineaciones, eventos del partido, plantel, goleadores...).
// Sin id (dato viejo, o el jugador todavía no tiene id en BSD) renderiza
// un <span> plano en vez de un link roto — degradación explícita, nunca
// un href a ningún lado.
export default function PlayerLink({ playerId, children, className = "", ...props }) {
  if (!playerId) {
    return (
      <span className={className} {...props}>
        {children}
      </span>
    );
  }

  return (
    <Link
      to={`/jugador/${playerId}`}
      className={"player-link" + (className ? ` ${className}` : "")}
      {...props}
    >
      {children}
    </Link>
  );
}
