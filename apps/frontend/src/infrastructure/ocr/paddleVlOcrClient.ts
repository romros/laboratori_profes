/**
 * Client HTTP per al servei OCR fallback server-side (PaddleOCR-VL via llama.cpp).
 *
 * Fa una crida al servei `profes-ocr-vl-server` (llama-server, port 8111) per a
 * cada pàgina PNG i retorna el text OCR extret.
 *
 * Contracte:
 *   Input:  Buffer[] (pàgines PNG)
 *   Output: string[] (text per pàgina, un element per Buffer)
 *
 * Precondicions:
 *   - El servei llama-server ha d'estar en marxa (docker-compose.vl-gguf.yml)
 *   - `VL_SERVER_URL` (opcional) sobreescriu la URL per defecte
 *
 * Limitacions conegudes (Spike VL-GGUF):
 *   - ~15s/pàgina en CPU (AMD EPYC-Rome, 8 threads)
 *   - No persisteix dades: cada crida és independent
 *   - No reintents: si falla, retorna string buit per aquella pàgina
 */

const DEFAULT_SERVER_URL = process.env['VL_SERVER_URL'] ?? 'http://localhost:8111/v1'
const OCR_PROMPT = 'OCR:'
const MAX_TOKENS = 1200
const TEMPERATURE = 0
const REPEAT_PENALTY = 1.15

type LlamaServerChatResponse = {
  choices: Array<{ message: { content: string | null } }>
}

/**
 * OCR d'una sola pàgina PNG via llama-server (PaddleOCR-VL-1.5).
 * Retorna string buit si hi ha error.
 */
async function ocrSinglePngWithPaddleVl(
  pngBuffer: Buffer,
  serverUrl: string,
  fetchImpl: typeof fetch,
): Promise<string> {
  const b64 = pngBuffer.toString('base64')

  const body = {
    model: 'PaddleOCR-VL-1.5',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } },
          { type: 'text', text: OCR_PROMPT },
        ],
      },
    ],
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    repeat_penalty: REPEAT_PENALTY,
  }

  const res = await fetchImpl(`${serverUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`llama-server error ${res.status}: ${await res.text()}`)
  }

  const json = (await res.json()) as LlamaServerChatResponse
  return json.choices[0]?.message.content?.trim() ?? ''
}

/**
 * OCR de múltiples pàgines PNG via PaddleOCR-VL (servei server-side).
 *
 * Processa les pàgines seqüencialment per no saturar el servei CPU.
 * Si una pàgina falla, retorna string buit per aquella pàgina (no interromp la resta).
 */
export async function ocrPngBuffersWithPaddleVl(
  pngPages: Buffer[],
  options?: {
    serverUrl?: string
    fetchImpl?: typeof fetch
    onProgress?: (pageIndex: number, total: number) => void
  },
): Promise<string[]> {
  if (pngPages.length === 0) return []

  const serverUrl = options?.serverUrl ?? DEFAULT_SERVER_URL
  const fetchImpl = options?.fetchImpl ?? fetch

  const results: string[] = []

  for (let i = 0; i < pngPages.length; i++) {
    options?.onProgress?.(i, pngPages.length)
    const png = pngPages[i]
    if (!png) {
      results.push('')
      continue
    }
    try {
      const text = await ocrSinglePngWithPaddleVl(png, serverUrl, fetchImpl)
      results.push(text)
    } catch {
      results.push('')
    }
  }

  return results
}
