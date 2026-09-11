import { motion } from "motion/react";
import { hoverLift } from "./variants";

// Envoltorio fino sobre motion.div para cualquier tarjeta clickeable:
// reenvía TODAS las props (onClick, role, aria-*, etc.) para no romper
// nada de lo que ya tenía el elemento — solo agrega la reacción al
// hover/tap. El levantamiento es deliberadamente sutil (2px, no 8px):
// tiene que sentirse "clickeable", no "que salta".
export default function HoverCard({ className, children, ...props }) {
  return (
    <motion.div
      className={className}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      animate="rest"
      variants={hoverLift}
      {...props}
    >
      {children}
    </motion.div>
  );
}
