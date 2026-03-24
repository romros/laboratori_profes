import { describe, expect, it } from 'vitest'

import { triageAnswerEvaluability } from '../../../src/features/answer-evaluator/services/triageAnswerEvaluability'

describe('triageAnswerEvaluability', () => {
  it("status 'empty' → evaluable_by_ocr 'no'", () => {
    const result = triageAnswerEvaluability({
      question_id: 'Q1',
      answer_text: '',
      ocr_status: 'empty',
    })
    expect(result.evaluable_by_ocr).toBe('no')
    expect(result.evaluability_reason).toMatch(/empty/)
  })

  it("status 'not_detected' → evaluable_by_ocr 'no'", () => {
    const result = triageAnswerEvaluability({
      question_id: 'Q2',
      answer_text: '',
      ocr_status: 'not_detected',
    })
    expect(result.evaluable_by_ocr).toBe('no')
    expect(result.evaluability_reason).toMatch(/not_detected/)
  })

  it("status 'uncertain' → evaluable_by_ocr 'review'", () => {
    const result = triageAnswerEvaluability({
      question_id: 'Q3',
      answer_text: 'CREATE TABLE Hospital',
      ocr_status: 'uncertain',
    })
    expect(result.evaluable_by_ocr).toBe('review')
    expect(result.evaluability_reason).toMatch(/incerta|uncertain/)
  })

  it("status 'ok' amb text llarg → evaluable_by_ocr 'yes'", () => {
    const result = triageAnswerEvaluability({
      question_id: 'Q1',
      answer_text: 'CREATE TABLE Hospital (codi INT PRIMARY KEY, cp CHAR(5) NOT NULL);',
      ocr_status: 'ok',
    })
    expect(result.evaluable_by_ocr).toBe('yes')
  })

  it("status 'ok' amb text molt curt (< 10 chars) → evaluable_by_ocr 'review'", () => {
    const result = triageAnswerEvaluability({
      question_id: 'Q5',
      answer_text: 'FK',
      ocr_status: 'ok',
    })
    expect(result.evaluable_by_ocr).toBe('review')
    expect(result.evaluability_reason).toMatch(/curt/)
  })

  it("status 'ok' amb text exactament al límit (10 chars) → 'yes'", () => {
    const result = triageAnswerEvaluability({
      question_id: 'Q6',
      answer_text: '1234567890', // exactament 10
      ocr_status: 'ok',
    })
    expect(result.evaluable_by_ocr).toBe('yes')
  })

  it("garantia: 'empty' retorna sempre verdict null sense necessitat de LLM", () => {
    const result = triageAnswerEvaluability({
      question_id: 'Q7',
      answer_text: '',
      ocr_status: 'empty',
    })
    // El guardrail és: si 'no', no s'ha de cridar LLM → verdict és sempre null downstream
    expect(result.evaluable_by_ocr).toBe('no')
  })
})
