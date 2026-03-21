import type { ExamFeasibilityDraft } from '../../src/domain/template-inference/exam_feasibility.schema'

/** Cas GO clar: graella majoritària d, layout estable, sense triggers §6. */
export const goBasicExam: ExamFeasibilityDraft = {
  layout_stable: true,
  identity_mixed_with_answer: false,
  identity_reused_as_gradable_content: false,
  single_n_concentrates_majority_grade: false,
  free_text_without_box_main_form: false,
  layout_differs_per_student: false,
  answers_in_undelimited_margins_or_mixed_blocks: false,
  doubt_on_seminanonimitzable: false,
  conflicting_readings: false,
  exercises: [
    { exercise_id: 'q1', kind: 'd' },
    { exercise_id: 'q2', kind: 'd' },
    { exercise_id: 'q3', kind: 'd' },
    { exercise_id: 'q4', kind: 'd' },
    { exercise_id: 'q5', kind: 'd' },
    { exercise_id: 'q6', kind: 'd' },
    { exercise_id: 'n1', kind: 'n' },
    { exercise_id: 'n2', kind: 'n' },
  ],
}
