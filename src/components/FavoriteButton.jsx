import { motion } from "motion/react";
import { StarIcon } from "./icons";

export default function FavoriteButton({ active, onClick, size = "md" }) {
  return (
    <motion.button
      className={"fav-btn" + (active ? " active" : "") + (size === "lg" ? " lg" : "")}
      onClick={(e) => {
        e.stopPropagation(); // para que no dispare el click del partido/equipo debajo
        onClick();
      }}
      aria-label={active ? "Quitar de favoritos" : "Agregar a favoritos"}
      title={active ? "Quitar de favoritos" : "Agregar a favoritos"}
      whileTap={{ scale: 0.8 }}
      animate={{ scale: active ? [1, 1.35, 1] : 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <StarIcon active={active} />
    </motion.button>
  );
}
