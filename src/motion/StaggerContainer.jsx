import { motion } from "motion/react";
import { staggerContainer } from "./variants";

// Orquesta la entrada en cascada de sus StaggerItem hijos (50ms entre
// uno y el siguiente). No anima nada visualmente por sí mismo — solo
// declara "visible" para que los hijos, que sí tienen su propia
// variant, disparen en orden.
export default function StaggerContainer({ as: Component = motion.div, className, style, children }) {
  return (
    <Component
      className={className}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={staggerContainer}
    >
      {children}
    </Component>
  );
}
