# Validació manual — Feature 2 golden hospital (`buildAssessmentSpec`)

**Run capturat:** `hospitalDawGolden.real-output.json` (2026-03-23, re-run després del **prompt estricte** alineat al codi).  
**Model per defecte:** `gpt-4o-mini` (API OpenAI).  
**Com regenerar:** `LOG_ASSESSMENT_SPEC_GOLDEN=1 SAVE_ASSESSMENT_SPEC_GOLDEN=1` + clau (veure comentaris al test d’integració).

## Canvis al prompt (aquest cicle)

- JSON **només** array (sense text fora, sense markdown).
- No inventar preguntes; alineació `expected_answer` ↔ pregunta; separació extracció / inferència.
- Incertesa: camps inferits buits + confiança baixa.
- Soroll limitat: `what_to_evaluate` 3–5 ítems; `teacher_style_notes` màx. 2–3 strings.
- `question_type` simple (`sql_*`, `code_generic`, `unknown`, …).

## Comprovacions (última inspecció)

- **Preguntes:** 15 (Q1–Q15), sense duplicats.
- **Puntuació:** totes `max_score` 0.33.
- **Tipus:** coherents amb SQL del solucionari (`sql_ddl` … `sql_delete`).
- **Expected answer:** SQL present, no buit; fragments ON DELETE / CHECK presents al blob global.
- **Qualitat post-prompt:** `what_to_evaluate` curt (p. ex. sintaxi / restriccions / coherència); `required_elements` i similars sovint `[]` quan el model aplica la regla d’incertesa — acceptable per MVP; es pot demanar més detall en una iteració futura sense trencar l’estabilitat.

## Implementació

Normalització de llistes abans de Zod (`buildAssessmentSpec`) sense canvi de schema.

## Feature 3

Artefacte usable com a `expected_answer` + criteris per pregunta; `exam_id` estable per convocatòria pendent de producte.
