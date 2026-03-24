# OCR Gate Loop — Iteració 1/4

**Data:** 2026-03-24
**Dataset:** `dataset.json` — 36 preguntes reals (alumne-1, alumne-2, alumne-3)
**Gold manual:** `dataset.json` → camp `manual_text_pass` (yes=11, no=25)
**Gate:** `detectSemanticOcrQuality` + `routeQuestionForEvaluation` (commit `0c9f570`)
**Output raw:** `iteration-01-output.json`

---

## Mètriques

| Mètrica | Valor | Llindar | Estat |
|---------|-------|---------|-------|
| Precision bucket text | **30.6%** | ≥ 70% | ❌ |
| FP rate bucket text | **69.4%** | ≤ 20% | ❌ |
| Recall (informatiu) | **100%** | — | — |
| Bucket text | 36/36 | — | — |
| Bucket skip | 0/36 | — | — |

**TP:** 11 &nbsp;&nbsp; **TN:** 0 &nbsp;&nbsp; **FP:** 25 &nbsp;&nbsp; **FN:** 0

---

## Diagnòstic

### Causa principal: el router mai descarta cap cas

Tot va a `route='text'`. Cap pregunta acaba a `skip`. El gate semàntic retorna
`uncertain` en lloc de `unreadable` per a tots els casos marginals (Cas 5 del
refactor domain-agnostic) i el router processa `uncertain` com a `text` si hi
ha algun senyal tècnic (o fins i tot sense senyal, si el `ocr_status='ok'`).

### Distribució dels FP (25 totals)

| Categoria | N | Descripció |
|-----------|---|------------|
| `sem=uncertain` + `sql=0` | 8 | Text sense cap senyal SQL — cap keyword SQL recognoscible |
| `sem=uncertain` + `sql≥1` | 7 | Un senyal SQL parcial però text globalment il·legible |
| `sem=usable` + text corrupte | 10 | Gate diu usable (≥2 signals SQL) però camps corruptes fan el text inservible |

### Patrons concrets

**FP sem=uncertain, sql=0** — exemples purs de text il·legible sense cap senyal:
- `alumne-2_Q7`: `233 : 3 ' J 4322 23344').` — números i signes, 0 SQL
- `alumne-2_Q8`: `3001 4'Asteig de Gràciol, (2, 4344 Ç566 ')` — adreça postal
- `alumne-3_Q13`: `en Ei a. . MG: E mpoTt impertf I sn.` — fragmentari incomprensible
- `alumne-1_Q5`: `ó de ia ta Reserva 070 1 ara CTE` — text parcial sense intenció SQL clara

**FP sem=usable** — el gate detecta ≥2 tokens SQL fuzzy però el text és massa corrupte
per avaluar camps/restriccions concretes:
- `alumne-1_Q2`: sql=12 (tota la línia plena de keywords) però `(OCAÇ TABE Sot o id varhar (16) PRIMARN XEN NOT NU` — estructura recognoscible però valors completament corromputs
- `alumne-3_Q2`: sql=6 però `CREATE TABLE gacient ( mM VANCHAR(A) PRIMARY REY 46 40` — nom de camp incomprensible
- `alumne-1_Q10`: text d'un altre examen (préstec El Quixot), sql=2 per keywords genèriques

### Conclusió del diagnòstic

El gate actual no filtra prou per **tres raons independents**:

1. **Router massa permissiu amb `uncertain`**: status `ok` + sem=`uncertain` → `text`. No hi ha distinció entre "uncertain però acceptablement llegible" i "uncertain perquè és il·legible".

2. **Gate semàntic massa permissiu amb sql_signals**: ≥2 tokens SQL fuzzy → `usable`, però tokens SQL en un text extremament corrupte no garanteixen que el grader pugui extreure informació.

3. **sql_signals compta keywords sense verificar densitat**: un text amb `CREATE TABLE... [20 tokens corruptes]... PRIMARY KEY` compta com `usable` però el contingut real (noms de camps, tipus, valors) és il·legible.

---

## Canvi per a iteració 2

**1 canvi principal:** afegir llindar de `plausibleIdentifierRatio` mínim al router.

**Hipòtesi:** la majoria dels FP tenen una densitat baixa d'identificadors plausibles
(tokens morfològicament llegibles). Si exigim `plausibleIdentifierRatio ≥ 0.40`
per passar a `text`, eliminarem els FP on els tokens SQL hi són però la resta del
text és gibberish o números.

**Implementació proposada:** al router, quan `ocr_status='ok'` i `sem=usable` o `sem=uncertain`,
verificar que `semantic.plausibleIdentifierRatio ≥ 0.40`. Si no arriba, → `skip`.

**Risc:** pot augmentar FN (casos bons que es filtren). Cal mesurar recall.

---

## Estat del loop

| Iteració | Precision | FP rate | Canvi |
|----------|-----------|---------|-------|
| **1** | **30.6%** | **69.4%** | Baseline — gate domain-agnostic sense llindar plausible |
| 2 | — | — | Pendent: llindar `plausibleIdentifierRatio ≥ 0.40` al router |
| 3 | — | — | Pendent |
| 4 | — | — | Pendent (última) |

**Decisió final:** pendent (màxim iteració 4).
