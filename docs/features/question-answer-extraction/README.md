# question-answer-extraction

**Vertical de producte (definició formal):** extreure **text de resposta per pregunta** des d'un **examen escanejat d'alumne**, enfoc **text-first** i **scan-first** (OCR + segmentació per preguntes).

| Estat                | On                                                                                                                                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Definició**        | `mvp-definition.md`                                                                                                                                                                                                     |
| **Spike (pas 1)**    | Codi a `apps/frontend/src/features/question-answer-extraction/` + `infrastructure/ocr/`; execució: `npm run spike:qae -- [camí.pdf]` (des de `apps/frontend`). PDF d’exemple local: `data/ex_alumne1.pdf` (gitignored). |
| **Producte estable** | Pendent: contracte a `domain/`, sense reutilitzar l’spike com a API final.                                                                                                                                              |

## Lectura obligatòria per implementar

- **`mvp-definition.md`** — contracte conceptual MVP, abast, fora d'abast, decisions de domini, decisions obertes, relació amb Feature 0.

## Relació amb Feature 0 (template-inference)

- **Ortogonals:** Feature 0 = plantilla del professor, viabilitat, `answer_regions`, PDF amb text embegut, sense OCR d'alumne.
- Aquesta vertical = full d'alumne, OCR, `question_id` + `answer_text` + `status` per ítem.
- Feature 0 **no es substitueix**; en un futur es podria usar com a hint opcional, **no** com a requisit del primer MVP (veure `mvp-definition.md`).

## Normativa de codi (quan toqui implementar)

`AGENTS_ARQUITECTURA.md`: contractes a `domain/`, OCR i rasterització a `infrastructure/`, pipeline a `features/question-answer-extraction/` (o nom acordat en tasca).
