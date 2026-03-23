# Calibratge models — Assessment Spec (cas hospital DAW)

Data execució: 2026-03-23T17:08:09.681Z

Pipeline: `buildAssessmentSpec` (passada 1) + `enrichAssessmentSpec` (passada 2).

## Telemetria per variant

### V1: base `gpt-5.4-mini` → enrich `gpt-5.4`

- **Schema OK:** sí
- **Preguntes:** 15
- **Temps total (wall):** 90846 ms
- **Tokens (suma passes):** prompt 8223 · completion 10122 · total 18345

| Fase | Model | Latència ms | prompt_tok | completion_tok | total_tok |
|------|-------|------------:|-----------:|---------------:|----------:|
| assessment_spec_base | gpt-5.4-mini | 16549 | 2514 | 3878 | 6392 |
| assessment_spec_enrich | gpt-5.4 | 74280 | 5709 | 6244 | 11953 |

### V2: base `gpt-5.4-mini` → enrich `gpt-5.4-mini`

- **Schema OK:** sí
- **Preguntes:** 15
- **Temps total (wall):** 43422 ms
- **Tokens (suma passes):** prompt 8514 · completion 10363 · total 18877

| Fase | Model | Latència ms | prompt_tok | completion_tok | total_tok |
|------|-------|------------:|-----------:|---------------:|----------:|
| assessment_spec_base | gpt-5.4-mini | 21240 | 2514 | 5134 | 7648 |
| assessment_spec_enrich | gpt-5.4-mini | 22165 | 6000 | 5229 | 11229 |

## Intent `gpt-5.4-pro` a passada 2

El model `gpt-5.4-pro` ha fallat en proves amb `v1/chat/completions` (missatge: no és model de chat en aquest endpoint). El defecte de passada 2 al codi és `gpt-5.4`. La taula V1/V2 contrasta enriqueidor `gpt-5.4` vs `gpt-5.4-mini`.

## Qualitat (revisió manual)

| Variant | Passada 2 | Observacions pedagògiques |
|---------|-----------|---------------------------|
| V1 | gpt-5.4 | Criteris més específics (restriccions, claus, coherència amb enunciat). |
| V2 | gpt-5.4-mini | Sovint acceptable però més genèric en blocs DDL repetitius. |

## Cost estimat (orientatiu)

Mini a la passada 1 redueix cost; reservar model gran només per la passada 2 equilibra qualitat i preu.

## Decisió MVP

- **Passada 1:** `gpt-5.4-mini`.
- **Passada 2:** `gpt-5.4` (`ASSESSMENT_SPEC_ENRICH_MODEL`). Reavaluar `gpt-5.4-pro` quan sigui invocable al mateix client HTTP o es migri API.


**Evidència git:** el commit que introdueix aquesta nota és el que conté `Feature 2.2: models separats` al missatge (`git log --grep=2.2`).
