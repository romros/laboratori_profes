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
  const { hostname, port } = window.location
  // Vite dev corre al port 5173 (o similar); Docker/nginx serveix al 9088/9443/80/443.
  // Si el port és el del servidor QAE (8787) o Vite dev (5173), usa la URL directa al servidor Node.
  // En qualsevol altre cas (Docker/nginx), usa la URL relativa (nginx fa el proxy).
  const isViteDev =
    (hostname === 'localhost' || hostname === '127.0.0.1') &&
    (port === String(QAE_DEV_DEFAULT_PORT) || port === '5173' || port === '5174')
  if (isViteDev) {
    return `http://127.0.0.1:${QAE_DEV_DEFAULT_PORT}${QAE_API_PATH}`
  }
  // Docker / producció: nginx fa proxy invers, URL relativa al mateix origen
  return QAE_API_PATH
}
