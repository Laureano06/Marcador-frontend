export default function FavoriteButton({ active, onClick, size = "md" }) {
  return (
    <button
      className={"fav-btn" + (active ? " active" : "") + (size === "lg" ? " lg" : "")}
      onClick={(e) => {
        e.stopPropagation(); // para que no dispare el click del partido/equipo debajo
        onClick();
      }}
      aria-label={active ? "Quitar de favoritos" : "Agregar a favoritos"}
      title={active ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      {active ? "★" : "☆"}
    </button>
  );
}
