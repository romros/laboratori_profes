import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  resolveAssessmentSpecBaseModel,
  resolveAssessmentSpecEnrichModel,
} from '../../../src/features/assessment-spec-builder/services/assessmentSpecModelEnv'

describe('assessmentSpecModelEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('resolveAssessmentSpecBaseModel: override explícit té prioritat', () => {
    vi.stubEnv('ASSESSMENT_SPEC_MODEL', 'from-env-base')
    expect(resolveAssessmentSpecBaseModel('  explicit  ')).toBe('explicit')
  })

  it('resolveAssessmentSpecBaseModel: ASSESSMENT_SPEC_MODEL abans que legacy OPENAI', () => {
    vi.stubEnv('ASSESSMENT_SPEC_MODEL', 'base-x')
    vi.stubEnv('ASSESSMENT_SPEC_OPENAI_MODEL', 'legacy')
    expect(resolveAssessmentSpecBaseModel()).toBe('base-x')
  })

  it('resolveAssessmentSpecEnrichModel: ASSESSMENT_SPEC_ENRICH_MODEL independent del base', () => {
    vi.stubEnv('ASSESSMENT_SPEC_MODEL', 'base-x')
    vi.stubEnv('ASSESSMENT_SPEC_ENRICH_MODEL', 'enrich-y')
    expect(resolveAssessmentSpecEnrichModel()).toBe('enrich-y')
  })

  it('legacy: només ASSESSMENT_SPEC_OPENAI_MODEL aplica a ambdues passades', () => {
    vi.stubEnv('ASSESSMENT_SPEC_OPENAI_MODEL', 'same-old')
    expect(resolveAssessmentSpecBaseModel()).toBe('same-old')
    expect(resolveAssessmentSpecEnrichModel()).toBe('same-old')
  })
})
