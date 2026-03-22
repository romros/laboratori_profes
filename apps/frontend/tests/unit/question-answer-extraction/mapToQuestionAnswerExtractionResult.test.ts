import { describe, expect, it } from 'vitest'

import {
  mapSpikeToQuestionAnswerExtraction,
  stripInternalTruncationMarker,
} from '@/features/question-answer-extraction/services/mapToQuestionAnswerExtractionResult'
import type { QuestionAnswerExtractionSpikeResult } from '@/features/question-answer-extraction/types/spikeTypes'

function baseSpike(
  questions: QuestionAnswerExtractionSpikeResult['questions'],
): QuestionAnswerExtractionSpikeResult {
  return {
    questions,
    meta: {
      page_count: 1,
      raster_target_width: 1800,
      ocr_languages: 'cat',
      marker_count_before_dedupe: 2,
      marker_count_after_dedupe: 2,
    },
  }
}

describe('stripInternalTruncationMarker', () => {
  it('treu el sufix spike pas 2 del text estable', () => {
    const raw = `Resposta llarga aquí.\n\n[… spike pas 2: tall al canvi de pàgina (límit mida) …]`
    const { answer_text, had_truncation_marker } = stripInternalTruncationMarker(raw)
    expect(had_truncation_marker).toBe(true)
    expect(answer_text).toBe('Resposta llarga aquí.')
    expect(answer_text).not.toMatch(/spike pas 2/)
  })
})

describe('mapSpikeToQuestionAnswerExtraction', () => {
  it('mapeja ok simple a status ok', () => {
    const spike = baseSpike([
      {
        question_id: '1',
        status: 'ok',
        raw_text_block: 'Aquesta és una resposta amb prou text per ser usable.',
        page_indices: [1],
      },
    ])
    const { result } = mapSpikeToQuestionAnswerExtraction(spike)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].status).toBe('ok')
    expect(result.items[0].answer_text).toContain('resposta')
  })

  it('mapeja empty a empty i answer_text buit', () => {
    const spike = baseSpike([
      {
        question_id: '2',
        status: 'empty',
        raw_text_block: 'curt',
        page_indices: [1],
      },
    ])
    const { result } = mapSpikeToQuestionAnswerExtraction(spike)
    expect(result.items[0].status).toBe('empty')
    expect(result.items[0].answer_text).toBe('')
  })

  it('mapeja unsupported a uncertain', () => {
    const spike = baseSpike([
      {
        question_id: '3',
        status: 'unsupported',
        raw_text_block: '!!! ######',
        page_indices: [1, 2],
      },
    ])
    const { result } = mapSpikeToQuestionAnswerExtraction(spike)
    expect(result.items[0].status).toBe('uncertain')
  })

  it('marca uncertain quan hi ha tall intern i no posa el marcador a answer_text', () => {
    const spike = baseSpike([
      {
        question_id: '4',
        status: 'ok',
        raw_text_block: 'Contingut\n\n[… spike pas 2: tall en blanc doble (límit mida) …]',
        page_indices: [1],
      },
    ])
    const { result, diagnostic } = mapSpikeToQuestionAnswerExtraction(spike)
    expect(result.items[0].status).toBe('uncertain')
    expect(result.items[0].answer_text).toBe('Contingut')
    expect(result.items[0].answer_text).not.toMatch(/spike pas 2/)
    expect(diagnostic.truncation_notes?.length).toBeGreaterThan(0)
  })

  it('_unsegmented és uncertain encara que el spike digui ok', () => {
    const spike = baseSpike([
      {
        question_id: '_unsegmented',
        status: 'unsupported',
        raw_text_block: 'preview text',
        page_indices: [1],
      },
    ])
    const { result } = mapSpikeToQuestionAnswerExtraction(spike)
    expect(result.items[0].status).toBe('uncertain')
  })

  it('propaga marker counts al diagnòstic', () => {
    const spike = baseSpike([
      {
        question_id: '1',
        status: 'ok',
        raw_text_block: 'Resposta amb prou contingut per classificar com a ok al pipeline.',
        page_indices: [1],
      },
    ])
    const { diagnostic } = mapSpikeToQuestionAnswerExtraction(spike)
    expect(diagnostic.marker_count_before_dedupe).toBe(2)
    expect(diagnostic.marker_count_after_dedupe).toBe(2)
  })
})

/**
 * Pas 3.1: evidència verificable de la semàntica de `status` al mapper (sense tocar `domain/` ni el pipeline).
 * Simula la sortida interna de l’spike tal com arribaria després de `segmentByQuestionMarkers`.
 */
describe('Semàntica de status — evidència explícita (pas 3.1)', () => {
  it('empty: raw_text_block només espais/salts i spike empty → status empty', () => {
    const spike = baseSpike([
      {
        question_id: 'q-empty',
        status: 'empty',
        raw_text_block: '   \n   ',
        page_indices: [1],
      },
    ])
    const { result } = mapSpikeToQuestionAnswerExtraction(spike)
    expect(result.items[0].status).toBe('empty')
    expect(result.items[0].answer_text).toBe('')
  })

  it('ok: text SQL-like i spike ok → status ok', () => {
    const spike = baseSpike([
      {
        question_id: 'q-ok',
        status: 'ok',
        raw_text_block: 'SELECT * FROM taula...',
        page_indices: [1],
      },
    ])
    const { result } = mapSpikeToQuestionAnswerExtraction(spike)
    expect(result.items[0].status).toBe('ok')
    expect(result.items[0].answer_text).toBe('SELECT * FROM taula...')
  })

  it('uncertain: marcador de truncació spike pas 2 (doble salt abans del bracket) → uncertain + nota diagnòstic', () => {
    const raw = 'text resposta...\n\n[… spike pas 2: truncat …]'
    const spike = baseSpike([
      {
        question_id: 'q-trunc',
        status: 'ok',
        raw_text_block: raw,
        page_indices: [1],
      },
    ])
    const { result, diagnostic } = mapSpikeToQuestionAnswerExtraction(spike)
    expect(result.items[0].status).toBe('uncertain')
    expect(result.items[0].answer_text).toBe('text resposta...')
    expect(result.items[0].answer_text).not.toMatch(/spike pas 2/)
    expect(diagnostic.truncation_notes?.some((n) => n.includes('q-trunc'))).toBe(true)
  })

  it('uncertain: baixa densitat de lletres (spike unsupported) → uncertain', () => {
    const spike = baseSpike([
      {
        question_id: 'q-noise',
        status: 'unsupported',
        raw_text_block: '.... --- ---',
        page_indices: [1],
      },
    ])
    const { result } = mapSpikeToQuestionAnswerExtraction(spike)
    expect(result.items[0].status).toBe('uncertain')
    expect(result.items[0].answer_text).toBe('.... --- ---')
  })
})
