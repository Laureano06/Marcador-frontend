import { addDays, labelForDate } from "../utils";

const VISIBLE_OFFSETS = [-1, 0, 1, 2, 3];

export default function DateStrip({ activeDate, onSelect }) {
  return (
    <div className="date-strip">
      {VISIBLE_OFFSETS.map((offset) => {
        const key = addDays(activeDate, offset);
        const isActive = offset === 0;
        return (
          <button
            key={key}
            className={"date-chip" + (isActive ? " active" : "")}
            onClick={() => onSelect(key)}
          >
            {labelForDate(key)}
          </button>
        );
      })}
    </div>
  );
}
