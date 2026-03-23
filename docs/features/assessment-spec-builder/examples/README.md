# Exemples I/O — Assessment Spec Builder

## Cadena passada 1 → passada 2 (recomanat)

Carpeta **`hospital-daw-chain/`** — fitxers JSON/text pla amb noms explícits (`pass1-output`, `pass2-llm-response`, `pass2-after-merge`, `pass2-user-payload`). Llegeix el `README.md` d’aquesta carpeta: **no cal OpenAI** per regenerar-los.

```bash
npm run write:assessment-spec-hospital-chain -w @profes/frontend
```

## Altres

- Snapshot pipeline complet (referència): `../quick-sample-v1-output.json`
- Execucions de calibratge locals: `calibration-outputs/` (gitignored)
