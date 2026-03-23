# Benchmark OCR — Feature 1 QAE

Tres rondes comparatives executades sobre els 4 PDFs reals.

---

## Ronda 1 — Tesseract.js WASM: tuning de paràmetres (2026-03-22)

**Configuracions:** `baseline` (cat, PSM3), `cat_spa` (cat+spa, PSM3), `psm6` (cat, PSM6), `cat_spa_p6` (cat+spa, PSM6)

| PDF | Esperat | baseline | cat_spa | psm6 | cat_spa_p6 |
| --- | --- | --- | --- | --- | --- |
| ex_alumne1.pdf | 10 | 9 ⚠️ | 11 ⚠️ | 10 ⚠️ | 10 ⚠️ |
| ex_alumne2.pdf | 14 | 14 ⚠️ | 14 ⚠️ | 14 ⚠️ | 14 ⚠️ |
| ex_alumne3.pdf | 12 | 13 ⚠️ | 13 ⚠️ | 12 ⚠️ | 11 ⚠️ |
| ex_alumne4.pdf | 10 | 15 ⚠️ | 16 ⚠️ | 10 ⚠️ | 9 ⚠️ |

**Conclusió:** cap variant millora els blocs gegants. El tuning de paràmetres WASM no és suficient.

---

## Ronda 2 — Tesseract CLI natiu 5.5.1 vs WASM (2026-03-22)

**Configuracions:** `cli_cat` (CLI, cat, PSM3), `cli_cat_spa` (CLI, cat+spa, PSM3) vs baseline WASM

| PDF | Esperat | baseline | cli_cat | cli_cat_spa |
| --- | --- | --- | --- | --- |
| ex_alumne1.pdf | 10 | 9 ⚠️ | 9 ⚠️ | 10 ⚠️ |
| ex_alumne2.pdf | 14 | 14 ⚠️ | 12 ⚠️ | 13 ⚠️ |
| ex_alumne3.pdf | 12 | 13 ⚠️ | 13 ⚠️ | 13 ⚠️ |
| ex_alumne4.pdf | 10 | 15 ⚠️ | 15 ⚠️ | 15 ⚠️ |

**Conclusió:** CLI natiu (Tesseract 5.5.1) dona resultats equivalents o pitjors que WASM. El wrapper no era el bottleneck.

---

## Ronda 3 — Preprocessing d'imatge (grayscale + contrast + threshold) (2026-03-23)

**Configuracions:** `pre_cat` (WASM+pre, cat), `pre_cat_spa` (WASM+pre, cat+spa), `pre_cli_cat` (CLI+pre, cat)

Preprocessing aplicat: grayscale → contrast boost (factor 0.3) → threshold (128) via `@napi-rs/canvas`.

| PDF | Esperat | baseline | pre_cat | pre_cat_spa | pre_cli_cat |
| --- | --- | --- | --- | --- | --- |
| ex_alumne1.pdf | 10 | 9 ⚠️ | 8 ⚠️ | 8 ⚠️ | 7 ⚠️ |
| ex_alumne2.pdf | 14 | 14 ⚠️ | 14 ⚠️ | 13 ⚠️ | 14 ⚠️ |
| ex_alumne3.pdf | 12 | 13 ⚠️ | 13 ⚠️ | 13 ⚠️ | 12 ⚠️ |
| ex_alumne4.pdf | 10 | 15 ⚠️ | 12 ⚠️ | 14 ⚠️ | 12 ⚠️ |

`⚠️` = bloc gegant detectat (>500 chars text net)

**Nota sobre alumne4:** el recompte >10 indica **falsos positius** del regex tolerant sobre text OCR molt brut. Tots els blocs segueixen sent gegants.

### Fragments crítics — Ronda 3

**ex_alumne4.pdf Q2:**
- `baseline`: ser. CALA) PRIAN xo, AA NRRRULS), v CAPAOAS VARCARRLU IO)…
- `pre_cat`: QQUANC RADIC pea I er CN QLA) Desa RJ MO, AE NARCAACGE)…  ← pitjor

**ex_alumne4.pdf Q3:**
- `baseline`: Creació Taula 3 (Habitacio) amb les restriccions corresponents. (1,5 puny…
- `pre_cat`: Creació Taula 3 (Habitacio) amb les restriccions corresponents. (15 puny, Q A o I…  ← lleument pitjor

**ex_alumne2.pdf Q7 (cas bo de control):**
- `baseline`: u 3 ti 50, INSEOT INTO hespidel VILVES (4. 1 OQVOL dant Vam 4322 23344').
- `pre_cat`: 4, INSEUT IVIO hecpdel VaLUC 5 ( 4. ' OO) / Sau t Yan, 6) 432223344')…  ← pitjor

**Conclusió:** el preprocessing binaritza massa agressivament i destrueix informació útil. Empitjora els casos bons sense millorar els dolents.

---

## Decisió final — Tancament iteració OCR

**Data:** 2026-03-23

Tres rondes de benchmark han tancat totes les hipòtesis de millora barata:

| Hipòtesi | Resultat |
|----------|----------|
| Tuning WASM (idioma, PSM) | ❌ No millora |
| Tesseract CLI natiu | ❌ Equivalent a WASM |
| Preprocessing d'imatge simple | ❌ Empitjora casos bons |

**Causa arrel confirmada:** la qualitat d'escaneig d'`ex_alumne4` és insuficient per a qualsevol motor Tesseract, amb o sense preprocessing simple.

**Decisió:** ✅ **TANCAR la iteració OCR del MVP**

`ex_alumne4` (i casos similars d'escaneig molt brut) queda documentat com a **limitació coneguda del MVP**.

**Restricció de privacitat:** tot el processament ha de ser LOCAL. Cap API cloud acceptable — els PDFs contenen dades personals d'alumnes.

**Codi:** `preprocessPngForOcr.ts` i `tesseractCliOcrPng.ts` es conserven a `infrastructure/ocr/` com a eines de benchmark reutilitzables, però **no s'integren al pipeline de producció**.
