import { motion } from "motion/react";
import { slideInX } from "./variants";

// Como FadeIn, pero entrando desde un costado en vez de desde abajo —
// para elementos que tiene sentido leer como "deslizando a su lugar"
// (ej. el indicador activo del selector de fecha).
export default function SlideIn({ as: Component = motion.div, className, style, from = 24, children }) {
  return (
    <Component
      className={className}
      style={style}
      initial="hidden"
      animate="visible"
      variants={slideInX(from)}
    >
      {children}
    </Component>
  );
}
