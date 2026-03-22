# Benchmark OCR — Feature 1 QAE

**Data:** 2026-03-22
**Configuracions:** `baseline` (langs=cat, psm=3), `cat_spa` (langs=cat+spa, psm=3), `psm6` (langs=cat, psm=6), `cat_spa_p6` (langs=cat+spa, psm=6)

## Taula de resultats

| PDF | Esperat | baseline | cat_spa | psm6 | cat_spa_p6 |
| --- | --- | --- | --- | --- | --- |
| ex_alumne1.pdf | 10 | 9 ⚠️ | 11 ⚠️ | 10 ⚠️ | 10 ⚠️ |
| ex_alumne2.pdf | 14 | 14 ⚠️ | 14 ⚠️ | 14 ⚠️ | 14 ⚠️ |
| ex_alumne3.pdf | 12 | 13 ⚠️ | 13 ⚠️ | 12 ⚠️ | 11 ⚠️ |
| ex_alumne4.pdf | 10 | 15 ⚠️ | 16 ⚠️ | 10 ⚠️ | 9 ⚠️ |

`⚠️` = bloc gegant detectat (>500 chars text net)

**Nota sobre alumne4:** el recompte de marcadors >10 (ex: 15 baseline) indica **falsos positius** del regex tolerant sobre text OCR molt brut — el soroll visual activa el patró `N + paraula d'enunciat` en línies que no són marcadors reals. Tots els blocs segueixen sent gegants, confirmant que la segmentació és incorrecta.

## Fragments crítics (answer_text)

### ex_alumne4.pdf
**Q2:**
- `baseline`: ser. CALA) PRIAN xo, AA NRRRULS), v CAPAOAS VARCARRLU IO) v ee SNC NOX NULL, ONCE PARRA LO) NOY NOLL, NmEÓ TN NOS LL. CA
- `cat_spa`: Nte CALA) PRIAN we, Exa NARENAQIAS), y CoNo VARCARRLU IO) y e TNT NOT NULL, CoONVEX PARRA LO) NOY NULL, numaio INT NOS (
- `psm6`: me —— ———— o 45 RE. RR CIMRA el, vam NARMAQUS), / CA ADINS VRRC ANIOL, ce SNY NOX NULL, RONVEL NARRRRCIO) NOx NOLL, NaCO
- `cat_spa_p6`: — — — 0.35 Ne RR PAIMAAY el, exa VARAS), Y tapas VRRC ANIOL, y ce TNT NO4 NULL, CONVE NARENARCAO) Nox NULL, Numa INT NOX

**Q3:**
- `baseline`: Creació Taula 3 (Habitacio) amb les restriccions corresponents. (1,5 puny Ú DN
- `cat_spa`: Creació Taula 3 (Habitacio) amb les restriccions corresponents. (1,5 pun) q a
- `psm6`: OOL,S Ri o iaio i i po ral SOGN 0 ta32294, Mu J
- `cat_spa_p6`: Creació Taula 3 (Habitacio) amb les restriccions corresponents (1,5 | q I a - "o Punts) l Mara TABLE Ut o ( es amblsdcéc

**Q4:**
- `baseline`: 0.5 IE IS RE lNSe. Vetge CAR) PLSARA RC, (A JARC A At 1o ds ls A duà NAREMAAÇ Se), EI LNT, FORCL NS VEY (AN RLELREANES V
- `cat_spa`: 0.5 IE IS RE | NE. MEtge CAR) OQTANAY KO, A JARC ARIS ds ls A AA NAREMAAÇ Se), EI INT, FORT NO VEY (AN MECENENICES Veg L
- `psm6`: (no detectat)
- `cat_spa_p6`: (no detectat)

### ex_alumne2.pdf
**Q7:**
- `baseline`: u 3 ti 50, INSEOT INTO hespidel VILVES (4. 1 OQVOL dant Vam 4322 23344').
- `cat_spa`: " N ti 50, INSERT INTO hospital VILUES(4 1 901 y Sart Van 932223344'):
- `psm6`: 233 : 3 ' J 4322 23344').
- `cat_spa_p6`: 233 : 3 ' J 932223344'):


## Decisió

**Baseline (alumne4):** 15 marcadors, bloc gegant: true

⚠️ **EXPLORAR CANVI DE MOTOR** — cap config millora ≥2 marcadors a alumne4 (millor: cat_spa amb 16 marcadors).

**Propera tasca:** avaluar motor OCR alternatiu LOCAL (ex: Tesseract CLI natiu, easyocr local, paddleocr local). **Cap API cloud — dades personals d'alumnes.**
