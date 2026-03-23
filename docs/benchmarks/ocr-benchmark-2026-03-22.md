# Benchmark OCR — Feature 1 QAE

**Data:** 2026-03-22
**Configuracions:** Tesseract.js WASM (4 variants) + Tesseract CLI natiu (2 variants)

## Taula de resultats

| PDF | Esperat | baseline | cat_spa | psm6 | cat_spa_p6 | cli_cat | cli_cat_spa |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ex_alumne1.pdf | 10 | 9 ⚠️ | 11 ⚠️ | 10 ⚠️ | 10 ⚠️ | 9 ⚠️ | 10 ⚠️ |
| ex_alumne2.pdf | 14 | 14 ⚠️ | 14 ⚠️ | 14 ⚠️ | 14 ⚠️ | 12 ⚠️ | 13 ⚠️ |
| ex_alumne3.pdf | 12 | 13 ⚠️ | 13 ⚠️ | 12 ⚠️ | 11 ⚠️ | 13 ⚠️ | 13 ⚠️ |
| ex_alumne4.pdf | 10 | 15 ⚠️ | 16 ⚠️ | 10 ⚠️ | 9 ⚠️ | 15 ⚠️ | 15 ⚠️ |

`⚠️` = bloc gegant detectat (>500 chars text net)

**Nota sobre alumne4:** el recompte >10 indica **falsos positius** del regex tolerant sobre text OCR molt brut. Tots els blocs segueixen sent gegants — la segmentació és incorrecta independentment del motor o idioma.

**Configuracions:**
- `baseline`: Tesseract.js WASM, `cat`, PSM AUTO (3) — referència actual
- `cat_spa`: Tesseract.js WASM, `cat+spa`, PSM AUTO (3)
- `psm6`: Tesseract.js WASM, `cat`, PSM SINGLE_BLOCK (6)
- `cat_spa_p6`: Tesseract.js WASM, `cat+spa`, PSM SINGLE_BLOCK (6)
- `cli_cat`: Tesseract CLI natiu (5.5.1), `cat`, PSM AUTO (3)
- `cli_cat_spa`: Tesseract CLI natiu (5.5.1), `cat+spa`, PSM AUTO (3)

## Fragments crítics (answer_text)

### ex_alumne4.pdf (cas dur — escaneig molt brut)
**Q2:**
- `baseline`: ser. CALA) PRIAN xo, AA NRRRULS), v CAPAOAS VARCARRLU IO) v ee SNC NOX NULL, ONCE PARRA LO) NOY NOLL, NmEÓ TN NOS LL. CA
- `cat_spa`: Nte CALA) PRIAN we, Exa NARENAQIAS), y CoNo VARCARRLU IO) y e TNT NOT NULL, CoONVEX PARRA LO) NOY NULL, numaio INT NOS (
- `cli_cat`: arr . CAA PRIMAN \«ew, AA \\C\Q\Q\\ÀQ\\'JQ\\ CAPAAS VARARRUO) / Q SE NOX. NULL, OEL \\L\Q\Q\À"Q\\')_g NOY "\)\.\_ AmÓ TN
- `cli_cat_spa`: Ne . CAA PRIMAN \«ew, Xa \\C\Q\Q\\ÀQ\\'JQ\\ Cn VARARRUO) y c TN NO WULL, CaONVEX \\L\Q\Q\À"Q\\')_g NOY "\)\.\_ aO TNT NO

**Q3:**
- `baseline`: Creació Taula 3 (Habitacio) amb les restriccions corresponents. (1,5 puny Ú DN
- `cli_cat`: Creació Taula 3 (Habitacio) amb les restriccions corresponents. (1,5 PU Ys P

**Q4:**
- `baseline`: 0.5 IE IS RE lNSe. Vetge CAR) PLSARA RC, (A JARC A At 1o ds ls A duà NAREMAAÇ Se)…
- `cli_cat`: O0.5 IEET I aRa lNSE. Vetge CAMA) OSA RC ( JA A A Io \) LèA duA NAREMAAÇSo)…

### ex_alumne2.pdf (cas bo de referència)
**Q7:**
- `baseline`: u 3 ti 50, INSEOT INTO hespidel VILVES (4. 1 OQVOL dant Vam 4322 23344').
- `cat_spa`: " N ti 50, INSERT INTO hospital VILUES(4 1 901 y Sart Van 932223344'):
- `cli_cat`: (no detectat)
- `cli_cat_spa`: (no detectat)

## Decisió

**Resultat:** ❌ **Tesseract CLI natiu NO millora els casos crítics.**

El text OCR d'`ex_alumne4` és soroll pur amb tots els motors i configuracions provats. CLI natiu (Tesseract 5.5.1) produeix resultats equivalents a WASM — el wrapper no era el bottleneck.

**Conclusió:** el problema és la **qualitat d'entrada** (escaneig molt brut, baixa resolució, distorsió), no el motor ni la configuració.

**Opcions restants (per ordre de cost/risc):**

1. **Preprocessing d'imatge** (contrast, binarització, deskew) abans d'OCR — atacar la causa real
2. **Acceptar limitació** — documentar alumne4 com a fora d'abast del MVP per qualitat d'escaneig insuficient

**Restricció de privacitat:** tot el processament ha de ser LOCAL. Cap API cloud (Google Vision, AWS Textract, etc.) és acceptable — els PDFs contenen dades personals d'alumnes.

**Propera tasca:** decidir entre preprocessing d'imatge o acceptar la limitació com a restricció de disseny documentada.
