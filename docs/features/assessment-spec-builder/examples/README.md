# Exemples versionats (Feature 2)

Aquests fitxers **sí** es commitegen (no són `calibration-outputs/*.json`, que romanen al `.gitignore`).

| Fitxer | Descripció |
|--------|------------|
| `hospital-pipeline-output.sample.json` | Snapshot d’un pipeline complet hospital (passada 1 + 2) amb models `gpt-5.4-mini` → `gpt-5.4`. La passada 2 rep **el mateix** enunciat i solucionari que la 1 (veure `buildAssessmentSpecWithPedagogicEnrichment` + `enrichAssessmentSpec`). |

**Garantia de cablejat (CI):** el test `enrichAssessmentSpecPrompt.test.ts` → *amb fixture hospital real* comprova que el prompt d’enriqueiment conté sentinels extrets de `hospitalDawGolden.ts` (enunciat + solucionari dins dels blocs `## ENUNCIAT ORIGINAL` / `## SOLUCIONARI ORIGINAL`).

Vegeu també `../quick-sample-v1-output.json` (mateix tipus d’artefacte al directori pare).
