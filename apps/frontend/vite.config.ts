import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { feature0AnalysisApiPlugin } from './vite-plugins/feature0AnalysisApiPlugin'

/**
 * Dev / preview: POST `/api/feature0/analysis` via plugin (sense backend extern).
 * Build estàtic: sense middleware (nginx només serveix assets).
 */
export default defineConfig(({ command }) => ({
  plugins: [react(), ...(command === 'build' ? [] : [feature0AnalysisApiPlugin()])],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}))
