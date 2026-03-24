# Feature 0.4 — Gate de qualitat semàntica OCR: validació

**Data:** 2026-03-24
**Context:** Resultat del Spike 3.D + implementació del gate

---

## Problema original

Spike 3.D va demostrar que el canal `text` era **no estable** (33% concordança GPT/Claude).
La causa: el router calculava soroll de caràcters amb `\p{L}` — tots els caràcters alfanumèrics
comptaven com a "nets" — però textos com `CRERTE T10y5. ferp ll` (soroll 0%) eren semànticament
il·legibles: els models no podien inferir cap intenció SQL.

## Solució implementada

Nou servei `detectSemanticOcrQuality.ts` que analitza el text a nivell de tokens:

1. **SQL fuzzy signal** — presència de tokens que s'assemblen a paraules clau SQL/DDL
   (tolerant a errors OCR: `CREAT`, `TABL`, `PRIMANY`, `REFERENC`...)
2. **Gibberish token ratio** — rati de tokens probablement corruptes (3 heurístiques:
   dígit al mig de lletres, consonant-run ≥4, vocal-ratio < 20%)
3. **Decisió combinada** — un text sense senyal SQL (0 tokens fuzzy) i amb
   identificadors "plausibles" és `unreadable` (OCR corrupte semànticament o zona errònia)

Integrat a `routeQuestionForEvaluation` com a **Regla 4** (après del filtre de soroll
de caràcters, abans de retornar `'text'`).

## Resultats de validació (3 PDFs reals, 36 preguntes)

| Alumne | Total Q | → text | → skip | % filtrades |
|--------|---------|--------|--------|-------------|
| alumne-2 | 14 | 11 | 3 | 21% |
| alumne-3 | 12 | 10 | 2 | 17% |
| alumne-1 | 10 | 8 | 2 | 20% |
| **Total** | **36** | **29** | **7** | **19%** |

**Spike 3.D (sense gate):** 36/36 → text (0% filtrades)
**Ara amb gate:** 29/36 → text, 7/36 → skip (**19% de falsos `ok` eliminats**)

## Casos filtrats (tots `ocr_status='ok'` però semànticament il·legibles)

| Q | Alumne | Motiu |
|---|--------|-------|
| Q1 | alumne-2 | Cap senyal SQL. Text: `CRERTE T10y5. ferp ll / Corda VT PO MN Y...` |
| Q9 | alumne-2 | Cap senyal SQL. Text corrupte sense intenció SQL |
| Q13 | alumne-2 | Cap senyal SQL. Text corrupte |
| Q11 | alumne-3 | Cap senyal SQL. Text corrupte |
| Q13 | alumne-3 | Cap senyal SQL. Text corrupte |
| Q5 | alumne-1 | Cap senyal SQL. Text corrupte |
| Q8 | alumne-1 | Cap senyal SQL. Text corrupte |

## Verificació: no es maten casos útils

Cap cas de text SQL net ha estat filtrat. Els textos amb SQL reconeixible (akàr amb
variants OCR lleus: `CREAT`, `TABL`, `PRIMANY`) passen correctament al canal `text`.

Exemples que segueixen passant:
- `CREATE TABLE Habitacio (numHabitacio INT PRIMARY KEY...)` → `usable`
- `CREAT TABL Tractament (idTractament INT PRIMAR KEY...)` → `usable`
- `INSERT INTO Pacient VALUES (...)` → `usable`

## Diagnòstic

El gate resol el problema identificat al Spike 3.D:

> El sistema confonia "text tècnicament present" amb "text semànticament usable"

Ara el pipeline distingeix:
- **OCR present + senyal SQL recognoscible** → `text` (avaluable)
- **OCR present però 0 senyal SQL** → `unreadable` → `skip` (no avaluable)

## Limitació coneguda

El gate no detecta el cas "text d'alumne sense coneixement SQL" (ex: un alumne que
escriu text lliure en català sense cap paraula clau SQL). En aquest cas, el text seria
filtrat correctament perquè no hi ha intenció SQL — que és el comportament desitjat,
ja que no hi hauria res avaluable per a un grader SQL.
