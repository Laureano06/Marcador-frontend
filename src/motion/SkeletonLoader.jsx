// Shimmer con la MISMA forma que una tarjeta de partido real (dos
// escudos + nombre + score al centro) — nada de "layout jump" cuando el
// dato real reemplaza al skeleton, porque ocupa el mismo espacio. Es CSS
// puro (una animación de gradiente en background-position): no hace
// falta Motion para un loop ambiental infinito y esto es más barato en
// CPU/GPU que manejarlo con JS.
export function MatchCardSkeleton() {
  return (
    <div className="match skeleton-card" aria-hidden="true">
      <div className="match-top">
        <div className="side">
          <span className="skeleton skeleton-crest" />
          <span className="skeleton skeleton-name" />
        </div>
        <div className="center">
          <span className="skeleton skeleton-score" />
        </div>
        <div className="side away">
          <span className="skeleton skeleton-crest" />
          <span className="skeleton skeleton-name" />
        </div>
      </div>
    </div>
  );
}

// Grupo de skeletons con una barra de liga arriba, tal como se ve el
// feed real agrupado por competencia.
export function LeagueSkeletonGroup({ matchCount = 3 }) {
  return (
    <div className="skeleton-group">
      <div className="league-bar">
        <span className="skeleton skeleton-league-name" />
      </div>
      {Array.from({ length: matchCount }).map((_, i) => (
        <MatchCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function SkeletonLoader({ groups = 3 }) {
  return (
    <div role="status" aria-label="Cargando partidos">
      {Array.from({ length: groups }).map((_, i) => (
        <LeagueSkeletonGroup key={i} matchCount={i === 0 ? 3 : 2} />
      ))}
    </div>
  );
}
