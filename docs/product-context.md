# Context de producte (esborrany)

Document curt per alinear equip i agents; el detall de negoci evolucionarà amb el PM.

- **Objectiu:** laboratori / eina per al flux de treball del professorat (correcció i gestió d’exàmens amb minimització de dades personals on sigui possible).
- **Feature 0 avui:** validar si la **plantilla** (PDF del professor, avui simulada amb text) permet proposar **regions de resposta per pregunta** (`answer_regions` amb `question_id`, `page`, `bbox` normalitzat) per a futurs **crops mínims** dels fulls dels alumnes — **no** classificar encara respostes ni fer OCR.
- **Sortida estable:** `status: ok | ko`, motius si `ko`, llista de regions si `ok`. Fora d’abast en aquesta fase: `text|mixed|blank`, anonimització automàtica, backend de producció.
- **Feature 1 (MVP validat):** **`question-answer-extraction`** — examen **real d’alumne**, **scan-first**, **OCR** (Tesseract `cat`), segmentació per pregunta, sortida **`question_id` + `answer_text` + `status` (`ok|empty|uncertain`)** per ítem. Servei **`qae-api`** permanent a Docker; **nginx proxy invers** (`/api/…` → `qae-api:8787`, sense ports addicionals al firewall). Detecció tolerant de marcadors (3 nivells regex). Separació enunciat/resposta per patró de puntuació `(X punts)`. Demo: `/demo/qae`. Definició canònica: `docs/features/question-answer-extraction/mvp-definition.md`. **Limitacions conegudes:** OCR molt brut (alumne4 Q2 absorbeix Q3–Q4); casos on l’enunciat no porta patró `(X punts)` (Q10 alumne1 conserva enunciat).
- **Principi tècnic:** una base de codi, frontend canònic a `apps/frontend`, arquitectura per capes; contractes compartits a `domain/`.

Per decisió de disseny o canvis de producte no especificats aquí: **escalar al PM** (marcar `BLOCKED — PM REVIEW REQUIRED` a la tasca).
