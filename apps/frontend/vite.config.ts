import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

import { feature0AnalysisApiPlugin } from './vite-plugins/feature0AnalysisApiPlugin'

/**
 * Dev / preview: POST `/api/feature0/analysis` via plugin (sense backend extern).
 * Build estàtic: sense middleware (nginx només serveix assets).
 */
export default defineConfig(({ command, mode }) => {
  // Vite no omple `process.env` amb `.env*` per defecte; el middleware Feature 0 (Node) necessita la clau al servidor.
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
