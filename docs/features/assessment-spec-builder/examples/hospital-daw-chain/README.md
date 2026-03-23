# Cadena hospital DAW — sortida passada 1 i passada 2 (sense ofuscar)

Cas fixturat `hospitalDawGolden`: mateixa cadena que `buildAssessmentSpecWithPedagogicEnrichment` (passada 1 → passada 2 → merge al codi).

| Fitxer | Què és |
|--------|--------|
| **`pass1-output.json`** | **Sortida de la passada 1** (`buildAssessmentSpec`): `AssessmentSpec` base (abans de l’enriqueiment pedagògic). |
| **`pass2-user-payload.txt`** | Cos del missatge **`role=user`** de la passada 2 (el que s’enviaria a l’API). |
| **`pass2-llm-response.json`** | **Sortida “crua” de la passada 2**: JSON que va retornar el model (capturat al fixture; el codi només en llegeix els camps pedagògics i fa merge amb el base). |
| **`pass2-after-merge.json`** | **Sortida final de la passada 2** al producte: mateix `mergeEnrichmentPedagogyFields` que en producció, **sense cap crida a OpenAI**. |

## Sense gastar crèdits OpenAI

- **Regenerar** aquests quatre fitxers (determinista):  
  `npm run write:assessment-spec-hospital-chain -w @profes/frontend`
- **Entendre / retocar:** edita `pass1-output.json` o `pass2-llm-response.json` **als fixtures** (`apps/frontend/tests/fixtures/assessment-spec-builder/hospitalDawGolden.*.json`), torna a executar la comanda anterior i es reescriu tot (inclòs `pass2-after-merge.json`).

Només cal **API** si vols una **nova** resposta del model per la passada 2:  
`npm run write:hospital-enriched-fixture -w @profes/frontend` (escriu el fixture `enriched-output`), després la comanda `write:assessment-spec-hospital-chain`.

El pipeline complet end-to-end amb altre snapshot segueix a `../quick-sample-v1-output.json` (referència addicional, no substitueix aquesta cadena pas a pas).
