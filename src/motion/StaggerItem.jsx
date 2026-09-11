import { motion } from "motion/react";
import { scaleIn } from "./variants";

// Un ítem dentro de un StaggerContainer — hereda "hidden"/"visible" del
// padre (no dispara whileInView propio: si lo hiciera, cada tarjeta
// entraría en su propio momento de scroll en vez de en cascada
// coordinada por el padre).
export default function StaggerItem({ as: Component = motion.div, className, style, children, ...props }) {
  return (
    <Component className={className} style={style} variants={scaleIn} {...props}>
      {children}
    </Component>
  );
}
