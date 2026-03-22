# question-answer-extraction

**Vertical de producte (definició formal):** extreure **text de resposta per pregunta** des d'un **examen escanejat d'alumne**, enfoc **text-first** i **scan-first** (OCR + segmentació per preguntes).

| Estat                | On                                                                                                                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Definició**        | `mvp-definition.md`                                                                                                                                                                                                                                                            |
| **Spike (pas 1–2)**  | Motor intern: OCR **`cat`**, `dedupeQuestionMarkersByFirstId`, truncament si bloc > ~2800 chars (pàgina / paràgraf), `stripTrailingBoilerplateLines`. Tipus interns: `features/.../types/spikeTypes.ts`.                                                                       |
| **Contracte estable** | **`apps/frontend/src/domain/question-answer-extraction/question_answer_extraction.schema.ts`**: `QuestionAnswerExtractionResult` (`items`: `question_id`, `answer_text`, `status` `ok\|empty\|uncertain`, `page_indices`). **`runQuestionAnswerExtractionFromPdf`** + `mapSpikeToQuestionAnswerExtraction`; **`diagnostic`** apart (suport tècnic; **`result`** és el canònic de producte). |
| **Consum (pas 4)** | Façana: **`features/question-answer-extraction/server/questionAnswerExtractionHttpRoute.ts`**. Reexport app: **`app/question-answer-extraction/index.ts`**. **API local:** `npm run dev:qae-api` → `http://127.0.0.1:8787/api/question-answer-extraction` (POST **`multipart/form-data`**, camp **`file`** = PDF). Resposta JSON: **`{ result, diagnostic }`**. Port: variable **`QAE_API_PORT`** (per defecte 8787). *Motiu servidor apart:* el pipeline OCR no pot carregar-se al bundle del `vite.config` sense trencar `vite build`. Smoke sense HTTP: `npm run smoke:qae-facade -- [camí.pdf]`. Harness JSON: `npm run spike:qae -- [camí.pdf]`. PDF local: `data/ex_alumne1.pdf` (gitignored). |

## Lectura obligatòria per implementar

- **`mvp-definition.md`** — contracte conceptual MVP, abast, fora d'abast, decisions de domini, decisions obertes, relació amb Feature 0.

## Relació amb Feature 0 (template-inference)

- **Ortogonals:** Feature 0 = plantilla del professor, viabilitat, `answer_regions`, PDF amb text embegut, sense OCR d'alumne.
- Aquesta vertical = full d'alumne, OCR, `question_id` + `answer_text` + `status` per ítem.
- Feature 0 **no es substitueix**; en un futur es podria usar com a hint opcional, **no** com a requisit del primer MVP (veure `mvp-definition.md`).

## Normativa de codi (quan toqui implementar)

`AGENTS_ARQUITECTURA.md`: contractes a `domain/`, OCR i rasterització a `infrastructure/`, pipeline a `features/question-answer-extraction/` (o nom acordat en tasca).
