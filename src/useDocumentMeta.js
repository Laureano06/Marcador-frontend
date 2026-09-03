import { useEffect } from "react";

const SITE_ORIGIN = "https://www.partidos.com.ar";

// SEO por ruta: título de pestaña + <meta name="description"> +
// canonical, actualizados a mano en cada cambio de página. No hay
// react-helmet ni SSR acá (Vite + SPA client-rendered) — esto ayuda al
// título real de la pestaña y a lo que indexa un crawler que ejecuta JS
// (Googlebot sí lo hace), pero NO a las previews de compartir en
// WhatsApp/Twitter/Facebook: esos bots leen el HTML crudo antes de
// correr React, así que solo ven los meta OG/Twitter estáticos de
// index.html. Sería necesario prerender/SSR para que también varíen por
// ruta — fuera de alcance de este cambio.
export function useDocumentMeta({ title, description }) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute("content", description);
    }
    // El título cambia cada vez que cambia la entidad mostrada (otra
    // fecha, otro equipo, otro partido) aunque la ruta con React Router
    // sea "la misma" (/partido/:id) y el componente no desmonte — por
    // eso el canonical se actualiza acá adentro, atado a `title`, en vez
    // de en un efecto aparte que solo correría una vez al montar.
    const canonical = document.querySelector('link[rel="canonical"]');
    canonical?.setAttribute("href", `${SITE_ORIGIN}${window.location.pathname}`);
  }, [title, description]);
}
