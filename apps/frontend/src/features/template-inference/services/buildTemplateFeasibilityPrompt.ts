/**
 * Prompt mínim: el model proposa un objecte JSON d’esborrany de viabilitat de plantilla (regions de resposta).
 */
export function buildTemplateFeasibilityPrompt(documentTextSnippet: string): string {
  return `A partir del text següent (fragment de la plantilla d’examen del professor), inferir un únic objecte JSON.

Camps:
- layout_stable (boolean, opcional): false només si el layout és clarament inestable per delimitar àrees; si no n’hi ha dubte, true o omet.
- prompt_answer_regions_not_separable (boolean, opcional): true si enunciat i resposta estan massa barrejats per proposar caixes de resposta fiables.
- answer_regions: array de { "question_id": string, "page": número enter ≥1, "bbox": { "x","y","w","h" números entre 0 i 1 (coordenades normalitzades a la pàgina) } }.

Regles:
- Respon NOMÉS amb l’objecte JSON, sense markdown ni text al voltant.
- Si no pots proposar regions fiables, answer_regions buit i indica amb prompt_answer_regions_not_separable o layout_stable segons el cas.
- Una entrada per pregunta i pàgina (question_id únic per pàgina).

Text de la plantilla:
---
${documentTextSnippet}
---`
}
