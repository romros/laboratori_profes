# Spike B1 — Benchmark engine-agnostic: preprocess × OCR engines

**Data execució:** 2026-03-24
**Dataset:** 13 crops (manual_text_pass=no, Spike B0 congelat)
**Preprocess:** baseline | preA (grayscale+contrast) | preB (+threshold)
**Engines:** Tesseract.js (WASM, lang=cat) | PaddleOCR (Docker, lang=en, CPU)

> ⚠️ **IMPORTANT — avaluació independent:**
> Avalua cada cel·la per separat, sense comparar primer amb baseline.
> Pregunta per a cada text: "Amb **aquest** text, podria corregir la resposta?"
> Les variants apareixen **abans** del baseline a cada secció.

---

## Textos per crop

### alumne-2_Q1

**Pregunta:** Creació Taula 1 (Hospital) amb les restriccions corresponents.

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=en, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-2_Q4

**Pregunta:** Creació Taula 4 (Metge) amb les restriccions corresponents.

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=en, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-2_Q7

**Pregunta:** Inserir un hospital amb codi 1 ubicat al carrer Sant Joan, número 50, codi posta

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=en, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-2_Q8

**Pregunta:** Inserir un pacient anomenat Pere Torres Font, amb adreça Passeig de Gràcia, núme

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=en, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-3_Q8

**Pregunta:** Inserir un pacient anomenat Pere Torres Font, amb adreça Passeig de Gràcia, núme

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=en, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-3_Q9

**Pregunta:** Assignar una habitació número 101, de tipus individual, a l'hospital 1 per al pa

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=en, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-3_Q11

**Pregunta:** Assignar un tractament anomenat Rehabilitació Cardíaca, amb idTractament 1, per 

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=en, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-3_Q13

**Pregunta:** Incrementar en un 15% l'import de totes les visites registrades.

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=en, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-1_Q2

**Pregunta:** Creació Taula 2 (Pacient) amb les restriccions corresponents.

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=en, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-1_Q5

**Pregunta:** Creació Taula 5 (Tractament) amb les restriccions corresponents.

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=en, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-1_Q9

**Pregunta:** Assignar una habitació número 101, de tipus individual, a l'hospital 1 per al pa

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=en, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-1_Q11

**Pregunta:** Assignar un tractament anomenat Rehabilitació Cardíaca, amb idTractament 1, per 

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=en, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-1_Q12

**Pregunta:** Registrar una visita amb idVisita 1, data 2024-02-01, import 100€, motiu Revisió

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=en, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

## Taula de validació manual

> Omplir `corregible` (yes/no) i `impact` (high/med/low) per cada fila.
> **corregible yes** = puc identificar keywords i reconstruir la intenció.
> **impact**: high = borderline (pot rescatar-se) · low = clarament irrecuperable.

| crop_id | preprocess | engine | corregible | impact | notes |
|---------|-----------|--------|-----------|--------|-------|
| alumne-2_Q1 | baseline | tesseract | — | — | |
| alumne-2_Q1 | baseline | paddleocr | — | — | |
| alumne-2_Q1 | preA | tesseract | — | — | |
| alumne-2_Q1 | preA | paddleocr | — | — | |
| alumne-2_Q1 | preB | tesseract | — | — | |
| alumne-2_Q1 | preB | paddleocr | — | — | |
| alumne-2_Q4 | baseline | tesseract | — | — | |
| alumne-2_Q4 | baseline | paddleocr | — | — | |
| alumne-2_Q4 | preA | tesseract | — | — | |
| alumne-2_Q4 | preA | paddleocr | — | — | |
| alumne-2_Q4 | preB | tesseract | — | — | |
| alumne-2_Q4 | preB | paddleocr | — | — | |
| alumne-2_Q7 | baseline | tesseract | — | — | |
| alumne-2_Q7 | baseline | paddleocr | — | — | |
| alumne-2_Q7 | preA | tesseract | — | — | |
| alumne-2_Q7 | preA | paddleocr | — | — | |
| alumne-2_Q7 | preB | tesseract | — | — | |
| alumne-2_Q7 | preB | paddleocr | — | — | |
| alumne-2_Q8 | baseline | tesseract | — | — | |
| alumne-2_Q8 | baseline | paddleocr | — | — | |
| alumne-2_Q8 | preA | tesseract | — | — | |
| alumne-2_Q8 | preA | paddleocr | — | — | |
| alumne-2_Q8 | preB | tesseract | — | — | |
| alumne-2_Q8 | preB | paddleocr | — | — | |
| alumne-3_Q8 | baseline | tesseract | — | — | |
| alumne-3_Q8 | baseline | paddleocr | — | — | |
| alumne-3_Q8 | preA | tesseract | — | — | |
| alumne-3_Q8 | preA | paddleocr | — | — | |
| alumne-3_Q8 | preB | tesseract | — | — | |
| alumne-3_Q8 | preB | paddleocr | — | — | |
| alumne-3_Q9 | baseline | tesseract | — | — | |
| alumne-3_Q9 | baseline | paddleocr | — | — | |
| alumne-3_Q9 | preA | tesseract | — | — | |
| alumne-3_Q9 | preA | paddleocr | — | — | |
| alumne-3_Q9 | preB | tesseract | — | — | |
| alumne-3_Q9 | preB | paddleocr | — | — | |
| alumne-3_Q11 | baseline | tesseract | — | — | |
| alumne-3_Q11 | baseline | paddleocr | — | — | |
| alumne-3_Q11 | preA | tesseract | — | — | |
| alumne-3_Q11 | preA | paddleocr | — | — | |
| alumne-3_Q11 | preB | tesseract | — | — | |
| alumne-3_Q11 | preB | paddleocr | — | — | |
| alumne-3_Q13 | baseline | tesseract | — | — | |
| alumne-3_Q13 | baseline | paddleocr | — | — | |
| alumne-3_Q13 | preA | tesseract | — | — | |
| alumne-3_Q13 | preA | paddleocr | — | — | |
| alumne-3_Q13 | preB | tesseract | — | — | |
| alumne-3_Q13 | preB | paddleocr | — | — | |
| alumne-1_Q2 | baseline | tesseract | — | — | |
| alumne-1_Q2 | baseline | paddleocr | — | — | |
| alumne-1_Q2 | preA | tesseract | — | — | |
| alumne-1_Q2 | preA | paddleocr | — | — | |
| alumne-1_Q2 | preB | tesseract | — | — | |
| alumne-1_Q2 | preB | paddleocr | — | — | |
| alumne-1_Q5 | baseline | tesseract | — | — | |
| alumne-1_Q5 | baseline | paddleocr | — | — | |
| alumne-1_Q5 | preA | tesseract | — | — | |
| alumne-1_Q5 | preA | paddleocr | — | — | |
| alumne-1_Q5 | preB | tesseract | — | — | |
| alumne-1_Q5 | preB | paddleocr | — | — | |
| alumne-1_Q9 | baseline | tesseract | — | — | |
| alumne-1_Q9 | baseline | paddleocr | — | — | |
| alumne-1_Q9 | preA | tesseract | — | — | |
| alumne-1_Q9 | preA | paddleocr | — | — | |
| alumne-1_Q9 | preB | tesseract | — | — | |
| alumne-1_Q9 | preB | paddleocr | — | — | |
| alumne-1_Q11 | baseline | tesseract | — | — | |
| alumne-1_Q11 | baseline | paddleocr | — | — | |
| alumne-1_Q11 | preA | tesseract | — | — | |
| alumne-1_Q11 | preA | paddleocr | — | — | |
| alumne-1_Q11 | preB | tesseract | — | — | |
| alumne-1_Q11 | preB | paddleocr | — | — | |
| alumne-1_Q12 | baseline | tesseract | — | — | |
| alumne-1_Q12 | baseline | paddleocr | — | — | |
| alumne-1_Q12 | preA | tesseract | — | — | |
| alumne-1_Q12 | preA | paddleocr | — | — | |
| alumne-1_Q12 | preB | tesseract | — | — | |
| alumne-1_Q12 | preB | paddleocr | — | — | |

---

## Resum agregat (completar manualment)

### Per preprocess × engine

| preprocess | tesseract | paddleocr | guany vs baseline |
|-----------|----------|----------|------------------|
| baseline  | X/13 | X/13 | — |
| preA      | X/13 | X/13 | +X/-X |
| preB      | X/13 | X/13 | +X/-X |

### Classificació de resultats

**1. Preprocess transversal** (millora en els dos engines):
_(crops on preX millora tesseract I paddleocr)_

**2. Preprocess dependent de motor** (millora en un, no en l'altre):
_(crops on preX millora un engine però no l'altre)_

**3. Sense guany** (cap variant millora cap engine):
_(crops on cap combinació és corregible)_

---

## Conclusió (a completar)

> [ ] **A — Preprocess és base vàlida:** guany consistent en els dos engines
>     → integrar preprocessing al pipeline
>
> [ ] **B — Preprocess insuficient:** 0-2 rescatats o cap high-impact
>     → Spike B2: benchmark motors nous (PaddleOCR vs Kraken vs base)
>
> [ ] **C — Resultat mixt:** guany dependent de motor
>     → estratègia híbrida engine-aware

*(a completar)*