# Privacy Report

**Data:** 2026-03-23
**Versió del producte:** professor/autònom — MVP
**Commit de referència:** unknown
**Generat per:** `npm run privacy:report`

---

## Decisió global

**✅ OK**

Tots els checks automàtics passen. Model local-first intact.

---

## Checks automàtics

| ID | Control | Estat | Nota |
|----|---------|-------|------|
| A1 | Cap fetch() a URLs externes fora de template-inference/ui/dev | ✅ | OK — fetch() extern només a template-inference (LLM templates) |
| B4 | Fitxers temporals /tmp eliminats (rm recursive) | ✅ | OK — rm({ recursive: true }) present a tesseractCliOcrPng.ts |
| C1 | Sense console.log amb contingut personal (ocr, pdf, alumne…) al codi src/ | ✅ | OK — cap console.log sospitós a src/ |
| D1 | Cap import de serveis cloud (Google, AWS, Azure) fora de template-inference | ✅ | OK — cap servei cloud importat |
| D3 | .env.local no versionat al repo git | ✅ | OK — .env.local fora de git |


---

## Controls manuals (SELF_AUDIT.md)

Revisar `docs/privacy/SELF_AUDIT.md` per la checklist completa.
Els checks manuals no s'automatitzen aquí; s'actualitzen en tancar features.

**Darrera revisió manual:** 2026-03-23 — ✅ OK (21/22 controls; 2 pendents acceptables)

---

## Quan regenerar

- En tancar una feature que toqui OCR, servidor, uploads, logs o connectors
- Quan s'afegeixi qualsevol integració externa nova
- Quan canviï docker-compose o Dockerfile de serveis amb dades
- Opcional: una vegada per sprint/iteració

```bash
npm run privacy:report
```
