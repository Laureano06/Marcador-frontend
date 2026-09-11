import PlayerLink from "./PlayerLink";

// Línea de tiempo del partido — goles (con asistencia), tarjetas y
// cambios, más reciente primero (mismo orden en que ya vienen de la
// API). "period" (entretiempo/final) no tiene jugador asociado, se
// muestra como separador de sección en vez de una fila más.
function EventRow({ event }) {
  if (event.type === "period") {
    return (
      <li className="match-event-period">
        <span>{event.label}</span>
        <span className="match-event-period-score">
          {event.score.home} - {event.score.away}
        </span>
      </li>
    );
  }

  const minuteLabel = event.addedTime ? `${event.minute}+${event.addedTime}'` : `${event.minute}'`;

  return (
    <li className={"match-event-row match-event-" + (event.isHome ? "home" : "away")}>
      <span className="match-event-minute">{minuteLabel}</span>
      <span className="match-event-icon" aria-hidden="true">
        {event.type === "goal" && (event.goalType === "penalty" ? "🎯" : event.goalType === "own_goal" ? "⚽️(EP)" : "⚽")}
        {event.type === "card" && (event.cardType === "red" ? "🟥" : "🟨")}
        {event.type === "substitution" && "🔄"}
      </span>
      <span className="match-event-body">
        {event.type === "goal" && (
          <>
            <PlayerLink playerId={event.playerId} className="match-event-player">
              {event.player}
            </PlayerLink>
            {event.assist && <span className="match-event-detail">Asistencia: {event.assist}</span>}
            {event.goalType === "own_goal" && <span className="match-event-detail">En contra</span>}
            {event.goalType === "penalty" && <span className="match-event-detail">De penal</span>}
          </>
        )}
        {event.type === "card" && (
          <PlayerLink playerId={event.playerId} className="match-event-player">
            {event.player}
          </PlayerLink>
        )}
        {event.type === "substitution" && (
          <>
            <PlayerLink playerId={event.playerInId} className="match-event-player match-event-sub-in">
              ↑ {event.playerIn}
            </PlayerLink>
            <PlayerLink playerId={event.playerOutId} className="match-event-player match-event-sub-out">
              ↓ {event.playerOut}
            </PlayerLink>
          </>
        )}
      </span>
    </li>
  );
}

export default function MatchEvents({ events }) {
  if (!events || events.length === 0) return null;
  return (
    <ul className="match-events-list">
      {events.map((event, i) => (
        <EventRow key={i} event={event} />
      ))}
    </ul>
  );
}
