/**
 * Constants del servidor QAE en desenvolupament (Node separat; veure `scripts/qaeLocalApiServer.ts`).
 * Centralitza path i valors per defecte perquè la UI no hardcodegi URLs escampades.
 */

/** Path de l’endpoint (sempre el mateix; la base URL és configurable). */
export const QAE_API_PATH = '/api/question-answer-extraction'

export const QAE_DEV_DEFAULT_HOST = '127.0.0.1'

export const QAE_DEV_DEFAULT_PORT = 8787

/** Port del procés `npm run dev:qae-api`. */
export const QAE_API_PORT_ENV = 'QAE_API_PORT'

/** Host d’escolta del procés Node (opcional). */
export const QAE_DEV_HOST_ENV = 'QAE_DEV_HOST'

/**
 * Base URL per defecte del navegador cap al servidor QAE (sense path).
 * Override a `.env.local` del frontend: `VITE_QAE_API_BASE_URL=http://127.0.0.1:8787`
 */
export const QAE_VITE_BASE_URL_ENV = 'VITE_QAE_API_BASE_URL'

export function buildQaeDevServerListenUrl(host: string, port: number): string {
  return `http://${host}:${port}${QAE_API_PATH}`
}
