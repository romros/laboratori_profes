# Arquitectura de Privadesa

**Versió:** professor/autònom (MVP)
**Data:** 2026-03-23
**Audiència:** agents, developers, PM

---

## 1. Propòsit d'aquesta versió

Aquesta és la versió **professor/autònom**: un professor executa l'eina al seu propi hardware o servidor controlat per ell. No hi ha servidor central de tercers que rebi exàmens.

L'eina ajuda a corregir exàmens escanejats. Els exàmens contenen dades personals dels alumnes (nom, respostes, notes). El model de privadesa és **local-first**: tot el processament passa a la màquina del professor.

---

## 2. Principi local-first

**El processament és local per defecte.**

```
PDF alumne → rasterització PNG (memòria) → OCR (local) → text → extracció → resultat
                                                 ↑
                                         tot a la mateixa màquina
```

Cap PDF, PNG ni text OCR surt de la màquina. El resultat final (text estructurat per pregunta) és el que el professor veu.

---

## 3. Què es pot fer i què no

### Permès

| Acció | On | Justificació |
|-------|----|-------------|
| Rasteritzar PDF a PNG | Memòria, local | Pas intern, cap persistència |
| OCR del PNG | Local (Tesseract) | Motor local, cap núvol |
| Retornar text estructurat al navegador | HTTP intern Docker | Xarxa local del professor |
| Processar text del **template** (enunciat imprès) via LLM extern | Extern (opcional, Feature 0) | Només enunciat del professor, no dades d'alumnes |

### Prohibit en aquesta versió

| Acció | Motiu |
|-------|-------|
| Enviar PDFs d'alumnes a serveis externs (Google, AWS, OpenAI…) | Dades personals, fora d'abast RGPD |
| Enviar text OCR d'exàmens a serveis externs | Equivalent al PDF |
| Guardar PDFs, PNGs o text OCR al disc de forma persistent | No cal; augmenta risc |
| Logs amb contingut de respostes o noms d'alumnes | Dades personals en logs |
| Training amb dades dels exàmens | Prohibit sense consentiment |
| Usar serveis no controlats pel professor | Trenca el model local-first |

---

## 4. Excepcions documentades

### Feature 0 — LLM per al template

El **template** és el document del professor (enunciat de l'examen, sense dades d'alumnes). En Feature 0, el template es pot enviar a un LLM extern (OpenAI compatible) per extreure regions de resposta.

**Condicions d'excepció:**
- Només el text del **template del professor** (no de l'alumne)
- Configurat explícitament amb API key pròpia del professor
- Desactivat per defecte (retorna HTTP 503 sense clau)
- Si el nom del fitxer suggereix document de solució, el sistema rebutja (fail-closed)

**Futura versió "centres":** si el producte evoluciona a un SaaS per a centres educatius, calen acords de tractament de dades, DPO, i revisió d'aquesta arquitectura. **Escalar al PM** abans de qualsevol canvi en aquest sentit.

---

## 5. Flux tècnic actual (Feature 1 QAE)

```
[Navegador professor]
       │ POST /api/question-answer-extraction (PDF, multipart, ≤12MB)
       ▼
[nginx — Docker, port 9088]
       │ proxy intern
       ▼
[qae-api — Node.js, Docker]
       │
       ├── rasterizePdfToPngPages() → [PNG buffers en memòria]
       │
       ├── ocrPngBuffersWithTesseract() → [text OCR local, Tesseract cat]
       │
       ├── runQuestionAnswerExtractionFromPdf() → [items: question_id, answer_text, status]
       │
       └── resposta JSON → nginx → navegador

Cap dada surt de Docker. Cap fitxer persistent.
```

**Fitxers temporals:** `tesseractCliOcrPng.ts` crea `/tmp/qae-ocr-*` i els elimina immediatament. És el camí de codi secundari (benchmark); el camí principal (WASM) no usa disc.

---

## 6. Diferència versió "professor" vs futura versió "centres"

| Aspecte | Versió professor (ara) | Versió centres (futura) |
|---------|----------------------|------------------------|
| Infraestructura | Màquina del professor | Servidor centre / SaaS |
| Dades alumnes | Surten zero de la màquina | Requeririen acords RGPD |
| LLM extern | Opcional, només template | A definir |
| Autenticació | No necessari (màquina pròpia) | Obligatòria |
| DPO | No necessari | Probablement sí |
| Aquesta arquitectura | Vàlida | **Revisar abans de desplegar** |

---

## 7. Riscos coneguts i controls

| Risc | Probabilitat | Control actual |
|------|-------------|----------------|
| PDF alumne enviada a API externa | Baix (cap codi ho fa) | Cap path de codi usa API externa amb PDFs d'alumnes |
| Text OCR d'alumne en logs | Baix | No hi ha `console.log` amb contingut OCR al codi de producció |
| Fitxers temporals llegibles | Molt baix (camí secundari) | `rm -rf` immediatament després de l'ús |
| API key OpenAI en `.env.local` | Gestió del professor | `.env.local` a `.gitignore`; no versionar mai |
| Nginx sense autenticació | Mig (xarxa local) | Per disseny: el professor controla la xarxa; futura versió centres requerirà auth |

---

## 8. Decisions preses

| Data | Decisió | Motiu |
|------|---------|-------|
| 2026-03-22 | Descartar Scribe.js (AGPL) | Llicència incompatible amb model de distribució |
| 2026-03-22 | Descartar Google Vision / AWS Textract | Enviaria PDFs alumnes a núvol; inacceptable |
| 2026-03-22 | Tesseract local (WASM + CLI) com a motor definitiu del MVP | Privadesa + llicència permissiva |
| 2026-03-23 | LLM extern només per template del professor (Feature 0), mai per exàmens | Dades del template no són personals |

---

## 9. Quan llegir aquest document

**Obligatori llegir abans de:**
- Qualsevol tasca que toqui OCR, uploads, servidor, logs, persistència
- Qualsevol integració amb un servei extern
- Qualsevol canvi al pipeline de processament de PDFs
- Qualsevol evolució cap a versió "centres"

Veure també: `docs/privacy/SELF_AUDIT.md`
