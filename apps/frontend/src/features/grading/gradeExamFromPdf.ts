/**
 * Orquestrador E2E Feature 4 + Feature 3.
 *
 * Encapsula el pipeline complet:
 *   PDF → rasterització → OCR (PaddleVL) → mapping → grading
 *
 * Contracte:
 *   Input:  Buffer (PDF alumne) + AssessmentSpec + paràmetres grader
 *   Output: GradeExamFromPdfResult
 *
 * Invariants:
 *   - No modifica contracte de gradeExam ni buildTemplateMappedAnswers
 *   - sense API key → mapping-only (no crash)
 *   - engine-agnostic via opcions injectables
 */
import { rasterizePdfToPngPages } from '../../infrastructure/ocr/rasterizePdfToPngPages'
import { ocrPngBuffersWithPaddleVl } from '../../infrastructure/ocr/paddleVlOcrClient'
import { buildTemplateMappedAnswers } from '../template-answer-zones/services/buildTemplateMappedAnswers'
import { gradeExam } from '../answer-evaluator/services/gradeExam'
import type { TemplateQuestion } from '../template-anchor-detection/types'
import type { OcrPageLines } from '../template-answer-zones/types'
import type {
  AnswerForEvaluation,
  ExamEvaluationResult,
} from '../../domain/answer-evaluator/answerEvaluator.schema'
import type { AssessmentSpec } from '../../domain/assessment-spec/assessmentSpec.schema'
import type { TemplateMappedAnswersResult } from '../../domain/template-mapped-answers/templateMappedAnswers.schema'

// ─── Tipus públics ────────────────────────────────────────────────────────────

export type GradeExamFromPdfOptions = {
  /** URL del servei llama-server (PaddleVL). Default: VL_SERVER_URL env o http://localhost:8111/v1 */
  ocrServerUrl?: string
  /** Implementació fetch injectable (tests, entorns custom). */
  fetchImpl?: typeof fetch
  /** Callback de progrés OCR. */
  onOcrProgress?: (pageIndex: number, total: number) => void
  /** Identificador de l'alumne per al resultat. */
  studentId?: string
  /** Context del document per al grader (text enunciat). */
  examDocumentContext?: string
  /** Model LLM a usar al grader. */
  model?: string
  /** URL base de l'API LLM. */
  baseUrl?: string
}

/** Resultat del pipeline complet (mapping + grading). */
export type GradeExamFromPdfResult = {
  /** Temps totals en ms per fase. */
  timing: {
    rasterize_ms: number
    ocr_ms: number
    mapping_ms: number
    grading_ms: number
    total_ms: number
  }
  /** Resultat del mapping (sempre present). */
  mapping: TemplateMappedAnswersResult
  /** Resultat del grading. null si no hi ha API key (mapping-only). */
  grading: ExamEvaluationResult | null
  /** true si s'ha executat en mode mapping-only (sense API key). */
  mapping_only: boolean
}

// ─── Helpers privats ──────────────────────────────────────────────────────────

function toAnswerForEvaluation(q: {
  question_id: string
  is_detected: boolean
  answer_text_clean: string
  warnings: string[]
}): AnswerForEvaluation {
  if (!q.is_detected) {
    return { question_id: q.question_id, answer_text: '', ocr_status: 'not_detected' }
  }
  if (!q.answer_text_clean || q.answer_text_clean.trim().length === 0) {
    return { question_id: q.question_id, answer_text: '', ocr_status: 'empty' }
  }
  const ocr_status = q.warnings.includes('low_similarity')
    ? ('uncertain' as const)
    : ('ok' as const)
  return { question_id: q.question_id, answer_text: q.answer_text_clean, ocr_status }
}

// ─── Funció principal ─────────────────────────────────────────────────────────

/**
 * Pipeline complet: PDF alumne → correcció.
 *
 * @param pdfBuffer  Buffer del PDF de l'alumne
 * @param templateQuestions  Preguntes del template (per al mapping)
 * @param assessmentSpec  Especificació d'avaluació (per al grading)
 * @param apiKey  Clau API del LLM. Si és undefined → mapping-only
 * @param options  Opcions opcionals (URL serveis, callbacks, etc.)
 */
export async function gradeExamFromPdf(
  pdfBuffer: Buffer,
  templateQuestions: TemplateQuestion[],
  assessmentSpec: AssessmentSpec,
  apiKey: string | undefined,
  options: GradeExamFromPdfOptions = {},
): Promise<GradeExamFromPdfResult> {
  const t0 = Date.now()

  // ── Pas 1: Rasterització ──────────────────────────────────────────────────
  const t0_raster = Date.now()
  const pages = await rasterizePdfToPngPages(pdfBuffer)
  const rasterize_ms = Date.now() - t0_raster

  // ── Pas 2: OCR ───────────────────────────────────────────────────────────
  const t0_ocr = Date.now()
  const pngs = pages.map((p) => p.png)
  const ocrTexts = await ocrPngBuffersWithPaddleVl(pngs, {
    serverUrl: options.ocrServerUrl,
    fetchImpl: options.fetchImpl,
    onProgress: options.onOcrProgress,
  })
  const ocr_ms = Date.now() - t0_ocr

  const ocrPages: OcrPageLines[] = pages.map((p, i) => ({
    pageIndex: p.pageIndex,
    lines: (ocrTexts[i] ?? '').split('\n'),
  }))

  // ── Pas 3: Mapping ───────────────────────────────────────────────────────
  const t0_map = Date.now()
  const mapping = buildTemplateMappedAnswers(templateQuestions, ocrPages)
  const mapping_ms = Date.now() - t0_map

  // ── Pas 4: Grading (opcional) ────────────────────────────────────────────
  if (!apiKey) {
    return {
      timing: { rasterize_ms, ocr_ms, mapping_ms, grading_ms: 0, total_ms: Date.now() - t0 },
      mapping,
      grading: null,
      mapping_only: true,
    }
  }

  const answers: AnswerForEvaluation[] = mapping.questions.map(toAnswerForEvaluation)

  const t0_grade = Date.now()
  const grading = await gradeExam({
    student_id: options.studentId ?? 'unknown',
    assessment_spec: assessmentSpec,
    answers,
    exam_document_context: options.examDocumentContext,
    apiKey,
    baseUrl: options.baseUrl,
    model: options.model,
    fetchImpl: options.fetchImpl,
  })
  const grading_ms = Date.now() - t0_grade

  return {
    timing: { rasterize_ms, ocr_ms, mapping_ms, grading_ms, total_ms: Date.now() - t0 },
    mapping,
    grading,
    mapping_only: false,
  }
}
