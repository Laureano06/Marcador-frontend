import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";

// Interpola un número entre su valor anterior y el nuevo (para
// estadísticas: posesión, remates, puntos de tabla) — no para el
// marcador de un partido, que es un salto discreto de a uno y se ve
// mejor con un crossfade (ver AnimatedScore). No anima el primer
// render: solo cuando `value` cambia estando ya montado.
export default function AnimatedNumber({ value, className, format = Math.round, duration = 0.6 }) {
  const motionValue = useMotionValue(value);
  const display = useTransform(motionValue, (v) => format(v));
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, { duration, ease: [0.16, 1, 0.3, 1] });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <motion.span className={className}>{display}</motion.span>;
}
