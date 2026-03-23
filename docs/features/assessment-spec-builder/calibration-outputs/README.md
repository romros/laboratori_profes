# Sortides de calibratge (JSON)

Si engegues el script amb `CALIBRATION_SAVE_ASSESSMENT_SPEC_JSON=1`, es generen aquí, per variant:

- `*-V1-base-assessment-spec.json`, … → **sortida passada 1** (abans d’enriqueir)
- `*-V1-assessment-spec.json`, … → **sortida final** (després de passada 2)

Això permet comparar base vs enriquit sense tornar a cridar l’API.

Els `*.json` estan al `.gitignore` del repositori (eviten commits massius i dades sensibles). Vols compartir-los: copia’ls fora d’aquesta carpeta o treu-los del gitignore amb criteri.

Vegeu també `hospital-model-calibration-notes.md` (telemetria, tokens, com estimar cost).
