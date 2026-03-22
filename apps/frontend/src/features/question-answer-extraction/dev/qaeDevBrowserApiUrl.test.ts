import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { QAE_API_PATH } from './qaeDevServerConstants'

function setWindowLocation(protocol: string, hostname: string): void {
  vi.stubGlobal('window', {
    location: { protocol, hostname },
  })
}

describe('getQaeApiUrlForBrowser', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  beforeEach(() => {
    vi.resetModules()
  })

  it('respecta VITE_QAE_API_BASE_URL sense barra final', async () => {
    vi.stubEnv('VITE_QAE_API_BASE_URL', 'http://example.com:9999')
    setWindowLocation('http:', 'localhost')
    const { getQaeApiUrlForBrowser } = await import('./qaeDevBrowserApiUrl')
    expect(getQaeApiUrlForBrowser()).toBe(`http://example.com:9999${QAE_API_PATH}`)
  })

  it('localhost → 127.0.0.1:8787 (Vite dev local)', async () => {
    vi.stubEnv('VITE_QAE_API_BASE_URL', undefined as unknown as string)
    setWindowLocation('http:', 'localhost')
    const { getQaeApiUrlForBrowser } = await import('./qaeDevBrowserApiUrl')
    expect(getQaeApiUrlForBrowser()).toBe(`http://127.0.0.1:8787${QAE_API_PATH}`)
  })

  it('host remot HTTP → URL relativa (nginx proxy)', async () => {
    vi.stubEnv('VITE_QAE_API_BASE_URL', undefined as unknown as string)
    setWindowLocation('http:', '46.225.28.149')
    const { getQaeApiUrlForBrowser } = await import('./qaeDevBrowserApiUrl')
    expect(getQaeApiUrlForBrowser()).toBe(QAE_API_PATH)
  })

  it('host remot HTTPS → URL relativa (nginx proxy)', async () => {
    vi.stubEnv('VITE_QAE_API_BASE_URL', undefined as unknown as string)
    setWindowLocation('https:', '46.225.28.149')
    const { getQaeApiUrlForBrowser } = await import('./qaeDevBrowserApiUrl')
    expect(getQaeApiUrlForBrowser()).toBe(QAE_API_PATH)
  })

  it('sense window → 127.0.0.1 (SSR / Node)', async () => {
    vi.stubEnv('VITE_QAE_API_BASE_URL', undefined as unknown as string)
    vi.stubGlobal('window', undefined)
    const { getQaeApiUrlForBrowser } = await import('./qaeDevBrowserApiUrl')
    expect(getQaeApiUrlForBrowser()).toBe(`http://127.0.0.1:8787${QAE_API_PATH}`)
  })
})
