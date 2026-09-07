import { useEffect } from "react";

// Injerta un <script type="application/ld+json"> dinámico en <head> con
// los datos de la página actual, y lo saca al desmontar/cambiar. El
// script estático de index.html describe el SITIO (WebApplication) — este
// hook describe el CONTENIDO de cada pantalla (partidos del día, un
// partido puntual), así un crawler que ejecuta JS (Googlebot sí lo hace)
// puede entender qué hay en esta URL puntual, no solo que existe una app.
//
// No ayuda a las previews de compartir (WhatsApp/Twitter no ejecutan JS,
// ver useDocumentMeta.js) — es señal para indexación/rich results, no
// para el link preview.
export function useStructuredData(data) {
  useEffect(() => {
    if (!data) return undefined;

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(data);
    document.head.appendChild(script);

    return () => script.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)]);
}
