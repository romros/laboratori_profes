# Anàlisi Q11 — Contracte fort passada 1 vs passada 2

Data: 2026-03-23 — Feature 2.2 (contracte fort entre passades)

## El problema

La pregunta 11 de l'examen hospital-DAW és:

> **Enunciat Q11:** "Assignar un tractament anomenat Rehabilitació Cardíaca, amb idTractament 1, per al pacient 12345678A, assignat al metge 98765432B."

El solucionari conté:

```sql
INSERT INTO Tractament (id_tractament, nom) VALUES (1, 'Rehabilitació Cardíaca');
INSERT INTO tractament_pacient_metge (nif_pacient, id_tractament, nif_metge)
VALUES ('12345678A', 1, '98765432B');
```

**Clau:** el nom `tractament_pacient_metge` **no apareix a l'enunciat**. És una decisió d'implementació del solucionari (taula relacional N:M entre Pacient, Tractament i Metge).

## Comportament de passada 1 (correcte)

La passada 1 ha capturat correctament l'`expected_answer` directament del solucionari (fidelitat documental).
Ha marcat `extraction_confidence: 0.95` — la més baixa de les 15 preguntes — i ha afegit una `teacher_style_note`:

> "La resposta model inclou una taula relacional no descrita a l'enunciat"

Això és el comportament esperat del **MODE OPERATIU**: copiar el professor (solucionari), marcar la incertesa, no inventar.

## Problema de passada 2 (pre-Feature 2.2)

A `pass2-after-merge.json` (fixture pre-2.2), el camp `required_elements` de Q11 inclou:

```json
"required_elements": [
  "INSERT INTO Tractament (id_tractament, nom) VALUES (1, 'Rehabilitació Cardíaca')",
  "INSERT INTO tractament_pacient_metge",
  "VALUES ('12345678A', 1, '98765432B')"
]
```

El nom `tractament_pacient_metge` és un **required_element** — però no surt de l'enunciat. Això viola el contracte pedagògic: un alumne que creï una taula equivalent amb nom diferent (p.ex. `Tractament_Metge_Pacient`) tindria la relació N:M correcta però "fallaria" el required_element.

## Contracte corregit (Feature 2.2)

Amb el nou **MODE PEDAGÒGIC** del prompt de passada 2, la passada 2 **hauria** de generar:

```json
"required_elements": [
  "Existència d'una sentència INSERT per crear el tractament amb id 1 i nom 'Rehabilitació Cardíaca'",
  "Existència d'una taula relacional N:M que vinculi pacient (12345678A), tractament (1) i metge (98765432B)"
],
"accepted_variants": [
  "tractament_pacient_metge (nom usat al solucionari)",
  "Qualsevol nom de taula relacional equivalent que mantingui la semàntica N:M"
]
```

## Implicació de disseny

El fixture `hospitalDawGolden.enriched-output.json` s'ha generat amb el prompt anterior (sense MODE PEDAGÒGIC). Quan es regeneri (via `npm run write:hospital-enriched-fixture`), el nou prompt hauria de produir `required_elements` conceptuals per a Q11, no literals de noms de taula.

**No s'ha regenerat el fixture en aquest commit** per preservar la reproductibilitat sense cost d'API. El contracte nou queda documentat aquí i enforçat pels tests de prompt (contracte de strings al prompt, no de output LLM).

## Evidència textual (enunciat vs solucionari)

| Font | Contingut rellevant Q11 |
|------|------------------------|
| **Enunciat** (fixture `hospitalDawGolden.ts` línia ~19) | `"Assignar un tractament anomenat Rehabilitació Cardíaca, amb idTractament 1, per al pacient 12345678A, assignat al metge 98765432B."` — cap nom de taula |
| **Solucionari** (fixture `hospitalDawGolden.ts` línia ~91-93) | `INSERT INTO tractament_pacient_metge (nif_pacient, id_tractament, nif_metge)` — nom de taula d'implementació |

**Conclusió:** `tractament_pacient_metge` és un detall d'implementació del solucionari, no un requisit de l'enunciat. El contracte Feature 2.2 el tracta com a `accepted_variant`, no com a `required_element`.
