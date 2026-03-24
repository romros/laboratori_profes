# Feature 4 / Spike B0 — Benchmark preprocessament mínim sobre crops reals

**Estat:** DEFINIT — pendent d'execució i validació manual
**Data definició:** 2026-03-24
**Feature:** `docs/features/ocr-fallback/README.md`

---

## Pregunta central

Amb preprocessament mínim (grayscale + contrast + threshold aplicat als PNGs de pàgina), els pitjors crops de Feature 1 passen de "no corregible" a "corregible"?

**Abans d'entrar en motors OCR nous**, cal saber si la causa del problema és la imatge o el motor.

---

## Context

S'ha demostrat (ocr-gate-loop iter 1-2, VIA MORTA) que el gate post-OCR no pot separar text corregible de no corregible. La nova hipòtesi és que el problema és upstream: les imatges que rep Tesseract són de poca qualitat i un preprocessing bàsic podria millorar-les prou.

El `preprocessPngForOcr.ts` ja existeix però el benchmark anterior (Feature 1) el va descartar perquè **empitjorava casos bons**. La diferència aquí és que s'avalua **exclusivament sobre els pitjors casos** — on el baseline ja és inutilitzable.

---

## Dataset (congelat)

13 crops seleccionats de `docs/spikes/ocr-gate-loop/dataset.json`:
- Criteri: `manual_text_pass === 'no'`, ordenats per ratio alfanumèric ascendent (més corromputs primer)
- Distribució: alumne-1 (5), alumne-2 (4 incl. alumne-2_Q1 clàssic), alumne-3 (4)

| crop_id | alumne | Q | ratio alnum aprox |
|---------|--------|---|------------------|
| alumne-1_Q12 | alumne-1 | Q12 | 0.54 |
| alumne-3_Q11 | alumne-3 | Q11 | 0.56 |
| alumne-2_Q7  | alumne-2 | Q7  | 0.56 |
| alumne-1_Q11 | alumne-1 | Q11 | 0.61 |
| alumne-2_Q8  | alumne-2 | Q8  | 0.62 |
| alumne-3_Q9  | alumne-3 | Q9  | 0.63 |
| alumne-3_Q13 | alumne-3 | Q13 | 0.64 |
| alumne-1_Q5  | alumne-1 | Q5  | 0.65 |
| alumne-3_Q8  | alumne-3 | Q8  | 0.66 |
| alumne-1_Q2  | alumne-1 | Q2  | 0.68 |
| alumne-2_Q4  | alumne-2 | Q4  | 0.69 |
| alumne-1_Q9  | alumne-1 | Q9  | 0.69 |
| alumne-2_Q1  | alumne-2 | Q1  | — (cas clàssic CRERTE T10y5) |

**Dataset congelat.** No es modifica durant el spike.

---

## Variants

| Variant | Preprocessing | Descripció |
|---------|--------------|------------|
| `baseline` | cap | OCR actual, sense preprocessing |
| `preA` | grayscale + contrast 0.3 | Lleuger — elimina color, realça contrast |
| `preB` | grayscale + contrast 0.3 + threshold 128 | Clàssic OCR — binaritza a blanc/negre |

**Motor OCR:** Tesseract.js WASM, `lang=cat`, `PSM=AUTO`. Igual que el pipeline base.

**No entra:** engines nous (Kraken, PaddleOCR), LLM, post-correcció semàntica, GPU.

---

## Criteri d'avaluació

Per cada crop i variant, una pregunta binària:

> **Amb aquest text, podries corregir la resposta?**
> - `yes` — puc identificar paraules clau SQL/tècniques i reconstruir la intenció
> - `no` — el text és massa corrupte per corregir

**"Millor"** = la variant converteix `baseline=no` → `variant=yes`.

No mesura "millor visualment". Mesura "passa de no corregible a corregible".

---

## Com executar

```bash
# Des de apps/frontend (host, no Docker — script de recerca)
npm run spike:ocr-preprocess-b0
```

L'script genera `docs/spikes/feature4/spike-b0-preprocess-benchmark.md` amb:
- Text OCR per crop per variant
- Taula de validació (columna `corregible` a omplir manualment)
- Secció de conclusió (a completar manualment)

---

## Com completar el spike

1. Executar el harness → genera el benchmark .md
2. Per cada crop, llegir el text de cada variant i marcar `corregible: yes/no` a la taula
3. Comptar guanys: quants `baseline=no` → `preX=yes`
4. Omplir la secció "Conclusió" amb decisió:
   - **Opció A (útil):** preX rescata ≥ 3/13 → incorporar com a base + continuar Spike B engines
   - **Opció B (insuficient):** cap variant rescata prou → passar directament a Spike B engines

---

## Criteri de tancament

- [x] Dataset congelat definit (13 crops)
- [x] Harness implementat (`scripts/ocrPreprocessSpikeB0.ts`)
- [ ] Harness executat i benchmark generat
- [ ] Taula de validació manual completa
- [ ] Conclusió clara (útil / insuficient)
- [ ] Commit a main

---

## ⚠️ Bloqueig descobert a Spike B1 (2026-03-24)

**Problema:** l'estratègia de Spike B1 d'obtenir el crop a partir del layout OCR-dependent
(`buildTemplateMappedAnswers`) introdueix una **dependència circular**:

- Feature 4 necessita el crop per millorar l'OCR
- Per obtenir el crop necessita un OCR mínimament llegible (per detectar anchors)
- Els 13 crops del dataset són exactament els casos on l'OCR falla → layout no detecta anchors → no hi ha crop

**Conseqüència:** els 13 crops (els pitjors) retornen tots `(no crop)` — el spike no genera dades útils.

**Decisió pendent (PM):** redefinir l'origen del crop perquè no depengui del text OCR. Opcions:
- A) Crop per franja vertical proporcional (estructura regular de l'examen, sense text)
- B) Coordenades relatives del template (posicions esperades de cada pregunta)
- C) OCR de pàgina sencera amb el motor nou, segmentació posterior

---

## Refs

- **Harness:** `apps/frontend/scripts/ocrPreprocessSpikeB0.ts`
- **Script:** `npm run spike:ocr-preprocess-b0 -w @profes/frontend`
- **Dataset font:** `docs/spikes/ocr-gate-loop/dataset.json`
- **Preprocessing existent:** `apps/frontend/src/infrastructure/ocr/preprocessPngForOcr.ts`
- **Feature:** `docs/features/ocr-fallback/README.md`
- **VIA MORTA evidència:** `docs/spikes/ocr-gate-loop/iteration-02.md`
