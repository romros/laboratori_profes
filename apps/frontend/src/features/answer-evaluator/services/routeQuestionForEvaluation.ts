import type { AnswerForEvaluation } from '../../../domain/answer-evaluator/answerEvaluator.schema'
import { detectSemanticOcrQuality } from './detectSemanticOcrQuality'

/**
 * Canal d'avaluació per a una pregunta.
 *
 * - 'text'   — text OCR prou fiable → cridar LLM amb el text
 * - 'vision' — reservat per quan hi hagi crops d'imatge (no implementat al MVP)
 * - 'skip'   — text i imatge insuficients → no avaluar, veredicte null
 */
export type EvaluationRoute = 'text' | 'vision' | 'skip'

export type EvaluationRoutingDecision = {
  question_id: string
  route: EvaluationRoute
  reason: string
}

/**
 * Senyals tècnics recognoscibles al text OCR.
 * Cobreix SQL/DDL/DML, HTML/XML, programació i altres dominis tècnics.
 * Indicadors que l'alumne ha intentat escriure contingut tècnic.
 */
const TECHNICAL_SIGNAL_PATTERNS = [
  // SQL / DDL / DML
  /\bcreate\b/i,
  /\btable\b/i,
  /\binsert\b/i,
  /\binto\b/i,
  /\bprimary\b/i,
  /\bforeign\b/i,
  /\breferences\b/i,
  /\bselect\b/i,
  /\bupdate\b/i,
  /\bdelete\b/i,
  /\bnot null\b/i,
  /\bcheck\b/i,
  /\bdefault\b/i,
  /\bon delete\b/i,
  /\bvarchar\b/i,
  /\bchar\b/i,
  /\bint\b/i,
  // HTML / XML
  /<[a-z][a-z0-9]*[\s/>]/i,
  /<\/[a-z]/i,
  /\bdoctype\b/i,
  /\bhtml\b/i,
  /\bbody\b/i,
  /\bdiv\b/i,
  /\bspan\b/i,
  /\bhref\b/i,
  /\bsrc\b/i,
  /\bclass\b/i,
  // Programació genèrica
  /\bfunction\b/i,
  /\bdef\b/i,
  /\bclass\b/i,
  /\breturn\b/i,
  /\bif\b/i,
  /\belse\b/i,
  /\bwhile\b/i,
  /\bfor\b/i,
  /\bvar\b/i,
  /\blet\b/i,
  /\bconst\b/i,
  /\bvoid\b/i,
  /\bpublic\b/i,
  /\bprivate\b/i,
  /\bstatic\b/i,
  /\bimport\b/i,
  /\bprint\b/i,
]

/** Mínim de caràcters per considerar que hi ha prou text per avaluar. */
const MIN_TEXT_LENGTH = 15

/** Rati màxim de caràcters "estranys" (no alfanumèrics ni puntuació SQL bàsica) per acceptar el text. */
const MAX_NOISE_RATIO = 0.6

/**
 * Calcula el rati de caràcters estranys respecte al total.
 * Caràcters vàlids: lletres (incl. accentuades i catalanes), dígits, espais,
 * salts de línia, i puntuació bàsica de SQL/text (parèntesis, comes, punts, comes, cometes, _).
 */
export function computeNoiseRatio(text: string): number {
  if (text.length === 0) return 1
  const noise = text.split('').filter((c) => !/[\p{L}\p{N}\s(),.'"`_;:\-<>=*%]/u.test(c)).length
  return noise / text.length
}

/**
 * Detecta si el text conté almenys un senyal tècnic recognoscible
 * (SQL, HTML, programació, etc.).
 */
export function hasTechnicalSignal(text: string): boolean {
  return TECHNICAL_SIGNAL_PATTERNS.some((p) => p.test(text))
}

/** @deprecated Usa hasTechnicalSignal — mantingut per compatibilitat de tests */
export function hasSqlSignal(text: string): boolean {
  return hasTechnicalSignal(text)
}

/**
 * Router pre-LLM — decideix el canal d'avaluació per a una pregunta.
 *
 * Regles (en ordre de prioritat):
 *
 * 1. skip  — status empty o not_detected → sense text ni imatge usable
 * 2. skip  — text massa curt (< MIN_TEXT_LENGTH) i no hi ha crop
 * 3. skip  — rati de soroll alt (> MAX_NOISE_RATIO) i sense senyal tècnic → text inservible
 * 4. skip  — gate semàntic: gibberish pur (>70% tokens corruptes) → il·legible independentment del domini
 * 5. text  — status ok i text prou llegible (soroll acceptable + gate semàntic no-unreadable)
 * 6. text  — status uncertain però senyal tècnic recognoscible (SQL, HTML, codi...)
 * 7. skip  — uncertain sense cap senyal tècnic → text massa dubtós
 *
 * NOTA: 'vision' queda reservat per quan hi hagi crops d'imatge disponibles (no implementat al MVP).
 * El paràmetre `hasImageCrop` permet preparar la integració futura sense canviar el contracte.
 */
export function routeQuestionForEvaluation(
  answer: AnswerForEvaluation,
  hasImageCrop = false,
): EvaluationRoutingDecision {
  const { question_id, answer_text, ocr_status } = answer
  const text = answer_text.trim()

  // ── Règles de skip per status ──────────────────────────────────────────────

  if (ocr_status === 'empty') {
    return {
      question_id,
      route: 'skip',
      reason: "Resposta buida (status 'empty'). Sense contingut per avaluar.",
    }
  }

  if (ocr_status === 'not_detected') {
    return {
      question_id,
      route: 'skip',
      reason: "Pregunta no detectada (status 'not_detected'). Sense contingut per avaluar.",
    }
  }

  // ── Text massa curt ────────────────────────────────────────────────────────

  if (text.length < MIN_TEXT_LENGTH) {
    if (hasImageCrop) {
      return {
        question_id,
        route: 'vision',
        reason: `Text massa curt (${text.length} chars). Crop d'imatge disponible → canal vision.`,
      }
    }
    return {
      question_id,
      route: 'skip',
      reason: `Text massa curt (${text.length} chars < ${MIN_TEXT_LENGTH}) i sense crop d'imatge.`,
    }
  }

  // ── Anàlisi del text ───────────────────────────────────────────────────────

  const noiseRatio = computeNoiseRatio(text)
  const technicalSignal = hasTechnicalSignal(text)

  // ── Status 'ok' ────────────────────────────────────────────────────────────

  if (ocr_status === 'ok') {
    if (noiseRatio > MAX_NOISE_RATIO && !technicalSignal) {
      // Text marcat com ok però massivament corrupte i sense cap senyal tècnic
      if (hasImageCrop) {
        return {
          question_id,
          route: 'vision',
          reason: `OCR status 'ok' però soroll ${(noiseRatio * 100).toFixed(0)}% i sense senyal tècnic. Crop disponible → canal vision.`,
        }
      }
      return {
        question_id,
        route: 'skip',
        reason: `OCR status 'ok' però soroll massa alt (${(noiseRatio * 100).toFixed(0)}%) i sense senyal tècnic reconeixible. Text inservible per al grader.`,
      }
    }

    // ── Gate semàntic (Feature 0.4) ─────────────────────────────────────────
    // Detecta gibberish pur (>70% tokens corruptes) independent del domini.
    // No judica si és SQL, HTML o programació — només si el text és llegible.
    const semantic = detectSemanticOcrQuality(text)
    if (semantic.quality === 'unreadable') {
      if (hasImageCrop) {
        return {
          question_id,
          route: 'vision',
          reason: `Gate semàntic: text il·legible (${semantic.reason}). Crop disponible → canal vision.`,
        }
      }
      return {
        question_id,
        route: 'skip',
        reason: `Gate semàntic: text semànticament il·legible. ${semantic.reason}`,
      }
    }

    return {
      question_id,
      route: 'text',
      reason: `OCR status 'ok'. Soroll ${(noiseRatio * 100).toFixed(0)}%${technicalSignal ? ', senyal tècnic detectat' : ''}. Gate semàntic: ${semantic.quality}. Text adequat per al canal text.`,
    }
  }

  // ── Status 'uncertain' ─────────────────────────────────────────────────────

  if (ocr_status === 'uncertain') {
    if (technicalSignal) {
      return {
        question_id,
        route: 'text',
        reason: `OCR 'uncertain' però senyal tècnic recognoscible. El grader pot inferir la intenció. Canal text amb confiança reduïda esperada.`,
      }
    }
    if (hasImageCrop) {
      return {
        question_id,
        route: 'vision',
        reason: `OCR 'uncertain' i sense senyal tècnic. Crop disponible → canal vision.`,
      }
    }
    return {
      question_id,
      route: 'skip',
      reason: `OCR 'uncertain', sense senyal tècnic recognoscible i sense crop d'imatge. Text massa dubtós per avaluar.`,
    }
  }

  // Fallback defensiu (no hauria d'arribar aquí)
  return {
    question_id,
    route: 'skip',
    reason: `Status OCR desconegut ('${ocr_status}'). Skip per seguretat.`,
  }
}
