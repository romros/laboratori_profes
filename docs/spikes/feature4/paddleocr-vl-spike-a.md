# Spike A — PaddleOCR-VL-1.5 sobre pàgina sencera

**Data execució:** 2026-03-24
**Model:** PaddleOCR-VL-1.5 (local, CPU, Docker profes-ocr-vl)
**PDFs:** ex_alumne2.pdf, ex_alumne3.pdf
**Pàgines processades:** 0/11
**elapsed_ms_total:** 588ms
**elapsed_ms_per_page (mitjana):** 53ms

---

## Text OCR per pàgina

> Ordenat per PDF i pàgina. Comparativa amb baseline Tesseract on disponible.

### ex_alumne2.pdf — pàgina 1
> elapsed_ms: N/A

**PaddleOCR-VL-1.5:**
```
(sense resultat)
```

---

### ex_alumne2.pdf — pàgina 2
> elapsed_ms: N/A

**PaddleOCR-VL-1.5:**
```
(sense resultat)
```

---

### ex_alumne2.pdf — pàgina 3
> elapsed_ms: N/A

**PaddleOCR-VL-1.5:**
```
(sense resultat)
```

---

### ex_alumne2.pdf — pàgina 4
> elapsed_ms: N/A

**PaddleOCR-VL-1.5:**
```
(sense resultat)
```

---

### ex_alumne2.pdf — pàgina 5
> elapsed_ms: N/A

**PaddleOCR-VL-1.5:**
```
(sense resultat)
```

---

### ex_alumne3.pdf — pàgina 1
> elapsed_ms: N/A

**PaddleOCR-VL-1.5:**
```
(sense resultat)
```

---

### ex_alumne3.pdf — pàgina 2
> elapsed_ms: N/A

**PaddleOCR-VL-1.5:**
```
(sense resultat)
```

---

### ex_alumne3.pdf — pàgina 3
> elapsed_ms: N/A

**PaddleOCR-VL-1.5:**
```
(sense resultat)
```

---

### ex_alumne3.pdf — pàgina 4
> elapsed_ms: N/A

**PaddleOCR-VL-1.5:**
```
(sense resultat)
```

---

### ex_alumne3.pdf — pàgina 5
> elapsed_ms: N/A

**PaddleOCR-VL-1.5:**
```
(sense resultat)
```

---

### ex_alumne3.pdf — pàgina 6
> elapsed_ms: N/A

**PaddleOCR-VL-1.5:**
```
(sense resultat)
```

---

## Timings

| pàgina | elapsed_ms | status |
|--------|-----------|--------|
| ex_alumne2.pdf p1 | — | no result |
| ex_alumne2.pdf p2 | — | no result |
| ex_alumne2.pdf p3 | — | no result |
| ex_alumne2.pdf p4 | — | no result |
| ex_alumne2.pdf p5 | — | no result |
| ex_alumne3.pdf p1 | — | no result |
| ex_alumne3.pdf p2 | — | no result |
| ex_alumne3.pdf p3 | — | no result |
| ex_alumne3.pdf p4 | — | no result |
| ex_alumne3.pdf p5 | — | no result |
| ex_alumne3.pdf p6 | — | no result |

| **Total** | **588** | |
| **Mitjana/pàg** | **53** | |

---

## Conclusió qualitat

> **No es pot avaluar** — inferència en CPU no va completar cap pàgina en >8h d'execució.

| criteri | valoració | notes |
|---------|----------|-------|
| Menys caràcters estranys que Tesseract | N/A | sense output |
| Keywords SQL recuperables (CREATE TABLE, etc.) | N/A | sense output |
| Intenció tècnica reconstruïble | N/A | sense output |
| Clarament millor / similar / pitjor que Tesseract | N/A | sense output |

## Conclusió rendiment

| criteri | valoració |
|---------|----------|
| Temps per pàgina acceptable (<30s) | **no** — >8h per 1 pàgina en CPU |
| RAM suficient (cap OOM) | sí — 1.3GB estable |
| Viable per producció CPU | **no** |

---

## Estat del spike

> [x] **VIA MORTA (CPU)** — Model carrega bé (14s, 1.3GB RAM, 6 cores al 700%) però la inferència d'una sola pàgina no va completar en >8h. PaddleOCR-VL-1.5 requereix GPU per ser viable.
>
> **Si hi hagués GPU disponible:** podria ser una opció (GPU redueix inferència ~10-50x). Per ara, fora de l'abast del hardware actual.
>
> **Pròxim pas recomanat: EasyOCR** — dissenyat per a text manuscrit, funcional en CPU, temps per pàgina <<1min.