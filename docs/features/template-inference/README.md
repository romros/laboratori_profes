# Feature 0 — Template Inference & Layout Mapping

**Estat: MVP complet (dues capes funcionals)**

---

## Visió general

Feature 0 permet al professor extreure les respostes dels alumnes organitzades per pregunta, usant el template de l'examen com a guia. No requereix marcadors numèrics al document de l'alumne — funciona per coincidència de text d'enunciat (anchors).

---

## Capa 1 — Viabilitat de plantilla

Valida si un PDF de template del professor permet proposar regions de resposta per pregunta.

**Sortida:** `status: 'ok' | 'ko'`, `reasons`, `answer_regions` (si ok)

**Components:**
- `domain/template-inference/template_feasibility.schema.ts` — contracte
- `features/template-inference/validateTemplateFeasibility.ts` — validador
- Ruta HTTP: `/api/feature0/analysis` (stub) i `/api/feature0/analysis/llm` (LLM local)
- Demo: `/demo/feature0`

**Limitació pendent:** coordenades físiques x/y reals; backend de producció fora de Vite.

---

## Capa 2 — Layout Mapping (MVP complet)

A partir d'un scan d'alumne i el template del professor, extreu el text de resposta per cada pregunta.

**Pipeline:**
```
OCR → detectTemplateQuestionAnchors → verifyScanMatchesTemplate
    → deriveAnswerZonesFromAnchors → cleanAnswerZoneText
    → buildTemplateMappedAnswers → TemplateMappedAnswersResult
```

**Contracte oficial de sortida:**
```typescript
// domain/template-mapped-answers/templateMappedAnswers.schema.ts
TemplateMappedAnswersResult {
  is_match: boolean
  confidence: number   // [0,1]
  reason: 'enough_anchors_detected' | 'too_few_anchors' | 'wrong_exam' | 'ocr_too_noisy'
  questions: TemplateMappedAnswer[]  // un per pregunta del template, en ordre
}

TemplateMappedAnswer {
  question_id: string
  is_detected: boolean
  match: { similarity: number; confidence: number }
  anchor: { page_index: number|null; line_index: number|null }
  range: { start_page_index, start_line_index, end_page_index, end_line_index }
  answer_text_raw: string    // text OCR brut de la zona
  answer_text_clean: string  // text net (boilerplate eliminat)
  warnings: Array<'not_detected'|'low_similarity'|'anchor_shared'|'long_range'>
}
```

**Ús:**
```typescript
import { buildTemplateMappedAnswers } from 'features/template-answer-zones/services/buildTemplateMappedAnswers'
const result = buildTemplateMappedAnswers(templateQuestions, ocrPages)
```

**Resultats validats (4 PDFs reals):**

| PDF | is_match | confidence | detectades | notes |
|-----|----------|------------|------------|-------|
| ex_alumne1.pdf | ❌ NO MATCH | 0.32 | 6/15 | examen diferent — rebutjat correctament |
| ex_alumne2.pdf | ✅ MATCH | 0.83 | 15/15 | totes detectades |
| ex_alumne3.pdf | ✅ MATCH | 0.83 | 14/15 | Q8 no detectada (OCR) |
| ex_alumne4.pdf | ✅ MATCH | 0.76 | 13/15 | Q11, Q13 no detectades (OCR brut) |

**Components:**
- `features/template-anchor-detection/detectTemplateQuestionAnchors.ts` — keyword overlap matching
- `features/template-verification/verifyScanMatchesTemplate.ts` — ratio + similarity → is_match
- `features/template-answer-zones/deriveAnswerZonesFromAnchors.ts` — rangs lògics pàgina/línia
- `features/template-answer-zones/cleanAnswerZoneText.ts` — filtre boilerplate conservador (protecció SQL)
- `features/template-answer-zones/services/buildTemplateMappedAnswers.ts` — orquestrador
- `features/template-answer-zones/isGraphicalAnswer.ts` — hook privadesa per respostes gràfiques
- `features/template-debug/ui/TemplateDebugPage.tsx` — UI debug intern (`/debug/template`)

**Harness:** `npm run spike:template-mapped-answers` (des de `apps/frontend`)

**Tests:** 202 tests totals (cobertura: anchor detection, verification, zones, cleanup, builder, isGraphicalAnswer)

---

## Limitacions conegudes (MVP)

| Limitació | Impacte | Decisió |
|-----------|---------|---------|
| OCR manuscrit molt degradat | text il·legible → `answer_text` és soroll | Fora d'abast MVP; millora requereix canvi d'estratègia OCR |
| Anchors compartits (Q4/Q5 alumne2) | warning `anchor_shared` → rang potencialment incorrecte | Documentat; no bloquejant per MVP |
| Sense coordenades físiques x/y | no es pot fer crop precís d'imatge | Pendent si PM ho requereix per correcció visual |
| Sense scoring | `answer_text_clean` és text, no nota | Feature 2 |

---

## Privadesa

Tot el pipeline és **local** (OCR local, sense enviament de PDFs d'alumnes a cap servei extern). Veure `docs/privacy/PRIVACY_ARCHITECTURE.md` §8 per la distinció textual/gràfic i el hook `isGraphicalAnswer`.

---

## Fora d'abast (MVP)

- Scoring / correcció automàtica → Feature 2
- Coordenades físiques bbox → pendent PM
- Export / persistència → pendent PM
- UI final de corrector → pendent PM
