# Marcador — frontend (React + Vite + React Router)

```
src/
  api.js                 → fetch al backend
  utils.js                → agrupar por liga/fecha, formatear hora, color de escudo
  leagueCategories.js     → agrupa las ligas del feed por continente/juveniles/femenino
  index.css               → todo el estilo (scoreboard theme)
  App.jsx                 → rutas (React Router)
  Layout.jsx              → header, sidebar, buscador, y el fetch del feed del día
  useFavorites.js         → favoritos (equipos/ligas) en localStorage
  pages/
    DayFeedPage.jsx        → /fecha/:date
    TeamDetailPage.jsx     → /equipo/:id
    MatchDetailPage.jsx    → /partido/:id
  components/
    LeagueSidebar.jsx      → cajón de ligas por categoría
    MatchFeed.jsx, MatchCard.jsx
    TeamDetail.jsx, MatchDetail.jsx, LineupPitch.jsx
    SearchBar.jsx, DateStrip.jsx, FavoriteButton.jsx
```

No hay tabla de posiciones ni "partidos de una liga por temporada": el
plan free de API-Football no da acceso a esos endpoints para la
temporada actual (ver el README del backend). El sidebar de ligas
filtra el feed del día ya cargado, no navega a una página aparte.

## Cómo correrlo

Necesitás el backend (`marcador-backend`) corriendo en paralelo — este
frontend le pega a `http://localhost:3001` por default.

```bash
npm install
npm run dev
```

Abre en `http://localhost:5173`.

Si tu backend corre en otro puerto/host, copiá `.env.example` a `.env` y
cambiá `VITE_API_BASE`.

## Build de producción

```bash
npm run build
```

Genera `dist/`, listo para servir estático (Vercel, Netlify, Nginx, etc.)
