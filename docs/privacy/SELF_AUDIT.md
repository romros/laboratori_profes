# Self-Audit de Privadesa

**Última revisió:** 2026-03-23
**Revisat per:** PM + agent
**Estat:** ✅ OK

Checklist tècnica i operativa per verificar que el model local-first es manté.
Revisar abans de tancar qualsevol feature que toqui OCR, servidor, uploads, logs o connectors.

---

## Com usar aquest document

1. Llegir cada control
2. Verificar l'estat actual (codi + configuració)
3. Actualitzar `docs/privacy/PRIVACY_REPORT.md` amb el resultat
4. Si algun control falla → **BLOCKED — PM REVIEW REQUIRED**

---

## A. Dades d'alumnes — No surten de la màquina

| # | Control | Estat | Notes |
|---|---------|-------|-------|
| A1 | Cap PDF d'alumne s'envia a cap API externa | ✅ | Cap path de codi fa `fetch` amb buffer de PDF d'alumne |
| A2 | Cap text OCR d'alumne s'envia a cap API externa | ✅ | `runQuestionAnswerExtractionFromPdf` no crida serveis externs |
| A3 | Cap PNG/imatge d'alumne s'envia a cap API externa | ✅ | Rasterització i OCR locals; cap upload de PNG extern |
| A4 | La ruta LLM (Feature 0) no processa documents d'alumnes | ✅ | `llmTemplateDraftSource` rep template del professor; fail-closed si nom de fitxer suggereix solució |

---

## B. Persistència — Cap dada personal al disc

| # | Control | Estat | Notes |
|---|---------|-------|-------|
| B1 | PDFs rebuts no es guarden al disc | ✅ | `parsePdfMultipartUpload.ts` llegeix en memòria; cap write a disc |
| B2 | PNGs rasteritzats no es guarden al disc | ✅ | `rasterizePdfToPngPages.ts` retorna buffers en memòria |
| B3 | Text OCR no es guarda al disc | ✅ | Retornat com a string; no hi ha `writeFile` al pipeline |
| B4 | Fitxers temporals `/tmp/qae-ocr-*` s'eliminen immediatament | ✅ | `tesseractCliOcrPng.ts`: `rm -rf tmpDir` al `finally` |
| B5 | Cap localStorage o IndexedDB amb dades d'alumnes al frontend | ✅ | UI no usa storage local |

---

## C. Logs — Sense dades personals

| # | Control | Estat | Notes |
|---|---------|-------|-------|
| C1 | No hi ha `console.log` amb contingut OCR o text d'exàmens al codi de producció | ✅ | Scripts de spike sí en mostren (consola dev, no producció) |
| C2 | Errors HTTP no exposen contingut de l'examen | ✅ | Respostes d'error: `{ error: { code, message } }` sense contingut |
| C3 | `diagnostic` retornat al client no inclou text d'alumne | ⚠️ REVISAR | `diagnostic` inclou metadades (pàgines, OCR langs, marcadors) però no text de respostes; acceptable, però verificar en cada feature nova |

---

## D. Serveis externs — Controlats i justificats

| # | Control | Estat | Notes |
|---|---------|-------|-------|
| D1 | Cap crida a Google Vision, AWS Textract, o equivalent | ✅ | Tesseract local com a motor definitiu (decisió 2026-03-22) |
| D2 | API LLM externa (Feature 0) limitada al template del professor | ✅ | `openAiCompatibleChat.ts` usat únicament per templates; desactivat sense clau |
| D3 | API key LLM no versionada | ✅ | `.env.local` a `.gitignore`; no és al repo |
| D4 | Cap nou connector extern sense revisió de privadesa | ✅ | Aquest document ha de revisar-se per qualsevol addició |

---

## E. Transport — Xifrat i aïllat

| # | Control | Estat | Notes |
|---|---------|-------|-------|
| E1 | Comunicació navegador → servidor passa per nginx (xarxa local) | ✅ | Ports 9088/9443; en LAN del professor |
| E2 | `qae-api` no exposa ports directament al host | ✅ | `docker-compose.yml`: nginx fa proxy intern; qae-api sense ports exposats |
| E3 | HTTPS disponible per desplegaments en xarxa | ⚠️ PENDENT | Port 9443 configurat a nginx però certificat no gestionat automàticament; el professor ha de configurar-lo si usa HTTPS |

---

## F. Training i reutilització de dades

| # | Control | Estat | Notes |
|---|---------|-------|-------|
| F1 | Cap dada d'exàmens s'usa per entrenar models | ✅ | Tesseract local: model preentrenat, no aprèn de l'ús |
| F2 | Cap enviament implícit de dades a OpenAI per millorar models | ✅ | L'ús de l'API OpenAI és per templates (no exàmens); revisar TOS OpenAI si la versió centres ho necessita |

---

## G. Accessibilitat de l'endpoint

| # | Control | Estat | Notes |
|---|---------|-------|-------|
| G1 | El servei QAE no té autenticació (per disseny, versió professor) | ✅ documentat | Acceptable en xarxa local del professor; obligatori revisar per versió centres |
| G2 | Límit de mida de PDF implementat (12 MB per defecte, nginx 20 MB) | ✅ | `DEFAULT_PDF_UPLOAD_MAX_BYTES` a `questionAnswerExtractionHttpRoute.ts` |

---

## H. Tipus de resposta — Tractament diferencial textual vs gràfic

| # | Control | Estat | Notes |
|---|---------|-------|-------|
| H1 | Respostes textuals no envien cap imatge a cap servei extern | ✅ | Cap path de codi envia crop d'alumne; `isGraphicalAnswer` retorna sempre `false` fins que s'implementi |
| H2 | Cap crop d'imatge s'envia per respostes textuals | ✅ | Flux gràfic no implementat; hook existent a `isGraphicalAnswer.ts` com a punt d'extensió |
| H3 | Qualsevol implementació del flux gràfic passa per PM + actualització d'aquest doc | ✅ documentat | Condicions documentades a `PRIVACY_ARCHITECTURE.md §8`; requereix decisió explícita |
| H4 | Crops (quan s'implementin) estaran limitats a la zona de resposta derivada | ⏳ FUTUR | No implementat; condició obligatòria documentada per quan s'implementi |
| H5 | Crops (quan s'implementin) no es guardarien ni reutilitzarien | ⏳ FUTUR | No implementat; condició obligatòria documentada per quan s'implementi |

---

## Quan re-revisar

Revisar i actualitzar `PRIVACY_REPORT.md` quan:

- Es tanca una feature que toca OCR, servidor, uploads, logs o connectors externs
- S'afegeix qualsevol integració amb un servei extern
- Es canvia el Dockerfile o docker-compose
- S'avalua la transició a versió "centres"

No cal revisió per: canvis de UI purament visuals, refactors interns sense canvi de flux de dades, tests.
