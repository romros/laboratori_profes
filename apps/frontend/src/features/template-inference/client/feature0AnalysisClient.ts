import type { Feature0AnalysisResponse } from '@/features/template-inference/contracts/feature0AnalysisContract'

const ANALYSIS_PATH = '/api/feature0/analysis'

/**
 * Client mínim: encapsula el transport cap al route local (Vite middleware).
 * La UI no ha de cridar el handler directament.
 */
export async function analyzeFeature0(
  text: string,
  options?: { baseUrl?: string },
): Promise<Feature0AnalysisResponse> {
  const base = options?.baseUrl ?? ''
  const res = await fetch(`${base}${ANALYSIS_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

  const data: unknown = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err =
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : res.statusText
    throw new Error(err)
  }

  return data as Feature0AnalysisResponse
}
