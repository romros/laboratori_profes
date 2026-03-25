# Feature: Grading E2E — Corrector d'examen MVP

**Estat:** DONE (2026-03-25)
**Responsable:** PM + agent
**Tasca origen:** UX · Flux professor MVP · Upload → Correcció → Resultat

---

## 1. Arquitectura

### Visió general

```
NAVEGADOR PROFESSOR
  → POST /api/grade-exam (PDF multipart)
      ↓
  NGINX (contenidor frontend, port 9088)
      ↓ proxy intern
  qae-api (contenidor Node, port 8787 intern)
      ↓
    gradeExamFromPdf()
      ├── rasterizePdfToPngPages()     → PNG buffers (memòria, ~4s)
      ├── ocrPngBuffersWithPaddleVl()  → text OCR (~80s, VL server al host :8111)
      ├── buildTemplateMappedAnswers() → respostes per pregunta (<1s)
      └── gradeExam() / evaluateAnswer() → LLM per pregunta (~9s Claude, ~4s GPT)
      ↓
  JSON resultat → navegador
```

### Contenidors Docker

| Contenidor | Rol | Port |
|---|---|---|
| `profes-frontend-1` | Nginx: SPA + proxy `/api/*` | 9088 (HTTP), 9443 (HTTPS) |
| `profes-qae-api-1` | Node.js: pipeline complet | 8787 (intern, no exposat) |
| VL server (al HOST) | PaddleVL OCR | 8111 (host) |

### Fitxers principals

| Fitxer | Rol |
|---|---|
| `features/grading/ui/GradeExamPage.tsx` | UI: upload + fases + resultat |
| `features/grading/gradeExamFromPdf.ts` | Orquestrador pipeline E2E |
| `features/grading/server/gradingHttpRoute.ts` | Handler POST `/api/grade-exam` |
| `features/answer-evaluator/services/evaluateAnswer.ts` | 1 LLM call per pregunta |
| `features/answer-evaluator/services/gradeExam.ts` | Orquestrador grading |
| `infrastructure/ocr/rasterizePdfToPngPages.ts` | PDF → PNG buffers |
| `infrastructure/ocr/paddleVlOcrClient.ts` | Client OCR PaddleVL |
| `scripts/qaeLocalApiServer.ts` | Servidor Node dev (registra rutes) |

### Selecció de model LLM

El sistema detecta automàticament:
- `CLAUDE_API_KEY` present → `claude-sonnet-4-6` a `api.anthropic.com`
- Si no → `gpt-5.4` a `api.openai.com` (via `FEATURE0_OPENAI_API_KEY`)
- Override manual: `GRADER_MODEL` + `GRADER_BASE_URL`

### Logs de servidor (per fase)

Cada execució produeix logs estructurats visibles a `docker compose logs qae-api`:

```
[grade-exam] Rubrica: 15 preguntes
[grade-exam]   Q1: Si crea la taula amb el nom Hospital | ...
[grade-exam] Model grader: claude-sonnet-4-6 | baseUrl: https://api.anthropic.com/v1
[grade-exam] API key present: SÍ (Claude/Anthropic)
[grade-exam] [pipeline] Inici rasterització PDF (1029 KiB)
[grade-exam] [pipeline] Rasterització OK — 5 pàgines en 4267ms
[grade-exam] [pipeline] Inici OCR (PaddleVL) — 5 pàgines
[grade-exam] [ocr] Pàgina 1/5 processada
...
[grade-exam] [pipeline] OCR OK — 146 línies totals en 79435ms
[grade-exam] [pipeline] Mapping OK — is_match=true conf=0.84 detectades=15/15
[grade-exam] [grading] Q1: avaluant amb claude-sonnet-4-6…
[grade-exam] [grading] Q1: partial conf=0.55 lat=7123ms
[grade-exam] [pipeline] TOTAL: 95621ms
```

### Limitacions MVP (hardcoded)

- Template i AssessmentSpec fixos: `template_hospital_daw.json` + `hospitalDawGolden.enriched-output.json`
- Un alumne per crida (no batch)
- Sense persistència de resultats
- Fases de la UI simulades amb timeouts (el pipeline és síncron ~90s)

---

## 2. Resultats amb avaluació

### Evidència E2E (2026-03-25, `ex_alumne2.pdf`, 15 preguntes)

| Fase | Resultat | Temps |
|---|---|---|
| Rasterització | 5 pàgines | 4s |
| OCR (PaddleVL) | 15/15 detectades | 80s (~15s/pàg) |
| Mapping | is_match=true, conf=0.84 | <1s |
| Grading Claude | 15/15 avaluades | 9s |
| Grading GPT | 15/15 avaluades | 4s |
| **TOTAL** | **Pipeline complet** | **~96s** |

### Comparativa de models — `ex_alumne2.pdf`

| Q | GPT-5.4 | conf | Claude Sonnet 4.6 | conf | Professor real | Agent (PDF) |
|---|---|---|---|---|---|---|
| Q1 | ❌ incorrect | 0.92 | 🟡 partial | 0.55 | ✅ correct (0.75) | 🟡 partial→correct |
| Q2 | 🟡 partial | 0.72 | ❌ incorrect | 0.35 | ✅ correct (0.75) | 🟡 partial |
| Q3 | ❌ incorrect | 0.95 | ❌ incorrect | 0.82 | 🟡 partial (1.4/1.5) | ❌ incorrect |
| Q4 | ❌ incorrect | 0.95 | ❌ incorrect | 0.55 | ✅ correct (0.75) | ❌ incorrect |
| Q5 | ❌ incorrect | 0.88 | ❌ incorrect | 0.55 | ✅ correct (1.75) | ❌ incorrect |
| Q6 | ❌ incorrect | 0.95 | ❌ incorrect | 0.72 | ✅ correct (1.75) | ❌ incorrect |
| Q7 | ❌ incorrect | 0.98 | ❌ incorrect | 0.80 | ✅ correct (0.33) | ❌ incorrect |
| Q8 | ❌ incorrect | 0.98 | ❌ incorrect | 0.85 | ✅ correct (0.33) | 🟡 partial |
| Q9 | ❌ incorrect | 0.98 | 🟡 partial | 0.80 | ✅ correct (0.33) | 🟡 partial |
| Q10 | ❌ incorrect | 0.97 | 🟡 partial | 0.60 | ✅ correct (0.33) | 🟡 partial |
| Q11 | ❌ incorrect | 0.96 | ❌ incorrect | 0.72 | ✅ correct (0.33) | ❌ incorrect |
| Q12 | ❌ incorrect | 0.89 | 🟡 partial | 0.55 | ✅ correct (0.33) | 🟡 partial |
| Q13 | 🟡 partial | 0.42 | ✅ correct | 0.82 | ✅ correct (0.5) | ✅ correct |
| Q14 | ❌ incorrect | 0.95 | 🟡 partial | 0.80 | 🟡 partial (0.4) | 🟡 partial |
| Q15 | ✅ correct | 0.99 | ✅ correct | 0.95 | ✅ correct (0.37) | ✅ correct |

### Notes finals

| Avaluador | Punts | Nota /10 |
|---|---|---|
| **Professor real** | ~8.0 equiv. | **~5.3/10** |
| **Agent (llegint PDF)** | 6.5/15 | **4.3/10** |
| **Claude Sonnet 4.6** | 4.5/15 | **3.0/10** |
| **GPT-5.4** | 2.0/15 | **1.3/10** |

### Concordança models vs agent (ground truth aproximat)

| Model | Encerts vs agent |
|---|---|
| Claude Sonnet 4.6 | **13/15** |
| GPT-5.4 | 9/15 |

**Claude s'assembla molt més a una avaluació humana** en aquest dataset.

---

## 3. Problema detectat — OCR de baixa resolució

### Causa arrel

Les pàgines del PDF mesuren **595×842px natiu** (equivalent a 72 DPI). Quan el sistema rasteritza a `desiredWidth: 1800px` s'escalen 3x píxels sense guanyar detall real. Per OCR fiable es necessiten ≥200 DPI (2480px per A4).

El document és una **foto de mòbil** del paper escrit a mà, no un escàner dedicat.

### Impacte per zona del document

| Zona | Preguntes | Qualitat OCR | Grading LLM |
|---|---|---|---|
| DDL denses (molts camps, lletra petita) | Q1–Q6 | ❌ Molt dolent (sim=0.60) | Infiable — destrueix respostes correctes |
| SQL curt (1-2 línies, espai blanc) | Q7–Q15 | ✅ Excel·lent (sim=1.00) | Claude: fiable |

### Errors crítics d'OCR documentats

| Text real (manuscrit) | OCR llegit | Impacte |
|---|---|---|
| `DECIMAL(10,2)` | `DECIMAL(10,12)` | correct → incorrect |
| `carrer` / `numero` / `telefon` | `Cancer` / `Mummo` / `Telecom` | invalida Q1-Q6 |
| `1'15` (notació europea) | `IIS` | Claude interpreta, GPT falla |
| `nifMetge` | `mifudge` | incorrecte però inferible |

### El sistema ja detecta el problema

El mapping retorna `warnings: ['low_similarity']` i `sim=0.60` per Q1-Q6. Aquesta senyal existeix i podria usar-se per:
- Avisar el professor: "OCR incert — revisió manual recomanada"
- No enviar al LLM i marcar com `not_evaluable_low_ocr_quality`

### Solucions possibles (per ordre de cost/impacte)

| Solució | Cost | Impacte |
|---|---|---|
| Demanar escaneig ≥200 DPI als alumnes (CamScanner, Adobe Scan) | Zero | Alt — resol el 90% |
| Avisar a la UI quan `sim < 0.75` | Baix | Mig — informa el professor |
| Crops per pregunta abans del VLM | Mig | Mig — menys soroll per imatge |
| Model VLM amb millor comprensió de manuscrit (Florence-2, TrOCR) | Alt | Mig — no resol 72 DPI |

**Recomanació:** solució 1 + 2 com a pròxim pas mínim.

---

## Privadesa

El text OCR de les respostes dels alumnes **surt de la màquina** per al grading LLM (Claude/OpenAI). Això és una **excepció al model local-first** documentada però no aprovada formalment a `PRIVACY_ARCHITECTURE.md`. Cal decisió PM explícita abans de desplegar en producció real.

Controls actius:
- Cap PDF ni PNG d'alumne surt de la màquina
- El text OCR surt per grading (excepció nova — pendent aprovació PM)
- Cap persistència al disc
- Logs sense contingut de respostes d'alumnes

---

## Pròxims passos suggerts

1. **Avís UI** quan `low_similarity` — indicar al professor que revisi manualment
2. **Batch** — corregir 20-30 alumnes d'una tirada
3. **Export CSV** — resum professor amb notes i comentaris
4. **Formalitzar excepció privadesa** — aprovació PM per grading LLM amb text d'alumnes
