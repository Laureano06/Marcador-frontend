// Sistema de iconos propio del sistema de diseño: trazo consistente
// (stroke 1.75, round caps), currentColor para heredar el estado de color
// de cada botón (activo/hover) sin código extra. Reemplaza los glifos
// unicode que se usaban antes (☰ ✕ ‹ › ▾ ★ ☆) — mismo tamaño/posición,
// ahora dibujados en vez de tipografiados.

const base = {
  width: "1em",
  height: "1em",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
  focusable: "false",
};

export function HamburgerIcon(props) {
  return (
    <svg {...base} {...props}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

export function CloseIcon(props) {
  return (
    <svg {...base} {...props}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

export function ChevronDownIcon(props) {
  return (
    <svg {...base} {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function ChevronLeftIcon(props) {
  return (
    <svg {...base} {...props}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function ChevronRightIcon(props) {
  return (
    <svg {...base} {...props}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function ArrowRightIcon(props) {
  return (
    <svg {...base} {...props}>
      <line x1="4" y1="12" x2="20" y2="12" />
      <polyline points="14 6 20 12 14 18" />
    </svg>
  );
}

export function DownloadIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v12" />
      <polyline points="7 10 12 15 17 10" />
      <path d="M4 19h16" />
    </svg>
  );
}

export function SearchIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.5" y2="16.5" />
    </svg>
  );
}

export function StarIcon({ active, ...props }) {
  return (
    <svg
      {...base}
      fill={active ? "currentColor" : "none"}
      {...props}
    >
      <polygon points="12 2.5 15.09 8.97 22.18 10.02 17.09 14.98 18.29 22.03 12 18.7 5.71 22.03 6.91 14.98 1.82 10.02 8.91 8.97" />
    </svg>
  );
}

export function CheckBadgeIcon(props) {
  return (
    <svg {...base} fill="currentColor" stroke="none" {...props}>
      <path d="M12 2 14.4 4.1 17.5 3.6 18.4 6.6 21.4 7.5 20.9 10.6 23 13 20.9 15.4 21.4 18.5 18.4 19.4 17.5 22.4 14.4 21.9 12 24 9.6 21.9 6.5 22.4 5.6 19.4 2.6 18.5 3.1 15.4 1 13 3.1 10.6 2.6 7.5 5.6 6.6 6.5 3.6 9.6 4.1 12 2Z" />
      <polyline
        points="8.5 12.5 11 15 15.5 9.5"
        fill="none"
        stroke="var(--bg-card, #182339)"
        strokeWidth="2"
      />
    </svg>
  );
}

export function PlayIcon(props) {
  return (
    <svg {...base} fill="currentColor" stroke="none" {...props}>
      <polygon points="9 6 19 12 9 18" />
    </svg>
  );
}
