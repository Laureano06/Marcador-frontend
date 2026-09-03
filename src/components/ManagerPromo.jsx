import { ChevronRightIcon } from "./icons";

// Subdominio propio del juego (proyecto separado, deploy aparte — no
// comparte build ni código con PARTIDOS). Variable de entorno para poder
// apuntar a otro host sin tocar código; el valor por default es el
// subdominio previsto aunque todavía no esté deployado.
export const MANAGER_APP_URL =
  import.meta.env.VITE_MANAGER_URL || "https://manager.partidos.app";

function PromoMark({ size }) {
  return (
    <span className="promo-mark" style={{ width: size, height: size }} aria-hidden="true">
      PM
    </span>
  );
}

// Banner ancho, debajo del header — declara qué es y lleva afuera con un
// solo click. Vive en su propio dominio (juego aparte), por eso es un
// link real (target=_blank), no una ruta interna.
export function ManagerPromoBanner() {
  return (
    <a
      className="promo-banner"
      href={MANAGER_APP_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      <PromoMark size={44} />
      <span className="promo-banner-body">
        <span className="promo-banner-title">Jugá Partidos Manager</span>
        <span className="promo-banner-desc">
          Fichá, entrená y dirigí tu club — de la Primera C al título, temporada a temporada.
        </span>
      </span>
      <span className="promo-banner-cta">
        <span>Jugar</span> <ChevronRightIcon />
      </span>
    </a>
  );
}

// Misma promo, tarjeta vertical para el sidebar de ligas — mismo destino,
// mismo copy más corto, sin el botón separado (toda la tarjeta es el link).
export function ManagerPromoCard() {
  return (
    <a
      className="promo-card"
      href={MANAGER_APP_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      <PromoMark size={36} />
      <span className="promo-card-title">Jugá Partidos Manager</span>
      <span className="promo-card-desc">
        Dirigí tu club: fichajes, táctica y ascenso.
      </span>
    </a>
  );
}
