# Calibratge models — Assessment Spec (cas hospital DAW)

Data execució original: 2026-03-23T18:54:48.280Z — **Decisió revisada: 2026-03-23** (voir §Decisió final)

Pipeline: `buildAssessmentSpec` (passada 1) + `enrichAssessmentSpec` (passada 2).

**Defaults producte (codi actuals):** passada 1 → `gpt-5.4` (`ASSESSMENT_SPEC_MODEL`); passada 2 → `gpt-5.4` (`ASSESSMENT_SPEC_ENRICH_MODEL`, `chat/completions`). **`gpt-5.4-pro`** només com a override experimental (`ASSESSMENT_SPEC_ENRICH_MODEL=gpt-5.4-pro` → `POST /v1/responses`).

> **Nota:** La passada 1 era originalment `gpt-5.4-mini`. Canviat a `gpt-5.4` perquè mini deixava `what_to_evaluate`, `required_elements` i `important_mistakes` buits — la passada 2 no podia enriquir sobre base nul·la. Evidència: `pass1-output.json` antic vs nou.

## Com veure l’output complet i el cost

- **Tokens:** taula per variant (per fase). La **suma de `total_tok` entre les dues passes** compara bé el volum encara que Responses (**pro**) no desglossi sempre prompt vs completion.
- **Cost en USD:** l’API no retorna import; aplica tarifes vigents per model: [OpenAI API pricing](https://openai.com/api/pricing/). Fórmula orientativa: `Σ (prompt_tokens × preu_input + completion_tokens × preu_output) / 10⁶`; o revisa el **dashboard** de facturació.
- **JSON (`AssessmentSpec`):** `CALIBRATION_SAVE_ASSESSMENT_SPEC_JSON=1` en executar el script → per variant, **base** (`*-V1-base-assessment-spec.json`) i **enriquit** (`*-V1-assessment-spec.json`) a `calibration-outputs/` (vegeu `calibration-outputs/README.md`); els `*.json` locals solen estar al `.gitignore`.

## Telemetria per variant

### V1 — Referència original (obsoleta com a default)

Base `gpt-5.4-mini` → enrich `gpt-5.4`. ⚠️ **Mini ja no és el default de passada 1** (deixava camps d'inferència buits; veure §Decisió final).

- **Schema OK:** sí
- **Preguntes:** 15
- **Temps total (wall):** 67078 ms
- **Mètriques heurístiques:** preguntes amb required_elements: 15/15; important_mistakes: 15/15; teacher_style_notes: 15/15; mitjana chars what_to_evaluate (totes juntes): 266
- **Tokens (resum):** prompt 8382 · completion 8354 · total 16736

| Fase | Model | Endpoint | Latència ms | prompt_tok | completion_tok | total_tok |
|------|-------|----------|------------:|-----------:|---------------:|----------:|
| assessment_spec_base | gpt-5.4-mini | chat_completions | 17567 | 2514 | 3949 | 6463 |
| assessment_spec_enrich | gpt-5.4 | chat_completions | 49478 | 5868 | 4405 | 10273 |

### V2 — Referència experimental (pro)

Base `gpt-5.4-mini` → enrich `gpt-5.4-pro`.

- **Schema OK:** sí
- **Preguntes:** 15
- **Temps total (wall):** 301194 ms
- **Mètriques heurístiques:** preguntes amb required_elements: 15/15; important_mistakes: 15/15; teacher_style_notes: 15/15; mitjana chars what_to_evaluate (totes juntes): 320
- **Tokens (resum):** suma `total_tokens` per ronda: **20791**; desglossat on l’API l’envia: prompt 2514, completion 3783 (vegeu taula per fila)

| Fase | Model | Endpoint | Latència ms | prompt_tok | completion_tok | total_tok |
|------|-------|----------|------------:|-----------:|---------------:|----------:|
| assessment_spec_base | gpt-5.4-mini | chat_completions | 15152 | 2514 | 3783 | 6297 |
| assessment_spec_enrich | gpt-5.4-pro | responses | 285977 | — | — | 14494 |

## Comparativa V1 (oficial) vs V2 (experimental pro)

| Mesura | V1 mini → gpt-5.4 | V2 mini → gpt-5.4-pro |
|--------|--------------------:|------------------------:|
| Schema OK | sí | sí |
| Temps total (wall) ms | 67078 | 301194 |
| Latència passada 2 ms | 49478 | 285977 |
| Endpoint passada 2 | chat_completions | responses |
| Tokens totals (suma passes) | 16736 | 20791 |

### Heurístiques de qualitat (output final, si schema OK)

| Dimensió (mitjana chars concatenats per pregunta) | V1 | V2 |
|---------------------------------------------------|----|----|
| `what_to_evaluate` | 266 | 320 |
| `required_elements` | 189 | 170 |
| `important_mistakes` | 267 | 269 |
| `teacher_style_notes` | 260 | 187 |

- **V1 resum:** preguntes amb required_elements: 15/15; important_mistakes: 15/15; teacher_style_notes: 15/15; mitjana chars what_to_evaluate (totes juntes): 266
- **V2 resum:** preguntes amb required_elements: 15/15; important_mistakes: 15/15; teacher_style_notes: 15/15; mitjana chars what_to_evaluate (totes juntes): 320

**Diferència significativa en pedagògia?** En aquest run, la passada 2 amb **pro** ha trigat **~5.8×** més que amb `gpt-5.4`; les heurístiques de longitud (taula) són del mateix ordre — cap salt que justifiqui latència ni cost. Decisió de producte: default passada 2 = `gpt-5.4`.

## Evidència variant experimental `gpt-5.4-pro` (V2)

- **V2 OK:** enriqueiment amb `gpt-5.4-pro` i **`endpointKind: responses`** (taula V2). Es manté com a referència tècnica / experiments; **no** és el default de producte.

## Qualitat (revisió manual — eixos)

Per cada variant amb schema OK, comprovar almenys: `what_to_evaluate` concret i observable; `required_elements` útils; `important_mistakes` pedagògics; `teacher_style_notes` breus i valuoses; sense scoring; sense invents absurds. La taula d’heurístiques amunt resumeix longituds mitjanes (no són substitut de la lectura).

## Decisió final (producte)

- **Passada 1:** `gpt-5.4` (**revisat 2026-03-23** — era mini; canviat per fidelitat d'inferència).
- **Passada 2 (default):** `gpt-5.4` (`chat/completions`).
- **Motiu passada 1:** `gpt-5.4-mini` extreia el SQL fidel però deixava `what_to_evaluate`, `required_elements` i `important_mistakes` amb contingut genèric o buit. La passada 2 necessita una base inferida mínimament per poder enriquir. `gpt-5.4` resol tots els camps correctament en el cas hospital.
- **Motiu passada 2:** qualitat pedagògica comparable a `gpt-5.4-pro` amb **latència ~5.8× menor** i cost més baix; `gpt-5.4-pro` queda només com a **override experimental** via `ASSESSMENT_SPEC_ENRICH_MODEL`.
- **Compatibilitat:** `OPENAI_FORCE_CHAT_COMPLETIONS=1` força chat per a tots els models (p. ex. proxy sense `/v1/responses`).

**Evidència git:** commits `bbb905b` (canvi model) i `355a091` (chain regenerada).
