import type { Feature0AnalysisResponse } from '@/features/template-inference/contracts/feature0AnalysisContract'

const ANALYSIS_PATH = '/api/feature0/analysis'
const ANALYSIS_LLM_PATH = '/api/feature0/analysis/llm'
const ANALYSIS_PDF_PATH = '/api/feature0/analysis/pdf'
const ANALYSIS_PDF_LLM_PATH = '/api/feature0/analysis/pdf/llm'

async function parseFeature0Response(res: Response): Promise<Feature0AnalysisResponse> {
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

async function postFeature0(
  path: string,
  text: string,
  baseUrl: string,
): Promise<Feature0AnalysisResponse> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  return parseFeature0Response(res)
}

/**
 * Client mínim: encapsula el transport cap al route local (Vite middleware).
 * La UI no ha de cridar el handler directament.
 */
export async function analyzeFeature0(
  text: string,
  options?: { baseUrl?: string },
): Promise<Feature0AnalysisResponse> {
  const base = options?.baseUrl ?? ''
  return postFeature0(ANALYSIS_PATH, text, base)
}

/** Mateix contracte; crida el model al servidor (cal `FEATURE0_OPENAI_API_KEY` o `OPENAI_API_KEY`). */
export async function analyzeFeature0WithLlm(
  text: string,
  options?: { baseUrl?: string },
): Promise<Feature0AnalysisResponse> {
  const base = options?.baseUrl ?? ''
  return postFeature0(ANALYSIS_LLM_PATH, text, base)
}

/**
 * Multipart amb camp `file` (PDF). Encapsula transport; la UI no construeix boundaries.
 */
export async function analyzeFeature0FromPdf(
  file: File,
  options?: { baseUrl?: string; llm?: boolean },
): Promise<Feature0AnalysisResponse> {
  const base = options?.baseUrl ?? ''
  const path = options?.llm ? ANALYSIS_PDF_LLM_PATH : ANALYSIS_PDF_PATH
  const body = new FormData()
  body.append('file', file)
  const res = await fetch(`${base}${path}`, { method: 'POST', body })
  return parseFeature0Response(res)
}
