/**
 * Prompt mínim: el model només proposa un objecte JSON (exam draft), sense decisió de negoci.
 */
export function buildFeature0ExamDraftPrompt(examTextSnippet: string): string {
  const fields = [
    'layout_stable (boolean)',
    'identity_mixed_with_answer (boolean)',
    'identity_reused_as_gradable_content (boolean)',
    'single_n_concentrates_majority_grade (boolean)',
    'free_text_without_box_main_form (boolean)',
    'layout_differs_per_student (boolean)',
    'answers_in_undelimited_margins_or_mixed_blocks (boolean)',
    'doubt_on_seminanonimitzable (boolean)',
    'conflicting_readings (boolean)',
    'exercises: array of { exercise_id: string, kind: "d" | "n" }',
    'optional proposed_limitations: array (buit si no n’hi ha)',
  ].join('\n- ')

  return `A partir del text d’examen següent, inferir un únic objecte JSON que descrigui el draft de feasibility.
Camps obligatoris (tots booleans excepte exercises):
- ${fields}

Regles:
- Respon NOMÉS amb l’objecte JSON, sense markdown ni text al voltant.
- Els booleans han de reflectir el que es desprèn del text; si no ho saps, posa false excepte doubt_on_seminanonimitzable si hi ha dubte raonable.
- exercises: almenys un element; kind "d" o "n".

Text de l’examen:
---
${examTextSnippet}
---`
}
