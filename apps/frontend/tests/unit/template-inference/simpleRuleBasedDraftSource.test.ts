import { describe, expect, it } from 'vitest'

import {
  CANONICAL_TEXT_REGRESSION_TWO_OPEN_ONLY,
  CANONICAL_TEXT_SEMI_STRUCTURED,
} from '../../../fixtures/template-inference/feature0-canonical-text'
import { templateClearViableDraft } from '../../../fixtures/template-inference/template-clear-viable'
import { templateKoMixedPromptDraft } from '../../../fixtures/template-inference/template-ko-mixed-prompt'
import { templateKoUnstableLayoutDraft } from '../../../fixtures/template-inference/template-ko-unstable-layout'
import { simpleRuleBasedDraftSource } from '../../../src/features/template-inference/services/simpleRuleBasedDraftSource'

describe('simpleRuleBasedDraftSource', () => {
  it('text buit o curt retorna objecte buit', () => {
    expect(simpleRuleBasedDraftSource.getDraft({ text: '' })).toEqual({})
    expect(simpleRuleBasedDraftSource.getDraft({ text: '123456789' })).toEqual({})
  })

  it('text amb ??? retorna esborrany barreja enunciat/resposta', () => {
    const d = simpleRuleBasedDraftSource.getDraft({
      text: '1234567890 conte ???',
    })
    expect(d).toEqual(templateKoMixedPromptDraft)
  })

  it('text llarg sense ??? retorna plantilla viable', () => {
    const d = simpleRuleBasedDraftSource.getDraft({
      text: '1234567890 examen normal',
    })
    expect(d).toEqual(templateClearViableDraft)
    expect(d).not.toBe(templateClearViableDraft)
  })

  it('sentinel two-open-only retorna fixture regressio', () => {
    const d = simpleRuleBasedDraftSource.getDraft({ text: CANONICAL_TEXT_REGRESSION_TWO_OPEN_ONLY })
    expect(d).toEqual(templateKoMixedPromptDraft)
  })

  it('sentinel semi-structured retorna layout inestable', () => {
    const d = simpleRuleBasedDraftSource.getDraft({ text: CANONICAL_TEXT_SEMI_STRUCTURED })
    expect(d).toEqual(templateKoUnstableLayoutDraft)
  })
})
