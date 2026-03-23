# Calibratge models — Assessment Spec (cas hospital DAW)

Data execució: 2026-03-23T18:31:23.530Z

Pipeline: `buildAssessmentSpec` (passada 1) + `enrichAssessmentSpec` (passada 2).

**Defaults producte:** passada 1 → `gpt-5.4-mini` (`ASSESSMENT_SPEC_MODEL`); passada 2 → `gpt-5.4-pro` (`ASSESSMENT_SPEC_ENRICH_MODEL`, endpoint `POST /v1/responses`).

## Telemetria per variant

### V1: base `gpt-5.4-mini` → enrich `gpt-5.4`

- **Schema OK:** sí
- **Preguntes:** 15
- **Temps total (wall):** 65973 ms
- **Mètriques heurístiques:** preguntes amb required_elements: 15/15; important_mistakes: 15/15; teacher_style_notes: 15/15; mitjana chars what_to_evaluate (totes juntes): 209
- **Tokens (suma passes):** prompt 8849 · completion 8193 · total 17042

| Fase | Model | Endpoint | Latència ms | prompt_tok | completion_tok | total_tok |
|------|-------|----------|------------:|-----------:|---------------:|----------:|
| assessment_spec_base | gpt-5.4-mini | chat_completions | 20147 | 2514 | 4353 | 6867 |
| assessment_spec_enrich | gpt-5.4 | chat_completions | 45806 | 6335 | 3840 | 10175 |

### V2: base `gpt-5.4-mini` → enrich `gpt-5.4-pro`

- **Schema OK:** no
- **Preguntes:** 0
- **Temps total (wall):** 320145 ms
- **Error:** `fetch failed`
- **Tokens (suma passes):** prompt 2514 · completion 3904 · total 6418

| Fase | Model | Endpoint | Latència ms | prompt_tok | completion_tok | total_tok |
|------|-------|----------|------------:|-----------:|---------------:|----------:|
| assessment_spec_base | gpt-5.4-mini | chat_completions | 19341 | 2514 | 3904 | 6418 |

## Evidència `gpt-5.4-pro` (passada 2)

- **V2 fallida:** revisar error amunt. Per diagnòstic: endpoint esperat `POST …/v1/responses`, model `gpt-5.4-pro`, cos amb `input` = missatges sistema+usuari (guia migració OpenAI).
- **Nota operativa:** `fetch failed` sovint indica tall de xarxa o timeout intermedi (el model **pro** pot trigar molts minuts). Prova de nou fora de Docker o amb sortida estable a `api.openai.com`.

## Qualitat (revisió manual)

| Variant | Enrich | Pregunta clau |
|---------|--------|---------------|
| V1 | gpt-5.4 | Schema OK, 15 preguntes; heurístiques plenes (required_elements / mistakes / notes); comparar to amb V2 quan pro completi. |
| V2 | gpt-5.4-pro | ¿Criteris més específics / menys genèrics que V1? |

## Decisió defaults (MVP)

- **Passada 1:** `gpt-5.4-mini`.
- **Passada 2:** `gpt-5.4-pro` (màxima qualitat pedagògica; `POST /v1/responses`). Comparar qualitat vs V1 abans de canviar.
- **Alternativa econòmica:** `ASSESSMENT_SPEC_ENRICH_MODEL=gpt-5.4` si V1 és suficient.
- **Compatibilitat:** `OPENAI_FORCE_CHAT_COMPLETIONS=1` només si el proveïdor no implementa `/v1/responses` (no és el camí principal OpenAI).

**Evidència git:** commit amb missatge que inclogui `Feature 2.2` o `calibratge` / `gpt-5.4-pro` (`git log --oneline --grep=2.2`).
