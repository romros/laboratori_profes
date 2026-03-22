# Roadmap (esquelet)

Ordre orientatiu; les dates i el detall els fixa el PM. Normativa tècnica i lectura: `llm.txt`, `AGENTS_ARQUITECTURA.md`.

1. **Foundations** (fet): repo, frontend canònic buit, docs, CI, Docker.
2. **Feature 0** (en curs, pivot aplicat): **viabilitat de plantilla per regions de resposta** — `validateTemplateFeasibility`, contracte `ok|ko` + `answer_regions`, stub + ruta LLM local (Vite), demo `/demo/feature0`, PDF text embegut. _Següent: coordenades de pàgina reals, backend fora del middleware._
3. **`question-answer-extraction`** (spike pas 2 fet): OCR `cat`, deduplicació de marcadors, segmentació amb tall suau i neteja de peus; `npm run spike:qae` (veure `docs/ESTAT.md`). Pas 3: contracte `domain/` + producte estable.
4. **Altres** (pendent): segons prioritat (p. ex. preprocessing, privacitat, millores de plantilla).

Actualitzacions d’aquest fitxer quan canviï el pla de producte.
