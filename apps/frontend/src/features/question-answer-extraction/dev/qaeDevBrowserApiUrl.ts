/// <reference types="vite/client" />

/**
 * URL de l'API QAE per consum des del navegador.
 * Només importar des de codi que corre al client (no des de Node/tsx).
 */
import { QAE_API_PATH, QAE_DEV_DEFAULT_PORT } from './qaeDevServerConstants'

/**
 * URL `…/api/question-answer-extraction` per a `fetch` des de la UI.
 *
 * - Override explícit: `VITE_QAE_API_BASE_URL` (build Vite).
 * - **Docker (nginx proxy):** la URL és relativa al mateix origen (`/api/…`),
 *   funciona tant per HTTP com HTTPS sense mixed content ni ports extra.
 * - **Vite dev local (`npm run dev`):** detecta `localhost` i usa `http://127.0.0.1:8787`
 *   (cal `npm run dev:qae-api` al costat).
 */
export function getQaeApiUrlForBrowser(): string {
  const base = import.meta.env.VITE_QAE_API_BASE_URL?.trim()
  if (base) {
    return `${base.replace(/\/$/, '')}${QAE_API_PATH}`
  }
  if (typeof window === 'undefined') {
    return `http://127.0.0.1:${QAE_DEV_DEFAULT_PORT}${QAE_API_PATH}`
  }
  // Vite dev local: el servidor QAE corre en un port apart
  const { hostname } = window.location
  const isViteDev = hostname === 'localhost' || hostname === '127.0.0.1'
  if (isViteDev) {
    return `http://127.0.0.1:${QAE_DEV_DEFAULT_PORT}${QAE_API_PATH}`
  }
  // Docker / producció: nginx fa proxy invers, URL relativa al mateix origen
  return QAE_API_PATH
}
