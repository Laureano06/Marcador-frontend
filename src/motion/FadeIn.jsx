import { motion } from "motion/react";
import { fadeInUp } from "./variants";

// Entrada estándar de sección: opacidad + un desplazamiento vertical
// chico. `whileInView` con `once: true` dispara la animación la primera
// vez que el elemento entra en el viewport y no la repite al hacer
// scroll de vuelta — evitamos animar cosas fuera de pantalla sin razón
// (ver punto de performance del pedido original).
export default function FadeIn({ as: Component = motion.div, className, style, children }) {
  return (
    <Component
      className={className}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={fadeInUp}
    >
      {children}
    </Component>
  );
}
