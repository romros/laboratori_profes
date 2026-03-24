# Spike B1 — Benchmark crop-based engine-agnostic

**Data execució:** 2026-03-24
**Dataset:** 13 crops (manual_text_pass=no, dataset Spike B0 congelat)
**Pipeline crop:** rasterize → Tesseract OCR → buildTemplateMappedAnswers → crop zona resposta
**Preprocess:** baseline | preA (grayscale+contrast) | preB (+threshold)
**Engines:** Tesseract.js (WASM, lang=cat) | PaddleOCR (Docker, lang=es, CPU)

> ⚠️ **Avaluació independent:** avalua cada cel·la per separat.
> Pregunta: "Amb **aquest** text, podria corregir la resposta?"
> Les variants apareixen **abans** del baseline a cada secció.

---

## Textos per crop

### alumne-2_Q1 — Creació Taula 1 (Hospital) amb les restriccions corresponents.
> Crop: crop buit

#### tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

#### paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

---

### alumne-2_Q4 — Creació Taula 4 (Metge) amb les restriccions corresponents.
> Crop: crop buit

#### tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

#### paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

---

### alumne-2_Q7 — Inserir un hospital amb codi 1 ubicat al carrer Sant Joan, número 50, 
> Crop: crop buit

#### tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

#### paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

---

### alumne-2_Q8 — Inserir un pacient anomenat Pere Torres Font, amb adreça Passeig de Gr
> Crop: crop buit

#### tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

#### paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

---

### alumne-3_Q8 — Inserir un pacient anomenat Pere Torres Font, amb adreça Passeig de Gr
> Crop: zona no detectada per layout

#### tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

#### paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

---

### alumne-3_Q9 — Assignar una habitació número 101, de tipus individual, a l'hospital 1
> Crop: zona no detectada per layout

#### tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

#### paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

---

### alumne-3_Q11 — Assignar un tractament anomenat Rehabilitació Cardíaca, amb idTractame
> Crop: crop buit

#### tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

#### paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

---

### alumne-3_Q13 — Incrementar en un 15% l'import de totes les visites registrades.
> Crop: crop buit

#### tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

#### paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

---

### alumne-1_Q2 — Creació Taula 2 (Pacient) amb les restriccions corresponents.
> Crop: crop buit

#### tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

#### paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

---

### alumne-1_Q5 — Creació Taula 5 (Tractament) amb les restriccions corresponents.
> Crop: crop buit

#### tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

#### paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

---

### alumne-1_Q9 — Assignar una habitació número 101, de tipus individual, a l'hospital 1
> Crop: zona no detectada per layout

#### tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

#### paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

---

### alumne-1_Q11 — Assignar un tractament anomenat Rehabilitació Cardíaca, amb idTractame
> Crop: zona no detectada per layout

#### tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

#### paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

---

### alumne-1_Q12 — Registrar una visita amb idVisita 1, data 2024-02-01, import 100€, mot
> Crop: zona no detectada per layout

#### tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

#### paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no crop)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no crop)
```

**baseline** — Baseline (sense preprocessing):
```
(no crop)
```

---

## Taula de validació manual

> Omplir `corregible` (yes/no) i `impact` (high/med/low) per cada fila.
> **yes** = puc recuperar keywords i reconstruir la intenció tècnica.

| crop_id | preprocess | engine | corregible | impact | notes |
|---------|-----------|--------|-----------|--------|-------|

---

## Resum agregat (completar manualment)

| preprocess | tesseract | paddleocr | guany vs baseline |
|-----------|----------|----------|------------------|
| baseline  | X/13 | X/13 | — |
| preA      | X/13 | X/13 | +X/-X |
| preB      | X/13 | X/13 | +X/-X |

---

## Conclusió (a completar)

> [ ] **A — Preprocess transversal:** millora en els dos engines → integrar al pipeline
>
> [ ] **B — Motor nou guanya:** PaddleOCR millor sense preprocess → adoptar com a fallback
>
> [ ] **C — Sense millora:** via morta → explorar models més avançats

*(a completar)*
---

## ⚠️ BLOQUEIG — Spike tancat sense dades útils (2026-03-24)

**Resultat:** tots els 13 crops retornen `(no crop)` — el spike no ha pogut generar cap dada avaluable.

**Causa arrel: dependència circular.**

Els 13 crops del dataset són els pitjors casos de Feature 1 — aquells on l'OCR Tesseract falla.
L'estratègia d'aquest spike obtenia el crop via `buildTemplateMappedAnswers` (Feature 0 layout),
que depèn d'un OCR mínimament llegible per detectar anchors. En els casos de baixa qualitat,
el text OCR és tan dolent que el layout no detecta cap anchor → no hi ha bbox → no hi ha crop.

```
Feature 4 necessita crop per millorar OCR
   ↓
Per obtenir crop cal layout (Feature 0)
   ↓
Layout necessita OCR llegible per detectar anchors
   ↓
OCR il·legible → layout no detecta anchors → no hi ha crop  ← BUCLE
```

**Decisió pendent (PM):** redefinir l'origen del crop perquè no depengui del text OCR. Opcions:

| Opció | Descripció | Trade-off |
|-------|-----------|-----------|
| A | Crop per franja vertical proporcional (estructura regular de l'examen) | Assumeix distribució de pàgina estable |
| B | Coordenades relatives del template (posicions esperades) | Requereix template amb coords pixel, no tenim |
| C | OCR pàgina sencera amb motor nou + segmentació posterior | Equivalent a B1 original (pàgina completa) |

**Pròxim pas:** decisió PM sobre quin origen de crop s'usa, o si es passa directament a Spike B engines sobre pàgina completa (opció C).
