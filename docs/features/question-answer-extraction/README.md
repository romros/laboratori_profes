# question-answer-extraction

**Vertical de producte (definició formal):** extreure **text de resposta per pregunta** des d'un **examen escanejat d'alumne**, enfoc **text-first** i **scan-first** (OCR + segmentació per preguntes).

| Estat                | On                                                                                                                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Definició**        | `mvp-definition.md`                                                                                                                                                                                                                                                            |
| **Spike (pas 1–2)**  | Motor intern: OCR **`cat`**, `dedupeQuestionMarkersByFirstId`, truncament si bloc > ~2800 chars (pàgina / paràgraf), `stripTrailingBoilerplateLines`. Tipus interns: `features/.../types/spikeTypes.ts`. **Detecció tolerant (pas 3):** 3 nivells regex — estricte (`N.`/`N)`), `Pregunta N`, fallback (`N` + paraula d'enunciat) per OCR brut. **Separació enunciat/resposta (pas 5+):** `stripLeadingQuestionStatement` elimina les primeres línies amb patró `(X punts)` de cada bloc; conservador (≥20 chars restants). |
| **Fixtures de prova** | `data/ex_alumne1.pdf` a `data/ex_alumne4.pdf` — 4 alumnes reals amb variabilitat de manuscrit i qualitat d'escaneig. |
| **Contracte estable** | **`apps/frontend/src/domain/question-answer-extraction/question_answer_extraction.schema.ts`**: `QuestionAnswerExtractionResult` (`items`: `question_id`, `answer_text`, `status` `ok\|empty\|uncertain`, `page_indices`). **`runQuestionAnswerExtractionFromPdf`** + `mapSpikeToQuestionAnswerExtraction`; **`diagnostic`** apart (suport tècnic; **`result`** és el canònic de producte). |
| **UI dev (pas 5)** | Ruta **`/demo/qae`**: **`QaeDemoPage.tsx`** — pujada PDF, errors HTTP visibles, diagnòstic en `<details>`. URL `fetch`: **`getQaeApiUrlForBrowser()`** a `dev/qaeDevBrowserApiUrl.ts` — retorna URL relativa (`/api/…`) en Docker (nginx proxy) o `http://127.0.0.1:8787/…` en Vite dev local; override amb **`VITE_QAE_API_BASE_URL`**. |
| **Docker (proxy nginx)** | `docker compose up --build -d` arrenca serveis **frontend** (nginx, 9088/9443) + **qae-api** (Node 22, permanent). Nginx fa **proxy invers** de `/api/…` cap a `qae-api:8787` (xarxa interna Docker, sense ports exposats ni firewall extra). Tot passa per un sol port. Demo: `http://<IP>:9088/demo/qae`. |
| **Consum (pas 4–4.1)** | Façana: **`features/question-answer-extraction/server/questionAnswerExtractionHttpRoute.ts`**. Reexport app: **`app/question-answer-extraction/index.ts`**. Constants dev: **`features/question-answer-extraction/dev/qaeDevServerConstants.ts`** (path, port, env). **Èxit (200):** `{ result, diagnostic }` (contracte domini + diagnòstic). **Error (400 / 413 / 500):** `{ "error": { "code", "message" } }` amb codis estables (`invalid_multipart`, `missing_file`, `payload_too_large`, `invalid_pdf`, `processing_failed`, `internal_error`). *Motiu servidor Node apart:* el pipeline OCR no pot carregar-se al bundle del `vite.config` sense trencar `vite build`. Smoke sense HTTP: `npm run smoke:qae-facade -- [camí.pdf]`. Harness JSON: `npm run spike:qae -- [camí.pdf]`. PDF local: `data/ex_alumne1.pdf` (gitignored). **Vite dev local:** `npm run dev:qae-api` (port 8787 al host). |

## Iteració següent — millora OCR (dins Feature 1)

**Problema:** errors residuals per OCR deficient en casos difícils (ex: `ex_alumne4`) — text il·legible, falsos positius al regex tolerant, blocs que absorbeixen múltiples preguntes.

**Estratègia:** benchmark → decisió → implementació. No és nova feature.

**Benchmark executat (2026-03-22):** `docs/benchmarks/ocr-benchmark-2026-03-22.md`

**Resultat:** cap configuració Tesseract.js (cat, cat+spa, PSM3, PSM6) millora prou els casos crítics. El text d'`ex_alumne4` és soroll pur per a tots els motors — el tuning de paràmetres no és suficient.

**Decisió:** ⚠️ **explorar motor OCR alternatiu LOCAL** (Tesseract CLI natiu, easyocr local, paddleocr local). Cap API cloud — dades personals d'alumnes.

**Restricció de privacitat:** tot el processament OCR ha de ser local (servidor o navegador). Cap API cloud acceptable.

---

## Lectura obligatòria per implementar

- **`mvp-definition.md`** — contracte conceptual MVP, abast, fora d'abast, decisions de domini, decisions obertes, relació amb Feature 0.

## Relació amb Feature 0 (template-inference)

- **Ortogonals:** Feature 0 = plantilla del professor, viabilitat, `answer_regions`, PDF amb text embegut, sense OCR d'alumne.
- Aquesta vertical = full d'alumne, OCR, `question_id` + `answer_text` + `status` per ítem.
- Feature 0 **no es substitueix**; en un futur es podria usar com a hint opcional, **no** com a requisit del primer MVP (veure `mvp-definition.md`).

## Normativa de codi (quan toqui implementar)

`AGENTS_ARQUITECTURA.md`: contractes a `domain/`, OCR i rasterització a `infrastructure/`, pipeline a `features/question-answer-extraction/` (o nom acordat en tasca).
