# MVP — Question-aligned answer text extraction (text-first)

**Nom de la feature (repo):** `question-answer-extraction`  
**Versió del document:** 1.0 (definició prèvia al codi)  
**Filosofia:** prioritzar **text correcte + assignació a pregunta**; no geometria perfecta ni crops precisos.

---

## 1) Problema que resol

Donat un **examen real d’alumne** (PDF, sovint escanejat):

- extreure el **text de les respostes** per a preguntes **textuals**;
- saber **a quina pregunta** correspon cada fragment (`question_id` → `answer_text`);
- fer-ho amb **errors visibles** (no silenciosos) i **minimització de dades** respecte a processar la pàgina sencera sense criteri.

Aquest MVP **no** pretén suport universal ni resolució de tots els formats; és orientat a **aprendre amb exàmens reals** i iterar.

---

## 2) Principi clau (MVP)

- **Text-first:** el valor principal és el text de resposta alineat a pregunta.
- **Scan-first:** s’assumeix OCR quan no hi ha text embegut usable.
- **Sense** alineació geomètrica forta, **sense** template-first obligatori, **sense** crops perfectes, **sense** multimodal complet en aquest pas.

---

## 3) Input (conceptual)

```ts
{
  studentExam: PDF | scanned PDF
}
```

Ús previst: un sol document per execució del pipeline MVP (detalls de transport HTTP / mida / autenticació → tasca d’implementació).

---

## 4) Output MVP (contracte de documentació)

> **Nota:** això és el contracte **conceptual** per a producte i agents. La implementació en TypeScript/Zod anirà a `domain/` quan obriu la tasca corresponent.

```ts
type QuestionAnswerExtractionResult = {
  questions: Array<{
    question_id: string
    status: 'ok' | 'empty' | 'unsupported' | 'error'
    answer_text?: string
    confidence?: 'high' | 'medium' | 'low'
    debug?: {
      page_index?: number
      raw_block_text?: string
    }
  }>
}
```

---

## 5) Semàntica dels `status` (decisions de domini)

| Valor | Significat |
|-------|------------|
| **`ok`** | S’ha pogut associar un bloc de resposta textual a `question_id` amb text usable (segons llindars del MVP). |
| **`empty`** | La pregunta s’ha detectat o s’espera en aquest slot, però el bloc és buit, massa curt o només soroll; **no** és un fallament tècnic del pipeline. |
| **`unsupported`** | El cas no entra al MVP amb garanties raonables: p. ex. baixa densitat textual, OCR incoherent, presència clara de contingut no textual (dibuix) com a resposta principal — **decisió de producte / heurística**, no excepció runtime. |
| **`error`** | Fallada tècnica o invariant trencat (p. ex. error OCR, PDF il·legible, timeout): cal poder diagnosticar sense confondre amb `empty`. |

**Regles explícites:**

- **`empty` no és `error`.**
- **`unsupported` vs `error`:** `unsupported` = “fora de capacitat MVP”; `error` = “ha fallat una peça tècnica”.
- **`confidence`:** opcional; **no obligatori** en la primera iteració d’implementació. Si existeix, ha de reflectir incertesa agregada (p. ex. qualitat OCR), no una promesa legal.
- **`debug`:** només en **dev/preview** o sota **flag explícit**, per **minimització de dades**; no exposar per defecte en producció sense decisió de PM.

---

## 6) Abast MVP (ENTRA)

- OCR del document (pàgina completa o blocs, segons decisió tècnica posterior).
- Detecció de preguntes (numeració / patrons tipus `1.`, `2)`, `Pregunta 3`, etc.).
- Segmentació per pregunta basada en **ordre**, **proximitat** i **heurístiques simples** sobre text (post-OCR).
- Extracció de text per resposta i associació **`answer → question_id`**.
- Preguntes **textuals** com a focus; acceptació de limitacions en mixtes/dibuixos (reflectides en `unsupported` o `empty`).

---

## 7) Fora d’abast (MVP)

- Geometria perfecta, alignment fi, crops precisos.
- Template obligatori o `answer_regions` com a prerequisit.
- Classificació completa `text | mixed | blank` com a producte madur.
- Suport complet a dibuixos, esquemes o respostes multimodals avançades.
- Correcció automàtica de contingut.
- Anonimització perfecta de PII.

---

## 8) Minimització de dades i PII

- El sistema ha de treballar preferentment sobre **blocs de resposta**, no sobre el document sencer sense segmentar.
- Es pot intentar **reduir** exposició de capçaleres i zones típiques d’identificació mitjançant heurístiques de text (sense prometre èxit).
- **No es promet 0 PII** dins del text de resposta: el professorat pot escriure dades personals dins la resposta; es promet **minimització forta** respecte a “enviar tota la pàgina en brut” sense necessitat operativa.

---

## 9) Relació amb Feature 0 (template-inference)

| | Feature 0 | question-answer-extraction |
|--|-----------|----------------------------|
| **Entrada** | Plantilla del professor (PDF/text) | Examen de l’alumne (scan/PDF) |
| **Objectiu** | Viabilitat per **regions** (`ok`/`ko`, `answer_regions`) | Text de **resposta per pregunta** |
| **OCR** | Fora d’abast (text embegut) | **Dins** l’abast MVP |
| **Dependència** | — | **No necessària** per al primer MVP; Feature 0 continua útil per plantilles i futurs camins híbrids opcionals |

Feature 0 **no es llença**; aquesta vertical és **nova**, no una extensió improvisada del mateix contracte.

---

## 10) Pipeline conceptual (MVP)

```text
examen alumne (PDF/scan)
  → OCR (pàgina o blocs)
  → detectar preguntes (patrons + ordre)
  → segmentar text entre preguntes
  → extreure answer_text per question_id
  → QuestionAnswerExtractionResult
```

---

## 11) Riscos (producte)

1. **OCR dolent** (manuscrit, scan de baixa qualitat) → molts `empty` / `low` confidence / `unsupported`.
2. **Segmentació incorrecta** → assignació errònia `question_id` (cal transparència via `confidence` i `debug` controlat).
3. **Variabilitat de format** entre exàmens → cap “solució universal” en aquest MVP.

---

## 12) Criteris d’èxit (MVP)

Per un examen real representatiu:

- es detecten preguntes amb prou freqüència per ser útil;
- es poden extreure respostes textuals alineades de forma **usable**;
- el mapping `question_id → answer_text` és **revisable** per un humà;
- els errors són **visibles** (`empty`, `unsupported`, `error`) i **no silenciosos**.

---

## 13) Open decisions before implementation

**No resoltes en aquest document** — cal decidir abans o durant la primera tasca de codi:

1. **OCR:** motor local (p. ex. Tesseract a Node) vs servei extern (cost, latència, **flux de dades personals**, DPA).
2. **Rasterització PDF → imatge:** eina i pila (p. ex. pdf.js + canvas, CLI, altre); implicacions Docker/Alpine.
3. **Detecció de preguntes:** només regex sobre text pla vs OCR per blocs vs pipeline híbrid.
4. **“Textual enough”:** llindars mínims de caràcters, ratio de caràcters reconeguts, o mètriques per classificar `empty` vs `ok`.
5. **Nivell de `debug`:** què es pot registrar en producció (si res) vs dev/preview.

---

## 14) Futur (si el MVP es queda curt)

Només si cal: reintroduir **plantilla** com a suport, **alignment** o **regions** de Feature 0, o passar a enfocs **multimodals** (imatge + text). Aquest document no els presuposa.
