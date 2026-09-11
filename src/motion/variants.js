import { DURATION, EASE_OUT, SPRING } from "./tokens";

// Variants de Framer/Motion reusadas por los primitivos de este
// directorio. Centralizarlas acá (en vez de definirlas inline en cada
// componente) es lo que evita terminar con timings/curvas ligeramente
// distintos repartidos por todo el proyecto.

export const fadeInUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.section, ease: EASE_OUT } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.normal, ease: EASE_OUT } },
};

export const slideInX = (fromX = 24) => ({
  hidden: { opacity: 0, x: fromX },
  visible: { opacity: 1, x: 0, transition: { duration: DURATION.section, ease: EASE_OUT } },
});

// Arranca en 0.97 -> 1, no en 0.8 -> 1: la tarjeta de un partido no debe
// sentirse como que "aparece de la nada", solo un asentamiento sutil.
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.97, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: DURATION.section, ease: EASE_OUT } },
};

// Cascada entre hijos: 50ms de por medio, tal como se pidió. El padre no
// anima nada por sí mismo (no tiene "hidden"/"visible" propio con
// transform) — solo orquesta cuándo entra cada hijo.
export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.03 },
  },
};

// Hover/tap para tarjetas clickeables — el movimiento es deliberadamente
// chico (2px, no 8px) para que se sienta "clickeable", no "que salta".
export const hoverLift = {
  rest: { y: 0, scale: 1 },
  hover: { y: -2, scale: 1.006, transition: SPRING },
  tap: { scale: 0.985, transition: { duration: DURATION.fast } },
};
