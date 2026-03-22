/// <reference types="vite/client" />

/**
 * URL completa de l’API QAE per consum des del navegador (Vite dev).
 * Només importar des de codi que corre al client (no des de Node/tsx).
 */
import { QAE_API_PATH, QAE_DEV_DEFAULT_PORT } from './qaeDevServerConstants'

/** URL completa `…/api/question-answer-extraction` per a `fetch` des de la UI en dev. */
export function getQaeApiUrlForBrowser(): string {
  const base = import.meta.env.VITE_QAE_API_BASE_URL?.trim()
  if (base) {
    return `${base.replace(/\/$/, '')}${QAE_API_PATH}`
  }
  return `http://127.0.0.1:${QAE_DEV_DEFAULT_PORT}${QAE_API_PATH}`
}
