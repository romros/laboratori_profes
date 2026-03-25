/**
 * HTTP route per al pipeline de correcció d'examen complet (Feature 4 + 3).
 *
 * POST /api/grade-exam
 *   Body: multipart/form-data, camp `file` (PDF)
 *   Retorna: GradeExamHttpSuccessBody | GradeExamHttpErrBody
 *
 * Nota MVP: template i assessmentSpec estan hardcoded (hospital-DAW).
 * En futures iteracions es podran passar per paràmetre o seleccionar via UI.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { IncomingMessage } from 'node:http'

import {
  parsePdfMultipartUpload,
  PdfMultipartParseError,
} from '../../../infrastructure/http/parsePdfMultipartUpload'
import { isLikelyPdfBuffer } from '../../../shared/pdf/isLikelyPdfBuffer'
import { gradeExamFromPdf } from '../gradeExamFromPdf'
import type { GradeExamFromPdfResult } from '../gradeExamFromPdf'
import type { TemplateQuestion } from '../../template-anchor-detection/types'
import type { AssessmentSpec } from '../../../domain/assessment-spec/assessmentSpec.schema'
import { hospitalDawExamDocumentContext } from '../../../../tests/fixtures/assessment-spec-builder/hospitalDawGolden'

// ─── Fixtures MVP (hardcoded — hospital DAW) ──────────────────────────────────

const TEMPLATE_PATH = resolve(
  process.cwd(),
  'tests/fixtures/template-anchor/template_hospital_daw.json',
)

const SPEC_PATH = resolve(
  process.cwd(),
  'tests/fixtures/assessment-spec-builder/hospitalDawGolden.enriched-output.json',
)

function loadFixtures(): { questions: TemplateQuestion[]; spec: AssessmentSpec } {
  const templateJson = JSON.parse(readFileSync(TEMPLATE_PATH, 'utf8')) as {
    questions: TemplateQuestion[]
  }
  const spec = JSON.parse(readFileSync(SPEC_PATH, 'utf8')) as AssessmentSpec
  return { questions: templateJson.questions, spec }
}

// ─── Tipus HTTP ───────────────────────────────────────────────────────────────

export type GradeExamHttpSuccessBody = {
  result: GradeExamFromPdfResult
}

export type GradeExamHttpErrBody = {
  error: { code: string; message: string }
}

export type GradeExamHttpOutcome =
  | { ok: true; status: 200; body: GradeExamHttpSuccessBody }
  | { ok: false; status: 400 | 413 | 500; body: GradeExamHttpErrBody }

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function executeGradeExamForPdfBuffer(buffer: Buffer): Promise<GradeExamHttpOutcome> {
  if (!isLikelyPdfBuffer(buffer)) {
    return {
      ok: false,
      status: 400,
      body: { error: { code: 'invalid_pdf', message: 'El fitxer no sembla un PDF vàlid.' } },
    }
  }

  try {
    const { questions, spec } = loadFixtures()
    const apiKey =
      process.env['ASSESSMENT_SPEC_OPENAI_API_KEY'] ??
      process.env['OPENAI_API_KEY'] ??
      process.env['FEATURE0_OPENAI_API_KEY']

    const result = await gradeExamFromPdf(buffer, questions, spec, apiKey, {
      ocrServerUrl: process.env['VL_SERVER_URL'],
      studentId: 'ui-upload',
      examDocumentContext: hospitalDawExamDocumentContext,
    })

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

export async function executeGradeExamFromHttpRequest(
  req: IncomingMessage,
): Promise<GradeExamHttpOutcome> {
  try {
    const { buffer } = await parsePdfMultipartUpload(req, { fieldName: 'file' })
    return executeGradeExamForPdfBuffer(buffer)
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
