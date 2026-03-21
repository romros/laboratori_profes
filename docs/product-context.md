# Context de producte (esborrany)

Document curt per alinear equip i agents; el detall de negoci evolucionarà amb el PM.

- **Objectiu:** laboratori / eina per al flux de treball del professorat (correcció i gestió d’exàmens amb minimització de dades personals on sigui possible).
- **Feature 0 avui:** validar si la **plantilla** (PDF del professor, avui simulada amb text) permet proposar **regions de resposta per pregunta** (`answer_regions` amb `question_id`, `page`, `bbox` normalitzat) per a futurs **crops mínims** dels fulls dels alumnes — **no** classificar encara respostes ni fer OCR.
- **Sortida estable:** `status: ok | ko`, motius si `ko`, llista de regions si `ok`. Fora d’abast en aquesta fase: `text|mixed|blank`, anonimització automàtica, backend de producció.
- **Següent vertical definida (sense codi encara):** **`question-answer-extraction`** — examen **real d’alumne**, **scan-first**, **OCR**, segmentació per pregunta, sortida **`question_id` + `answer_text` + `status`** per ítem (text-first, preguntes textuals; sense template obligatori en el primer MVP). Ortogonal a Feature 0; definició canònica: `docs/features/question-answer-extraction/mvp-definition.md`.
- **Principi tècnic:** una base de codi, frontend canònic a `apps/frontend`, arquitectura per capes; contractes compartits a `domain/`.

Per decisió de disseny o canvis de producte no especificats aquí: **escalar al PM** (marcar `BLOCKED — PM REVIEW REQUIRED` a la tasca).
