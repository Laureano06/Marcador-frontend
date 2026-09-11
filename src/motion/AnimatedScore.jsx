import { AnimatePresence, motion } from "motion/react";

// El marcador de un partido es un salto discreto (0, 1, 2…), no algo
// para interpolar número a número — se ve mejor como un crossfade: el
// valor viejo sale, el nuevo entra con un pequeño impulso de escala.
// `initial={false}` en AnimatePresence es a propósito: el PRIMER render
// (la carga inicial de la pantalla) no debe animar, solo los cambios
// posteriores — es decir, un gol de verdad, no "el marcador acaba de
// aparecer en pantalla".
//
// El contenedor usa CSS grid con una sola celda (gridArea "1/1") para
// que el número saliente y el entrante se superpongan durante la
// transición sin empujar el layout de al lado.
export default function AnimatedScore({ value, className }) {
  return (
    <span className={"animated-score" + (className ? ` ${className}` : "")}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          className="animated-score-value"
          initial={{ opacity: 0, y: -10, scale: 0.75 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.75 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
