import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* reducedMotion="user": respeta prefers-reduced-motion del sistema
        operativo para TODOS los motion.* de la app en un solo lugar —
        quien lo tenga activado deja de recibir animaciones de transform
        (movimiento/escala), pero conserva las de opacidad (fades), que
        no marean ni distraen igual. No hace falta repetir este chequeo
        componente por componente. */}
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MotionConfig>
  </StrictMode>,
)

// Service worker solo en producción: en dev (npm run dev) registrar uno
// complica el hot-reload de Vite (cachearía módulos que cambian todo el
// tiempo) sin aportar nada, ya que en dev no hay nada que "instalar".
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('No se pudo registrar el service worker:', err)
    })
  })
}
