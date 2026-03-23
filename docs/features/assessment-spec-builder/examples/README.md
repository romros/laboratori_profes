# I/O reals de la passada 2 (enrich) — al repo

Fitxers **exactes** que es poden revisar a GitHub (sense calibratge local):

| Fitxer | Què és |
|--------|--------|
| **`enrich-pass2-user-payload.txt`** | Tot el cos del missatge **`role=user`** enviat a `chat/completions` (o Responses si el model ho exigeix). Inclou blocs ASSESSMENT_SPEC_BASE, ENUNCIAT ORIGINAL, SOLUCIONARI ORIGINAL i regles. |
| **`enrich-pass2-model-output.json`** | **Resposta JSON del model** (text que retorna l’API abans del `merge` al codi). Origen: captura al fixture `apps/frontend/tests/fixtures/assessment-spec-builder/hospitalDawGolden.enriched-output.json`. |

**Regenerar** el payload (sempre determinista) i copiar el JSON del model des del fixture:

```bash
npm run write:enrich-pass2-artifacts -w @profes/frontend
```

Per **tornar a generar** `hospitalDawGolden.enriched-output.json` via API (cal clau): `npm run write:hospital-enriched-fixture -w @profes/frontend`, després torna a executar `write:enrich-pass2-artifacts`.

**Altres** (pipeline complet després de merge): `../quick-sample-v1-output.json`.

Els `calibration-outputs/*.json` segueixen al `.gitignore` (execucions locals).
