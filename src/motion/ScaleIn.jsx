import { motion } from "motion/react";
import { scaleIn } from "./variants";

// Fade + scale sutil (0.97 -> 1) + un pequeño desplazamiento vertical —
// el efecto de entrada de una tarjeta de partido individual. Se usa
// tanto suelto (ScaleIn) como orquestado en cascada (ver StaggerItem,
// que reusa la misma variant).
export default function ScaleIn({ as: Component = motion.div, className, style, children, ...props }) {
  return (
    <Component
      className={className}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={scaleIn}
      {...props}
    >
      {children}
    </Component>
  );
}
