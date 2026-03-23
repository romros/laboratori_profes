# Validació manual — Feature 2 golden hospital (`buildAssessmentSpec`)

**Run capturat:** `hospitalDawGolden.real-output.json` (2026-03-23, Docker + `FEATURE0_OPENAI_API_KEY`).  
**Model per defecte:** `gpt-4o-mini` (API OpenAI).

## Comprovacions

- **5.1 Preguntes:** 15 ítems Q1–Q15, sense duplicats (revisat).
- **5.2 Puntuació:** totes amb `max_score` 0.33, coherent amb «(0,33 punts)» a l’enunciat.
- **5.3 Tipus:** `sql_ddl` Q1–Q6, `sql_insert` Q7–Q12, `sql_update` Q13, `sql_alter` Q14, `sql_delete` Q15.
- **5.4 Expected answer:** SQL reconeixible, no buit; Q9 combina INSERT+UPDATE com al solucionari (un sol bloc, acceptable). Sense barreja de blocs «Qx.» d’altres preguntes dins una mateixa resposta.
- **5.5 Elements crítics:** `ON DELETE SET NULL` (Q2), `ON DELETE CASCADE` (Q3/Q4), `CHECK` (Q1/Q3/Q5).
- **5.6 Qualitat:** `what_to_evaluate` és repetitiu («sintaxi SQL», «coherència amb l’enunciat») però no buit i útil com a MVP; es pot refinar el prompt si cal més variació.

## Implementació

Els models sovint envien `teacher_style_notes` com a string: es normalitza a array a `buildAssessmentSpec` abans del parse Zod (sense canviar el contracte del domini).

El prompt d’`buildAssessmentSpecPrompt` és **transversal** (no parteix de SQL); el cas hospital és només una prova d’acceptació amb solucionari SQL.

## Feature 3

L’artefacte és usable com a criteri + `expected_answer` per pregunta; en producte caldria `exam_id` estable per convocatòria (avui el servei genera `exam_<timestamp>`).
