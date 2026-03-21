import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/app/App'

import '@/app/app.css'

const el = document.getElementById('root')
if (!el) {
  throw new Error('Element #root no trobat')
}

createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
