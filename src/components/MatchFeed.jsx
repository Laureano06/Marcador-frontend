# Marcador — frontend (React + Vite)

Versión en React del demo original. Mismo look, pero ahora con:

- Componentes separados (`LeagueTabs`, `MatchFeed`, `MatchCard`)
- Estado real con `useState`/`useEffect` en vez de manipular el DOM a mano
- Polling automático cada 30s contra el backend (`src/App.jsx`)
- Datos reales del backend en vez de JSON hardcodeado

```
src/
  api.js               → fetch al backend
  utils.js              → agrupar por día, formatear hora, color de escudo
  index.css             → todo el estilo (scoreboard theme)
  App.jsx                → estado, polling, orquesta todo
  components/
    LeagueTabs.jsx
    MatchFeed.jsx
    MatchCard.jsx
```

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

## Qué cambia respecto al HTML plano

| | HTML plano | React |
|---|---|---|
| Actualizar la vista | `innerHTML` a mano | el estado cambia, React re-renderiza solo |
| Agregar una página nueva | otro `.html` + copiar CSS/JS | otra ruta con React Router |
| Repetir la tarjeta de partido | copiar el bloque HTML | un componente (`MatchCard`) reutilizable |
| Polling | `setInterval` + `innerHTML` manual | `useEffect` + `setInterval`, el DOM se actualiza solo |

## Próximo paso natural

Si vas a sumar más páginas (detalle de partido, tabla de posiciones), este
es el momento de meter **React Router** (`npm install react-router-dom`) en
vez de seguir agregando todo dentro de `App.jsx`.
