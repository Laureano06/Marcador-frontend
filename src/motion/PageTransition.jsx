import { motion } from "motion/react";
import { DURATION, EASE_OUT } from "./tokens";

// Transición corta entre pantallas (feed de un día -> ficha de equipo ->
// detalle de partido). Deliberadamente rápida (normal, no section): el
// sitio tiene que seguir sintiéndose instantáneo, esto es una textura de
// transición, no un "efecto".
export default function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: DURATION.normal, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
