# question-answer-extraction

**Vertical de producte (definició formal):** extreure **text de resposta per pregunta** des d'un **examen escanejat d'alumne**, enfoc **text-first** i **scan-first** (OCR + segmentació per preguntes).

| Estat                | On                                                                                                                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Definició**        | `mvp-definition.md`                                                                                                                                                                                                                                                            |
| **Spike (pas 1–2)**  | Motor intern: OCR **`cat`**, `dedupeQuestionMarkersByFirstId`, truncament si bloc > ~2800 chars (pàgina / paràgraf), `stripTrailingBoilerplateLines`. Tipus interns: `features/.../types/spikeTypes.ts`.                                                                       |
| **Contracte estable** | **`apps/frontend/src/domain/question-answer-extraction/question_answer_extraction.schema.ts`**: `QuestionAnswerExtractionResult` (`items`: `question_id`, `answer_text`, `status` `ok\|empty\|uncertain`, `page_indices`). **`runQuestionAnswerExtractionFromPdf`** + `mapSpikeToQuestionAnswerExtraction`; **`diagnostic`** apart (suport tècnic; **`result`** és el canònic de producte). |
| **Consum (pas 4–4.1)** | Façana: **`features/question-answer-extraction/server/questionAnswerExtractionHttpRoute.ts`**. Reexport app: **`app/question-answer-extraction/index.ts`**. Constants dev: **`features/question-answer-extraction/dev/qaeDevServerConstants.ts`** (path, port, env). URL per `fetch` des del navegador: **`getQaeApiUrlForBrowser()`** a `dev/qaeDevBrowserApiUrl.ts` (override amb **`VITE_QAE_API_BASE_URL`**, sense barra final). **API local:** `npm run dev:qae-api` — escolta **`QAE_DEV_HOST`** (per defecte `127.0.0.1`) i **`QAE_API_PORT`** (per defecte `8787`). **Èxit (200):** `{ result, diagnostic }` (contracte domini + diagnòstic). **Error (400 / 413 / 500):** `{ "error": { "code", "message" } }` amb codis estables (`invalid_multipart`, `missing_file`, `payload_too_large`, `invalid_pdf`, `processing_failed`, `internal_error`). *Motiu servidor Node apart:* el pipeline OCR no pot carregar-se al bundle del `vite.config` sense trencar `vite build`. Smoke sense HTTP: `npm run smoke:qae-facade -- [camí.pdf]`. Harness JSON: `npm run spike:qae -- [camí.pdf]`. PDF local: `data/ex_alumne1.pdf` (gitignored). |

## Lectura obligatòria per implementar

- **`mvp-definition.md`** — contracte conceptual MVP, abast, fora d'abast, decisions de domini, decisions obertes, relació amb Feature 0.

## Relació amb Feature 0 (template-inference)

- **Ortogonals:** Feature 0 = plantilla del professor, viabilitat, `answer_regions`, PDF amb text embegut, sense OCR d'alumne.
- Aquesta vertical = full d'alumne, OCR, `question_id` + `answer_text` + `status` per ítem.
- Feature 0 **no es substitueix**; en un futur es podria usar com a hint opcional, **no** com a requisit del primer MVP (veure `mvp-definition.md`).

## Normativa de codi (quan toqui implementar)

`AGENTS_ARQUITECTURA.md`: contractes a `domain/`, OCR i rasterització a `infrastructure/`, pipeline a `features/question-answer-extraction/` (o nom acordat en tasca).
