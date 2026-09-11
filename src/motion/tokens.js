// Timings y easings compartidos por todo el sistema de animación — un
// solo lugar para "qué tan rápido se mueve todo", así ningún componente
// inventa su propia duración suelta. Los rangos vienen del pedido
// original: 100-200ms interacciones rápidas, 200-400ms transiciones de
// UI, 400-700ms entradas de sección, 2-8s ambiental.
export const DURATION = {
  fast: 0.15,
  normal: 0.3,
  section: 0.55,
  ambient: 4,
};

// Spring suave para movimiento con "peso" (hover, entrada de tarjetas) —
// se siente más natural que un ease lineal/cúbico para elementos que el
// usuario puede tocar.
export const SPRING = { type: "spring", stiffness: 320, damping: 28, mass: 0.9 };

// Ease simple para fades/opacidad puros, donde un spring no aporta nada
// (no hay "rebote" que percibir en una opacidad).
export const EASE_OUT = [0.16, 1, 0.3, 1];
