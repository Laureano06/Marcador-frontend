export default function LeagueTabs({ leagues, active, onSelect }) {
  return (
    <div className="tabs">
      {leagues.map((league) => (
        <button
          key={league}
          className={"tab" + (league === active ? " active" : "")}
          onClick={() => onSelect(league)}
        >
          {league}
        </button>
      ))}
    </div>
  );
}
