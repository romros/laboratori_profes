# OCR Gate Loop — Iteració 2/4

**Data:** 2026-03-24
**Dataset:** `dataset.json` — 36 preguntes (congelat, igual que iter 1)
**Gate:** anàlisi de simulació sobre output `iteration-01-output.json`
**Nota:** aquesta iteració és una anàlisi exhaustiva de hipòtesis, no una implementació.
  La implementació es descarta perquè cap hipòtesi simulada arriba al llindar.

---

## Hipòtesi testada

**Hipòtesi iter 1:** afegir `plausibleIdentifierRatio ≥ 0.40` com a llindar addicional
al router per filtrar textos amb pocs identificadors llegibles.

**Resultat de simulació:**

| Llindar | Precision | FP rate | Recall |
|---------|-----------|---------|--------|
| ≥ 0.30 | 33.3% | 66.7% | 100% |
| ≥ 0.40 | 35.5% | 64.5% | 100% |
| ≥ 0.50 | 33.3% | 66.7% | 90.9% |
| ≥ 0.55 | 29.6% | 70.4% | 72.7% |
| ≥ 0.60 | 30.4% | 69.6% | 63.6% |
| ≥ 0.70 | 33.3% | 66.7% | 36.4% |

**Conclusió:** `plausibleIdentifierRatio` no discrimina TP de FP.
Distribució: TP avg=0.63, FP avg=0.61. No hi ha llindar útil.

---

## Hipòtesis addicionals simulades

### H2: sql_signals ≥ N → text, resta → skip

| Llindar | Precision | FP rate | Recall |
|---------|-----------|---------|--------|
| sql ≥ 1 | 33.3% | 66.7% | 45.5% |
| sql ≥ 2 | 33.3% | 66.7% | 45.5% |
| sql ≥ 3 | 40.0% | 60.0% | 36.4% |

### H3: sql ≥ N AND sem=usable → text

| Llindar | Precision | FP rate | Recall |
|---------|-----------|---------|--------|
| sql ≥ 2 AND usable | 33.3% | 66.7% | 45.5% |
| sql ≥ 3 AND usable | 40.0% | 60.0% | 36.4% |

**Cap hipòtesi arriba a precision ≥ 70%.**

---

## Diagnòstic definitiu

### Per què les heurístiques no funcionen

Les distribucions de totes les mètriques calculables (plausibleIdentifierRatio,
sql_signals, gibberishRatio, noiseRatio, densitat SQL) son **estadísticament
indistingibles entre TP i FP**:

| Mètrica | TP avg | FP avg |
|---------|--------|--------|
| plausibleIdentifierRatio | 0.63 | 0.61 |
| sql_signals | 1.9 | 2.1 |
| gibberishRatio | 0.05 | 0.03 |
| noiseRatio | 0.02 | 0.02 |

### La causa arrel és estructural

Els FP més difícils (alumne-1_Q1 sql=10, alumne-1_Q2 sql=12, alumne-3_Q2 sql=6)
contenen **moltes keywords SQL correctes** perquè l'OCR captura les paraules clau
`CREATE TABLE ... PRIMARY KEY ... NOT NULL` però deforma completament els noms
de camps i valors. Exemple:

```
alumne-1_Q2 (manual=no, sql=12):
  (OCAÇ TABE Sot o id varhar (16) PRIMARN XEN NOT NU, nom vyarchar (19)...
  → CREATE TABLE reconeixible però valors: "Sot o", "varhar(16)", "PRIMARN XEN"
```

Un grader LLM rep l'estructura però no pot verificar res concret.

**Aquesta distinció requereix comprensió semàntica del contingut, no heurística.**
Cap combinació de comptadors de tokens pot saber si `YPACHAR(A)` és un
nom de camp llegible o corrupte.

### Límit del gate pre-LLM sense context

El gate treballa text→tokens→comptadors. No pot saber:
- Si `gaciemt` és una corrupció acceptable de `pacient` o gibberish total
- Si `varhar(16)` és llegible amb context o inútil sense
- Si l'estructura global té prou informació per al grader

Sense context del domini i sense LLM, cap heurística lleugera pot arribar
a precision ≥ 70% en aquest dataset.

---

## Decisió: anticipar VIA MORTA

Queden 2 iteracions (3 i 4). Per ser honestos:

**Les iteracions 3 i 4 no canviarien el resultat** si continuem amb heurístiques
lleugeres pre-LLM. Hem exhaurit l'espai de característiques discriminants:
plausibleIdentifierRatio, sql_signals, gibberishRatio, noiseRatio, densitat —
cap funciona.

L'única via que podria arribar al llindar seria:
1. **LLM de qualificació OCR** — fer una crida LLM per preguntar "és aquest
   text llegible?" → contradiu el principi de gate pre-LLM sense cost
2. **OCR server-side** — reprocessar els PDFs amb un motor millor
3. **Canal vision** — enviar la imatge directament al grader vision

Cap d'aquestes opcions és una heurística lleugera. Totes impliquen un canvi
d'estratègia que va més enllà d'ajustar el gate actual.

---

## Recomanació de PM

Declarar **VIA MORTA** ara (iteració 2) en lloc d'esperar iteració 4.

**Justificació:** el dataset demostra que el problema no és el llindar del gate,
sinó que el QAE upstream etiqueta com `ok` textos que semànticament no ho són.
Cap heurística post-OCR pot resoldre un problema d'etiquetatge upstream.

Continuar les iteracions 3 i 4 seria autoengany: sabem ja que no hi ha
una heurística simple que funcioni.

---

## Estat del loop

| Iteració | Precision | FP rate | Canvi |
|----------|-----------|---------|-------|
| 1 | 30.6% | 69.4% | Baseline |
| **2** | **~33% (simulat)** | **~67%** | **Hipòtesis simulades — cap funciona** |
| 3 | — | — | No executada — VIA MORTA anticipada |
| 4 | — | — | No executada — VIA MORTA anticipada |

**Decisió final: VIA MORTA**

> "El gate OCR/QAE no arriba al llindar útil. Aquesta línia es tanca i es passa
> a OCR server-side fallback / vision."
