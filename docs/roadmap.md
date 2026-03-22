# Roadmap (esquelet)

Ordre orientatiu; les dates i el detall els fixa el PM. Normativa tècnica i lectura: `llm.txt`, `AGENTS_ARQUITECTURA.md`.

1. **Foundations** ✓: repo, frontend canònic buit, docs, CI, Docker.
2. **Feature 0** ✓ (pivot aplicat): **viabilitat de plantilla per regions de resposta** — `validateTemplateFeasibility`, contracte `ok|ko` + `answer_regions`, stub + ruta LLM local (Vite), demo `/demo/feature0`, PDF text embegut. Pendent: coordenades de pàgina reals, backend fora del middleware Vite.
3. **Feature 1 — `question-answer-extraction`** ✓ (MVP validat): contracte `domain/…`, servei **`qae-api`** permanent a Docker, **nginx proxy invers** (`/api/…` → `qae-api:8787`, sense ports addicionals), demo UI **`/demo/qae`**. Detecció tolerant de marcadors (3 nivells regex). Separació enunciat/resposta per patró de puntuació. Validat amb 4 PDFs reals (122 tests). Limitacions conegudes documentades a `ESTAT.md`.
4. **Properes iteracions** (pendent PM): millorar OCR molt brut (alumne4); postprocessat LLM; coordenades reals Feature 0; backend de producció fora de Vite.

Actualitzacions d’aquest fitxer quan canviï el pla de producte.
