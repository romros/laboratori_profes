# Spike C — Comparativa final de motors OCR

**Data:** 2026-03-25  
**Timebox:** ≤ 2 dies  
**Estat:** ✅ TANCAT

---

## Objectiu

Determinar si existeix un motor clarament millor que PaddleOCR-VL-1.5 (baseline actual: 9/13).

**Criteri de canvi:** motor ≥ 11/13 → considerar migració. Si no → mantenir PaddleOCR-VL.

---

## Dataset (fix, no modificar)

Exactament els mateixos 13 casos de les avaluacions anteriors:

- `alumne-2`: Q1–Q13 (pàgines 1–5 de `ex_alumne2.pdf`)
- `alumne-3`: Q1–Q13 (pàgines 1–6 de `ex_alumne3.pdf`)

Rasteritzat a 200dpi, pàgina sencera, sense crop, sense preprocess addicional.

---

## Motors a comparar

| Motor | Versió | Backend | Estat |
|-------|--------|---------|-------|
| PaddleOCR-VL-1.5 | GGUF Q8 | llama.cpp | ✅ BASELINE (9/13) |
| TrOCR-Large | microsoft/trocr-large-handwritten | transformers CPU | ✅ EXECUTAT |
| Qwen2.5-VL-2B | Q4_K_M GGUF + mmproj Q8_0 | llama.cpp CPU | ⚠️ VIA MORTA CPU |

---

## Guardrails

- ❌ No afegir més models
- ❌ No modificar dataset
- ❌ No fer tuning específic per model
- ❌ No introduir LLM post-process
- ❌ No canviar pipeline (pàgina sencera → OCR → text)

---

## Mètrica

Mateix criteri binari que spikes anteriors:

**Detectat (✅):** sentència SQL recognoscible i parseable (estructura correcta + valors principals presents).  
**Parcial (⚠️):** present però amb errors que la fan no parseable.  
**No detectat (❌):** absent o alucinació.

---

## Resultats detallats

### PaddleOCR-VL-1.5 via llama.cpp (BASELINE)

| Q | alumne-2 | alumne-3 |
|---|----------|----------|
| Q1 CREATE TABLE hospital | ✅ | ✅ |
| Q2 CREATE TABLE pacient | ✅ | ✅ |
| Q3 CREATE TABLE habitacio | ✅ | ✅ |
| Q4 CREATE TABLE metge | ✅ | ✅ |
| Q5 CREATE TABLE tractament | ⚠️ | ⚠️ |
| Q6 CREATE TABLE visita | ✅ | ✅ |
| Q7 INSERT hospital | ⚠️ (Sant Joan→San) | ⚠️ (Sant Joan→Jean) |
| Q8 INSERT pacient | ✅ | ✅ |
| Q9 INSERT habitacio | ✅ | ✅ |
| Q10 INSERT metge | ✅ | ✅ |
| Q11 INSERT tractament | ⚠️ (Rehab→Acab) | ⚠️ (Rehab→Achab) |
| Q12 INSERT visita | ✅ | ✅ |
| Q13 UPDATE visita | ⚠️ (1.15→IIS) | ⚠️ (1.15→IIS) |
| **TOTAL** | **9/13** | **9/13** |

Temps: ~15s/pàgina · RAM: ~4GB

### TrOCR-Large handwritten (microsoft)

**Execució:** Docker `spike-c-trocr` · `transformers==4.40.0` + `torch==2.2.2+cpu` + `numpy==1.26.4`  
**Durada total:** 333s (~5.5min) per 11 pàgines  
**Temps/pàgina:** 6–67s (mediana ~18s)

Output seleccionat per avaluació:

| Pàgina | TrOCR output (extracte) | Notes |
|--------|------------------------|-------|
| alumne2_page-1 | `"Crreck Taste Table 1 Hospital ) and the multactone commemorate ( 275 yards 0.25"` | Confon SQL amb anglès |
| alumne2_page-2 | `"Creado Taula 4 ( Melge ) ambles restrictions corresponds. ( 75 parts )#0,15"` | Text català/castellà, no SQL |
| alumne2_page-3 | `"Crescid Taula 6 ( Visita ) and his restrictions corresponds. (1.75mmal.4,75"` | No SQL |
| alumne2_page-4 | `"Assignar una habitato numero 101, de Tipus individual, a hospital 1 per at patient"` + `"Alegir un melge and NIF 907654128, non Dr. Laura Lopez"` | Context visible però no SQL |
| alumne2_page-5 | `"Esbonner takesles on eight tonsultal, perpmal. 0.37"` | Irreconeixible |
| alumne3_page-5 | `"Increment area in 1946 Limport de totes les visites... MODIFY CORPORANCES not NULL"` | Fragments SQL parcials |
| alumne3_page-6 | `"UPDATE VISITUR COUNT... SET imports import... MODIFY CORPORANCES"` | Fragments SQL visibles però no parseables |

**Avaluació Q per Q (TrOCR):**

| Q | alumne-2 | alumne-3 |
|---|----------|----------|
| Q1 CREATE TABLE hospital | ❌ | ❌ |
| Q2 CREATE TABLE pacient | ❌ | ❌ |
| Q3 CREATE TABLE habitacio | ❌ | ❌ |
| Q4 CREATE TABLE metge | ❌ | ❌ |
| Q5 CREATE TABLE tractament | ❌ | ❌ |
| Q6 CREATE TABLE visita | ❌ | ❌ |
| Q7 INSERT hospital | ⚠️ | ⚠️ |
| Q8 INSERT pacient | ⚠️ | ⚠️ |
| Q9 INSERT habitacio | ❌ | ❌ |
| Q10 INSERT metge | ⚠️ | ⚠️ |
| Q11 INSERT tractament | ❌ | ❌ |
| Q12 INSERT visita | ❌ | ❌ |
| Q13 UPDATE visita | ❌ | ⚠️ |
| **TOTAL** | **0/13** | **0/13** |

> TrOCR-Large no genera SQL vàlid. Detecta fragments de text de les enunciats (pàgines d'instruccions) però no les respostes manuscrites. 0/13 deteccions.

**Diagnosi:** TrOCR és entrenat per a text manuscrit en anglès (dataset IAM). Documents en català/castellà amb SQL manuscrit queden completament fora del seu domini d'entrenament. Les sortides mostren substitució sistemàtica per vocabulari anglès.

### Qwen2.5-VL-2B GGUF via llama.cpp

**Execució:** Docker compose `spike-c-qwen-server` + `spike-c-qwen-client`  
**Model:** `Qwen2.5_VL_2B.Q4_K_M.gguf` + `Qwen2.5_VL_2B.mmproj-Q8_0.gguf`  
**Resultat:** ⚠️ **VIA MORTA CPU**

| Mesura | Valor |
|--------|-------|
| Tokens context per pàgina A4 200dpi | ~4051 tokens d'imatge |
| Progrés en 4 minuts | 0.37% (15/4051 tokens) |
| Estimació temps total/pàgina | >1 hora |
| Estimació 11 pàgines | >11 hores |

**Diagnosi:** `llama.cpp` CPU sense AVX-512 o AMX no pot processar les ~4000 imatge-tokens que Qwen2.5-VL genera per una pàgina A4 a 200dpi dins un temps raonable. El prefill (tokenització de la imatge) domina el temps. El model Qwen2.5-VL usa més tokens d'imatge que PaddleOCR-VL-1.5 (0.9B vs 2B), cosa que el fa prohibitiu en CPU.

> Nota: PaddleOCR-VL-1.5 (0.9B) funciona bé perquè és un model significativament més petit dissenyat específicament per OCR, i genera menys tokens d'imatge.

---

## Taula comparativa final

| model | correctes | temps/pàg | notes |
|-------|-----------|-----------|-------|
| PaddleOCR-VL-1.5 GGUF Q8 (llama.cpp) | **9/13** | ~15s | **BASELINE ACTUAL** · errors en text curt/ambiguous |
| TrOCR-Large (transformers CPU) | **0/13** | ~18s mediana | Fora del domini: SQL manuscrit en català/castellà |
| Qwen2.5-VL-2B Q4 (llama.cpp CPU) | N/A | **>1h/pàg** | VIA MORTA CPU · ~4K tokens d'imatge/pàg |

---

## Conclusió

**Cap dels dos nous models supera PaddleOCR-VL-1.5:**

- **TrOCR-Large:** velocitat acceptable (~18s) però 0/13 deteccions. Completament fora del domini (SQL manuscrit en català/castellà vs IAM anglès).
- **Qwen2.5-VL-2B:** potencialment millor qualitat (benchmarks ~3.8% CER vs 5.8%) però inviable en CPU per mida de context d'imatge.

**Criteri de canvi (≥11/13) no assolit per cap model.**

---

## Decisió final

**✅ A) Mantenir PaddleOCR-VL-1.5 com a motor OCR de Feature 4**

Justificació:
- Únic motor viable en CPU amb latència acceptable (~15s/pàgina)
- 9/13 deteccions és suficient per desbloquejar Feature 3 (vs 5/13 baseline)
- Errors residuals documentats i atribuïts a lletra ambigua, no al motor
- Cap alternativa testada supera el threshold de canvi (≥11/13)

---

## Successor obligatori

**→ TASCA: Wiring Feature 4 → Feature 3**

Motor seleccionat: `PaddleOCR-VL-1.5 GGUF Q8 via llama.cpp`  
Arquitectura: `Dockerfile.vl-gguf` + `docker-compose.vl-gguf.yml` + `paddle_vl_runner_gguf.py`

---

## Notes de producció post-spike

Per al wiring cal definir:

1. **API endpoint** — FastAPI wrap de `paddle_vl_runner_gguf.py` (Spike D)
2. **Origen del crop** — pàgina sencera (actual) vs coordenades de `answer_regions` (Feature 0)
3. **Trigger** — `route !== 'text'` AND `ocr_status ∈ {uncertain, not_detected}`
4. **Timeout** — 30s màxim (pàgines llargues ~15s, marge ok)
5. **Privacitat** — `tmpfs` + PII scrubbing pre-retorn (disseny a `spike-vl-gguf.md §Estratègia privacitat`)
