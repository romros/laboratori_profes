# Roadmap (esquelet)

Ordre orientatiu; les dates i el detall els fixa el PM. Normativa tècnica i lectura: `llm.txt`, `AGENTS_ARQUITECTURA.md`.

1. **Foundations** (fet): repo, frontend canònic buit, docs, CI, Docker.
2. **Feature 0** (en curs, pivot aplicat): **viabilitat de plantilla per regions de resposta** — `validateTemplateFeasibility`, contracte `ok|ko` + `answer_regions`, stub + ruta LLM local (Vite), demo `/demo/feature0`, PDF text embegut. *Següent: coordenades de pàgina reals, backend fora del middleware.*
3. **`question-answer-extraction`** (definició feta, implementació pendent): examen d’alumne escanejat → OCR + segmentació per pregunta → `question_id` + `answer_text` + `status` (text-first; **no** depèn del primer MVP de Feature 0). Docs: `docs/features/question-answer-extraction/`.
4. **Altres** (pendent): segons prioritat (p. ex. preprocessing, privacitat, millores de plantilla).

Actualitzacions d’aquest fitxer quan canviï el pla de producte.
