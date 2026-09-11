import { Link } from "react-router-dom";

// Mismo criterio que PlayerLink: punto único de navegación a un equipo
// (/equipo/:id) para no reimplementar el link cada vez que aparece un
// nombre de equipo — tabla de posiciones, goleadores, etc.
export default function TeamLink({ teamId, children, className = "", ...props }) {
  if (!teamId) {
    return (
      <span className={className} {...props}>
        {children}
      </span>
    );
  }

  return (
    <Link
      to={`/equipo/${teamId}`}
      className={"team-link" + (className ? ` ${className}` : "")}
      {...props}
    >
      {children}
    </Link>
  );
}
