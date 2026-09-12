// Gráfico de presión minuto a minuto: positivo = presión del local,
// negativo = del visitante (signo verificado contra un partido real
// lateral, ver dataSource.js del backend). Cada minuto pinta una sola
// barra de un solo lado — nunca las dos a la vez, porque el valor ya es
// la diferencia neta entre ambos equipos, no dos magnitudes separadas.
export default function MatchMomentum({ momentum, homeName, awayName }) {
  if (!momentum || momentum.length === 0) return null;

  const maxAbs = Math.max(50, ...momentum.map((p) => Math.abs(p.value)));

  return (
    <div className="team-section">
      <h2 className="team-section-title">Momentum</h2>
      <div className="momentum-chart">
        {momentum.map((p) => {
          const heightPct = (Math.abs(p.value) / maxAbs) * 100;
          const isHome = p.value >= 0;
          return (
            <div key={p.minute} className="momentum-col" title={`Minuto ${p.minute}`}>
              <div className="momentum-col-top">
                {isHome && <div className="momentum-bar-home" style={{ height: `${heightPct}%` }} />}
              </div>
              <div className="momentum-col-bottom">
                {!isHome && <div className="momentum-bar-away" style={{ height: `${heightPct}%` }} />}
              </div>
            </div>
          );
        })}
      </div>
      <div className="momentum-legend">
        <span className="momentum-legend-item">
          <span className="momentum-legend-dot momentum-legend-dot-home" />
          {homeName || "Local"}
        </span>
        <span className="momentum-legend-item">
          <span className="momentum-legend-dot momentum-legend-dot-away" />
          {awayName || "Visitante"}
        </span>
      </div>
    </div>
  );
}
