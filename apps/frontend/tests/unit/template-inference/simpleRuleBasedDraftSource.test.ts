import { describe, expect, it } from 'vitest'

import { goBasicExam } from '../../../fixtures/template-inference/go-basic'
import { simpleRuleBasedDraftSource } from '../../../src/features/template-inference/services/simpleRuleBasedDraftSource'

describe('simpleRuleBasedDraftSource', () => {
  it('text buit o curt retorna draft no vàlid d’esquema (objecte buit)', () => {
    expect(simpleRuleBasedDraftSource.getDraft({ text: '' })).toEqual({})
    expect(simpleRuleBasedDraftSource.getDraft({ text: '123456789' })).toEqual({})
  })

  it('text amb ??? retorna exam amb doubt_on_seminanonimitzable', () => {
    const d = simpleRuleBasedDraftSource.getDraft({
      text: '1234567890 conté ???',
    }) as Record<string, unknown>
    expect(d.doubt_on_seminanonimitzable).toBe(true)
    expect(d.exercises).toEqual(goBasicExam.exercises)
  })

  it('text llarg sense ??? retorna clon go-basic', () => {
    const d = simpleRuleBasedDraftSource.getDraft({
      text: '1234567890 examen normal',
    })
    expect(d).toEqual(goBasicExam)
    expect(d).not.toBe(goBasicExam)
  })
})
