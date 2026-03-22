import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

import { feature0AnalysisApiPlugin } from './vite-plugins/feature0AnalysisApiPlugin'

/**
 * Dev / preview: POST `/api/feature0/...` via plugin (sense backend extern).
 * Build estàtic: sense middleware (nginx només serveix assets).
 * QAE (pas 4): servidor HTTP separat `npm run dev:qae-api` — veure `scripts/qaeLocalApiServer.ts`
 * (el graf OCR + `@/` no es pot carregar al bundle del config de Vite sense trencar `vite build`).
 */
export default defineConfig(({ command, mode }) => {
  if (command !== 'build') {
    const fromFiles = loadEnv(mode, path.resolve(__dirname), '')
    for (const [key, value] of Object.entries(fromFiles)) {
      if (process.env[key] === undefined) {
        process.env[key] = value
      }
    }
  }

  return {
    plugins: [react(), ...(command === 'build' ? [] : [feature0AnalysisApiPlugin()])],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
