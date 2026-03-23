/**
 * Endpoint de debugger intern: processa un PDF d'alumne pel pipeline complet
 * (OCR → verificació de match → anchors → rangs → text dels rangs) i retorna
 * tot el detall per inspecció visual a la UI de debug.
 *
 * NO és un endpoint de producte. Només per us intern del professor / debug.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { IncomingMessage } from 'node:http'

import {
  parsePdfMultipartUpload,
  PdfMultipartParseError,
} from '../../../infrastructure/http/parsePdfMultipartUpload'
import { isLikelyPdfBuffer } from '../../../shared/pdf/isLikelyPdfBuffer'
import { rasterizePdfToPngPages } from '../../../infrastructure/ocr/rasterizePdfToPngPages'
import { ocrPngBuffersWithTesseract } from '../../../infrastructure/ocr/tesseractOcrPng'
import { detectTemplateQuestionAnchors } from '../../template-anchor-detection/detectTemplateQuestionAnchors'
import { verifyScanMatchesTemplate } from '../../template-verification/verifyScanMatchesTemplate'
import { deriveAnswerZonesFromAnchors } from '../../template-answer-zones/deriveAnswerZonesFromAnchors'
import type { TemplateQuestion } from '../../template-anchor-detection/types'
import type { OcrPageLines } from '../../template-answer-zones/types'
import type { AnswerZoneRange } from '../../template-answer-zones/types'
import type { TemplateMatchVerification } from '../../template-verification/types'
import type { DetectedQuestionAnchor } from '../../template-anchor-detection/types'

const TEMPLATE_PATH = resolve(
  process.cwd(),
  'tests/fixtures/template-anchor/template_hospital_daw.json',
)

function loadTemplate(): { questions: TemplateQuestion[]; source: string } {
  const json = JSON.parse(readFileSync(TEMPLATE_PATH, 'utf8')) as {
    source?: string
    questions: TemplateQuestion[]
  }
  return { questions: json.questions, source: json.source ?? TEMPLATE_PATH }
}

export type ZoneDetail = AnswerZoneRange & {
  /** Text concatenat de les línies del rang (truncat a 500 chars). */
  zone_text: string
  /** Avís si l'anchor és compartit amb una altra pregunta (possible error de detecció). */
  shared_anchor_warning: boolean
}

export type AnchorDetail = DetectedQuestionAnchor & {
  /** true si no s'ha detectat */
  not_detected: boolean
  /** true si dues preguntes comparteixen el mateix anchor (possible error de detecció) */
  shared_anchor_warning: boolean
}

export type TemplateDebugResult = {
  template_source: string
  verification: TemplateMatchVerification
  anchors: AnchorDetail[]
  zones: ZoneDetail[]
  ocr_pages: { pageIndex: number; lineCount: number }[]
}

export type TemplateDebugHttpSuccessBody = {
  result: TemplateDebugResult
}

export type TemplateDebugHttpErrBody = {
  error: { code: string; message: string }
}

export type TemplateDebugHttpOutcome =
  | { ok: true; status: 200; body: TemplateDebugHttpSuccessBody }
  | { ok: false; status: 400 | 413 | 500; body: TemplateDebugHttpErrBody }

function extractZoneText(zone: AnswerZoneRange, ocrPages: OcrPageLines[]): string {
  const pageMap = new Map<number, OcrPageLines>()
  for (const p of ocrPages) pageMap.set(p.pageIndex, p)

  const lines: string[] = []
  if (zone.start_page_index === zone.end_page_index) {
    const page = pageMap.get(zone.start_page_index)
    if (page) {
      lines.push(...page.lines.slice(zone.start_line_index, zone.end_line_index + 1))
    }
  } else {
    const startPage = pageMap.get(zone.start_page_index)
    if (startPage) lines.push(...startPage.lines.slice(zone.start_line_index))
    for (const p of ocrPages) {
      if (p.pageIndex > zone.start_page_index && p.pageIndex < zone.end_page_index) {
        lines.push(...p.lines)
      }
    }
    const endPage = pageMap.get(zone.end_page_index)
    if (endPage) lines.push(...endPage.lines.slice(0, zone.end_line_index + 1))
  }

  return lines
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join('\n')
    .slice(0, 500)
}

export async function executeTemplateDebugForPdfBuffer(
  buffer: Buffer,
): Promise<TemplateDebugHttpOutcome> {
  if (!isLikelyPdfBuffer(buffer)) {
    return {
      ok: false,
      status: 400,
      body: { error: { code: 'invalid_pdf', message: 'El fitxer no sembla un PDF vàlid.' } },
    }
  }

  try {
    const { questions, source } = loadTemplate()
    const pages = await rasterizePdfToPngPages(buffer)
    const pngs = pages.map((p) => p.png)
    const ocrTexts = await ocrPngBuffersWithTesseract(pngs)

    const ocrPages: OcrPageLines[] = pages.map((p, i) => ({
      pageIndex: p.pageIndex,
      lines: (ocrTexts[i] ?? '').split('\n'),
    }))

    const ocrPagesFlat = ocrPages.map((p) => ({ pageIndex: p.pageIndex, text: p.lines.join('\n') }))
    const { detected, not_found } = detectTemplateQuestionAnchors(questions, ocrPagesFlat)
    const verification = verifyScanMatchesTemplate(questions, detected, not_found)
    const zonesResult = deriveAnswerZonesFromAnchors(questions, detected, ocrPages)

    // Detecta anchors compartits (dues preguntes amb la mateixa pàgina+línia)
    const anchorKeys = detected.map((a) => {
      const page = ocrPagesFlat.find((p) => p.pageIndex === a.page_index)
      const lineIdx = page ? page.text.split('\n').findIndex((l) => l.includes(a.matched_text)) : -1
      return `${a.page_index}:${lineIdx}`
    })
    const anchorKeyCounts = anchorKeys.reduce(
      (acc, k) => {
        acc[k] = (acc[k] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Construeix AnchorDetail per totes les preguntes del template
    const anchors: AnchorDetail[] = questions.map((q) => {
      const a = detected.find((d) => d.question_id === q.id)
      if (!a) {
        return {
          question_id: q.id,
          page_index: -1,
          matched_text: '',
          similarity: 0,
          not_detected: true,
          shared_anchor_warning: false,
        }
      }
      const idx = detected.indexOf(a)
      return {
        ...a,
        not_detected: false,
        shared_anchor_warning: (anchorKeyCounts[anchorKeys[idx] ?? ''] ?? 1) > 1,
      }
    })

    const zones: ZoneDetail[] = zonesResult.zones.map((z) => ({
      ...z,
      zone_text: extractZoneText(z, ocrPages),
      shared_anchor_warning:
        anchors.find((a) => a.question_id === z.question_id)?.shared_anchor_warning ?? false,
    }))

    const result: TemplateDebugResult = {
      template_source: source,
      verification,
      anchors,
      zones,
      ocr_pages: ocrPages.map((p) => ({ pageIndex: p.pageIndex, lineCount: p.lines.length })),
    }

    return { ok: true, status: 200, body: { result } }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return {
      ok: false,
      status: 500,
      body: { error: { code: 'processing_failed', message: `Error processant PDF: ${msg}` } },
    }
  }
}

export async function executeTemplateDebugFromHttpRequest(
  req: IncomingMessage,
): Promise<TemplateDebugHttpOutcome> {
  try {
    const { buffer } = await parsePdfMultipartUpload(req, { fieldName: 'file' })
    return executeTemplateDebugForPdfBuffer(buffer)
  } catch (e) {
    if (e instanceof PdfMultipartParseError) {
      return {
        ok: false,
        status: e.statusCode as 400 | 413,
        body: { error: { code: e.code, message: e.message } },
      }
    }
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, status: 500, body: { error: { code: 'internal_error', message: msg } } }
  }
}
