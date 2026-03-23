# Validació manual — Feature 2 golden hospital (`buildAssessmentSpec`)

**Run capturat:** `hospitalDawGolden.real-output.json` (2026-03-23, re-run amb prompt **observable / no genèric** + sense subpuntuació ni rúbrica numèrica al text del prompt).  
**Model per defecte:** `gpt-4o-mini` (API OpenAI).

## Prompt (aquest cicle)

- Es mantenen normes JSON estrictes, preguntes només de l’enunciat, alineació `expected_answer`.
- **Nou:** `what_to_evaluate` ha de ser verificable respecte a la resposta/solucionari; evitar criteris genèrics buits.
- **Nou:** explícit que l’artefacte **no** inclou subpuntuacions ni rúbrica numèrica ponderada.

## Comprovacions (última inspecció)

- **15 preguntes**, `question_text` alineat amb l’enunciat hospital.
- **`expected_answer`:** SQL coherent amb el solucionari; ON DELETE SET NULL / CASCADE / `CHECK(` presents.
- **`what_to_evaluate`:** frases compostes (p. ex. «sintaxi SQL», «restriccions correctes») — més concretes que paraules soles; encara repetitives entre preguntes però dins del que demana el golden automàtic.
- Sense duplicats de `question_id`; camps buits on el model aplica cautela (`required_elements` etc.).

## Regeneració

`LOG_ASSESSMENT_SPEC_GOLDEN=1 SAVE_ASSESSMENT_SPEC_GOLDEN=1` + clau (veure test d’integració).

## Feature 3

Base estable per combinar amb respostes d’alumne; `exam_id` estable per convocatòria pendent de producte.
