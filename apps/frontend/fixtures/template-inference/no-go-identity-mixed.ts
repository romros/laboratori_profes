import type { ExamFeasibilityDraft } from '../../src/domain/template-inference/exam_feasibility.schema'

import { goBasicExam } from './go-basic'

/** §4 identitat dins resposta avaluable */
export const noGoIdentityMixedExam: ExamFeasibilityDraft = {
  ...goBasicExam,
  identity_mixed_with_answer: true,
}
