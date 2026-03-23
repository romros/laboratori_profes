import { describe, it, expect } from 'vitest'

import { verifyScanMatchesTemplate } from '../../../src/features/template-verification/verifyScanMatchesTemplate'
import type { TemplateQuestion } from '../../../src/features/template-anchor-detection/types'
import type { DetectedQuestionAnchor } from '../../../src/features/template-anchor-detection/types'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeQuestions(n: number): TemplateQuestion[] {
  return Array.from({ length: n }, (_, i) => ({ id: `Q${i + 1}`, text: `Pregunta ${i + 1}` }))
}

function makeAnchor(qid: string, similarity = 0.8): DetectedQuestionAnchor {
  return { question_id: qid, page_index: 1, matched_text: `text de ${qid}`, similarity }
}

const QUESTIONS_15 = makeQuestions(15)

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('verifyScanMatchesTemplate', () => {
  it('match clar: 15/15 anchors amb bona similarity → is_match=true', () => {
    const anchors = QUESTIONS_15.map((q) => makeAnchor(q.id, 0.85))
    const result = verifyScanMatchesTemplate(QUESTIONS_15, anchors, [])

    expect(result.is_match).toBe(true)
    expect(result.reason).toBe('enough_anchors_detected')
    expect(result.detected_anchor_count).toBe(15)
    expect(result.expected_question_count).toBe(15)
    expect(result.missing_question_ids).toHaveLength(0)
  })

  it('match amb OCR brut: 13/15 anchors (87%) amb similarity acceptable → is_match=true', () => {
    const detectedIds = QUESTIONS_15.slice(0, 13).map((q) => q.id)
    const anchors = detectedIds.map((id) => makeAnchor(id, 0.7))
    const notFound = QUESTIONS_15.slice(13).map((q) => q.id)

    const result = verifyScanMatchesTemplate(QUESTIONS_15, anchors, notFound)

    expect(result.is_match).toBe(true)
    expect(result.reason).toBe('enough_anchors_detected')
    expect(result.missing_question_ids).toEqual(notFound)
  })

  it('no match — examen equivocat: pocs anchors (< 30%) → reason=wrong_exam', () => {
    // Examen completament diferent: detecta per atzar 2/15 (13%)
    const anchors = [makeAnchor('Q1', 0.55), makeAnchor('Q2', 0.52)]
    const notFound = QUESTIONS_15.slice(2).map((q) => q.id)

    const result = verifyScanMatchesTemplate(QUESTIONS_15, anchors, notFound)

    expect(result.is_match).toBe(false)
    expect(result.reason).toBe('wrong_exam')
  })

  it('no match — massa pocs anchors però no descartable: 30-60% → reason=too_few_anchors', () => {
    // 6/15 = 40%: entre el llindar incert i el de match
    const detectedIds = QUESTIONS_15.slice(0, 6).map((q) => q.id)
    const anchors = detectedIds.map((id) => makeAnchor(id, 0.75))
    const notFound = QUESTIONS_15.slice(6).map((q) => q.id)

    const result = verifyScanMatchesTemplate(QUESTIONS_15, anchors, notFound)

    expect(result.is_match).toBe(false)
    expect(result.reason).toBe('too_few_anchors')
  })

  it('no match — OCR massa brut: molts anchors però similarity baix → reason=ocr_too_noisy', () => {
    // 12/15 detectats però tots amb similarity 0.52 (just per sobre MIN_SIMILARITY del detector)
    const detectedIds = QUESTIONS_15.slice(0, 12).map((q) => q.id)
    const anchors = detectedIds.map((id) => makeAnchor(id, 0.52))
    const notFound = QUESTIONS_15.slice(12).map((q) => q.id)

    const result = verifyScanMatchesTemplate(QUESTIONS_15, anchors, notFound)

    expect(result.is_match).toBe(false)
    expect(result.reason).toBe('ocr_too_noisy')
  })

  it('cap anchor → cap zona, tot a not_detected → reason=wrong_exam', () => {
    const result = verifyScanMatchesTemplate(
      QUESTIONS_15,
      [],
      QUESTIONS_15.map((q) => q.id),
    )

    expect(result.is_match).toBe(false)
    expect(result.reason).toBe('wrong_exam')
    expect(result.detected_anchor_count).toBe(0)
    expect(result.confidence).toBe(0)
  })

  it('confidence és el producte de rati de detecció × similarity mitja', () => {
    // 9/15 (60%) anchors amb similarity 0.8 → confiança = 0.6 × 0.8 = 0.48 → arrodonit 0.48
    const detectedIds = QUESTIONS_15.slice(0, 9).map((q) => q.id)
    const anchors = detectedIds.map((id) => makeAnchor(id, 0.8))
    const notFound = QUESTIONS_15.slice(9).map((q) => q.id)

    const result = verifyScanMatchesTemplate(QUESTIONS_15, anchors, notFound)

    expect(result.confidence).toBeCloseTo(0.48, 2)
  })

  it('llindar exacte MIN_MATCH_RATIO (9/15 = 60%) amb bona similarity → is_match=true', () => {
    const detectedIds = QUESTIONS_15.slice(0, 9).map((q) => q.id)
    const anchors = detectedIds.map((id) => makeAnchor(id, 0.8))
    const notFound = QUESTIONS_15.slice(9).map((q) => q.id)

    const result = verifyScanMatchesTemplate(QUESTIONS_15, anchors, notFound)

    expect(result.is_match).toBe(true)
    expect(result.reason).toBe('enough_anchors_detected')
  })
})
