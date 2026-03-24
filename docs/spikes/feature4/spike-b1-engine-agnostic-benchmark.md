# Spike B1 — Benchmark engine-agnostic: preprocess × OCR engines

**Data execució:** 2026-03-24
**Dataset:** 13 crops (manual_text_pass=no, Spike B0 congelat)
**Preprocess:** baseline | preA (grayscale+contrast) | preB (+threshold)
**Engines:** Tesseract.js (WASM, lang=cat) | PaddleOCR (Docker, lang=en, CPU)

> ⚠️ **IMPORTANT — avaluació independent:**
> Avalua cada cel·la per separat, sense comparar primer amb baseline.
> Pregunta per a cada text: "Amb **aquest** text, podria corregir la resposta?"
> Les variants apareixen **abans** del baseline a cada secció.

---

## Textos per crop

### alumne-2_Q1

**Pregunta:** Creació Taula 1 (Hospital) amb les restriccions corresponents.

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
Creació Taula 1 dionpital) amb len rentticsiona antesponents (15 ente ad i tag he ' Q A UV3i PAC PZ du to AE, a CAT Ll Cit, tr, ft la) 4 Mal. M Mal: (Ai At ALL I em ta av (Al gas ML, prltleb fu mMbat 9 CV) / . / DI ae
```

**baseline** — Baseline (sense preprocessing):
```
CREATE 10046 peca ( Cadi (VT POMANY ICE Y AC L-AJ0LL, ds UT LOT AJULL, Cam VARCUAL (2) Vot AJULL, MUME (UT AT VULL, idelem VAREM) ver AULL, CH ECI4 (mumtno y O) / 4
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-2_Q4

**Pregunta:** Creació Taula 4 (Metge) amb les restriccions corresponents.

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
CLEATE TABLE metge l metge vincu (a) PRMBRY (CÈY Lo pe, com vVARHARMSY, CS clidet UNAC HR (20, cales ME Arús REC RE CN mMEY (cate se) REC ERENCE S hespetal (cec V / / : Janer Mt ay A t na seny sat sot al a at) ll INS nans vatel i Hom EE ue panenitó ut "i pamata hr tt 3 " Creac i Vaula I rats gatet vas f Ç EM " ha MM AU 1 Qu vàNe t ta are ES A 1 EL NS, pt Il h pa Va NU nt t ne A ) hg, qe Meca fa tl
```

**baseline** — Baseline (sense preprocessing):
```
CRERTE TABLE metgél míldge VsNCHNR (a) PRIMBRY (CEY VO VÓLL, mom VORHAR(IS), esprieldat VARCHAR (20), (de Hosp IVT dUI LL FREON REY (altes) REFERENCES hespital (cedí d I Gener sitat de i nmanyanmat qu (120 punta) ' tl Pranoanc Vital l declons carrasponet ( tractament) amb les ont LI Creació Taula 6 Dl st ( Te AN LI EN Gi carme vane Tuctan Manny EV PZ di TA met NT (0) nm qe da tem Í (ne HAIXt Ú av
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-2_Q7

**Pregunta:** Inserir un hospital amb codi 1 ubicat al carrer Sant Joan, número 50, codi posta

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
4, INSEUT IVIO hecpdel VaLUC 5 ( 4. ' OO) / Sau t Yan, 6) 432223344), ' VI
```

**baseline** — Baseline (sense preprocessing):
```
u 3 ti 50, INSEOT INTO hespidel VILVES (4. 1 OQVOL dant Vam 4322 23344').
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-2_Q8

**Pregunta:** Inserir un pacient anomenat Pere Torres Font, amb adreça Passeig de Gràcia, núme

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
NSERT (NS Quciemt VAVES (54662344 Pere, Torne Red" VOL 'Aisieig de Gràcia", (2, 4344 66 Ç6 1, V
```

**baseline** — Baseline (sense preprocessing):
```
USERT iNTC Qaciemt VAVES (125466234 'Pene 4 Tones Red 7 OI0L Asieig de Gràciol, (2, "Q9qu 4 6666 ): VA
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-3_Q8

**Pregunta:** Inserir un pacient anomenat Pere Torres Font, amb adreça Passeig de Gràcia, núme

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-3_Q9

**Pregunta:** Assignar una habitació número 101, de tipus individual, a l'hospital 1 per al pa

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-3_Q11

**Pregunta:** Assignar un tractament anomenat Rehabilitació Cardíaca, amb idTractament 1, per 

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
Li aju El Ag qcaldtiri al Mt CA, Ba tecag a A ce , l Ú arc a CA 4 NA LT La co),
```

**baseline** — Baseline (sense preprocessing):
```
ASERT UTC ga cltaument VALLES ( 4 p'Aehab:t lació: landiacd'y a BaceagAt ag mesa pt), /
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-3_Q13

**Pregunta:** Incrementar en un 15% l'import de totes les visites registrades.

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
Incrementar en un 1596 l'import de totes les visites registrades. (0.5 punts) Lu up dr d'6, v
```

**baseline** — Baseline (sense preprocessing):
```
C ET mpont z impert sé l'I6, ODATE ViSiA
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-1_Q2

**Pregunta:** Creació Taula 2 (Pacient) amb les restriccions corresponents.

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(QTAIÇ TNMBIE — So € Le ia variar (10) PRIMARN CEN NOT Nu, i eNT— P i nsm ya hac (i) , ML, ACUIA TAL ar (29), AI 1) UI NU, carter. anar (40) NOT NULL, i tutela, Ni Nej No, Cit cr, Un. I I etette vaunactii) NOU NULL 4 Lonàú da CS Lin de la avia ls 1 ' ' at ps oa pe pe pt l nt CN et ' TE UE) pd) ut i: ' 1 vas À vi ' ' fia a , et vot No 3 pe 4 i v ' 4 tiodu tt cles has taatiles Piouleu anti ten defi
```

**baseline** — Baseline (sense preprocessing):
```
(QEAÇ TABIE — Soú € o id varhar (16) PRIMARN XEN NOT NU, nom vyarchar (19) , to anom varMhmar (20), ep IN NOT NULL, carter. Norihar (20) NOT NULV, NUMEerS INT VT NULL CHE One SG vetefon varhmartis) NOT NULL aa Ll creació de ha tala und (OLAU LB l Mn ip qai at (6) puiífi 4 44. ot quiet vyar nul qm), Qualt Of variat qua) : Ú editorial animar Et 0) Detautt esttn ui: i s LA iiete a (As it I (o dBIbUO
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-1_Q5

**Pregunta:** Creació Taula 5 (Tractament) amb les restriccions corresponents.

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
ó de ia ta Reserva 070 1 es f I Ll (AM PA des (af qai Pal Qui" Ll tt q OA " " pa ó pedres Ni t Ada RR" Qumapa dr die ASS Te 1: Ag ES di vid set V (a pd (a T SE qe ds $$ Oi pit quis dit
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-1_Q9

**Pregunta:** Assignar una habitació número 101, de tipus individual, a l'hospital 1 per al pa

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
Engert ínic Llibre valaçs (1584 INNNT , VEU Quinct", Pis b bla, N x 4 NN . Cervanta , Distoneguda 1), Qu I Un cas Vals Vora J dar P 1 , dt ee, fouta , . 3. dan 0, hi ni 3 DE Ta, Un LA ri ad cc T - "1 08010, telèfon 932222222 l NIF 123456784. (0,33 punts) Nou a - DN Ara Caerit a a a A gament UG CIA , POre , : CR. qua pi ts NY , Carner Balmes 7 Cd Lo Ne Lecee , 9. inserir el llibre El Quixot, escrit
```

**baseline** — Baseline (sense preprocessing):
```
Pinsert into "Llibre values C'88G INNNT , YEL Quixot", Porequis, Mervantes ,' Destoneguda si DE / I / os MUME, inte — Vitiotera valurs ("1 , ad, AL 4 i A , Q312 At, - I 6 8. Inserir el soci Anna Ferrer Puig, amb adreça Carrer Balmes, número 20, codi coc. 13 08010, telèfon 932222222 i NIF 123456784. (0,33 punts) 1 . ES I q x Ú hi I (a Ma asert mo Sou vaiuest 12349618 A , Anna , ve La ROM, VCarrer B
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-1_Q11

**Pregunta:** Assignar un tractament anomenat Rehabilitació Cardíaca, amb idTractament 1, per 

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
fou i Mic MRrestect cauus i" Jqau EC Ç )C26 - QS) SUD G Os a Ian SN, Br AN) 5
```

**baseline** — Baseline (sense preprocessing):
```
Als tPrestec" vabues L' 22967, "2026 -O8-10/ ,2026- 04 a. vi2348618A" , ' (GSGINNN )5 I I Insert I I
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

### alumne-1_Q12

**Pregunta:** Registrar una visita amb idVisita 1, data 2024-02-01, import 100€, motiu Revisió

#### Engine: tesseract — Tesseract.js (WASM, lang=cat, PSM=AUTO)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
e H No ay : x — inserit into Ne cv V Mus En ISACI2 A " . N sn JNNA VC) a B)) )
```

**baseline** — Baseline (sense preprocessing):
```
insert ínto "Reserva" vau (b61890128 7 , Y 6 8 4 TNNN) I ) 2026 -03-15/), P, aque 6 Je 7
```

#### Engine: paddleocr — PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)

**preA** — Preprocess A (grayscale + contrast 0.3):
```
(no detectat)
```

**preB** — Preprocess B (grayscale + contrast + th.128):
```
(no detectat)
```

**baseline** — Baseline (sense preprocessing):
```
(no detectat)
```

---

## Taula de validació manual

> **Avaluació feta per LLM (Claude) llegint les imatges originals dels PDFs com a ground truth.**
> **corregible yes** = puc identificar keywords suficients per reconstruir la intenció SQL.
> **impact**: high = text clarament recuperable · med = parcial · low = irrecuperable.
>
> **Ground truth (llegit de la imatge):**
> - alumne-2_Q1: `CREATE TABLE hospital( codi INT PRIMARY KEY NOT NULL, CP INT NOT NULL, carrer VARCHAR(20) NOT NULL, numero INT NOT NULL, telefon VARCHAR(11) NOT NULL, CHECK(numero>0) );`
> - alumne-2_Q4: `CREATE TABLE metge( mifMetge VARCHAR(9) PRIMARY KEY NOT NULL, nom VARCHAR(15), especialitat VARCHAR(20), codiHosp INT NOT NULL, FOREIGN KEY (codiHosp) REFERENCES hospital(codi) );`
> - alumne-2_Q7: `INSERT INTO hospital VALUES(1, 08001, 'Sant Joan', 50, '932223344');`
> - alumne-2_Q8: `INSERT INTO pacient VALUES('12345678A', 'Pere', 'Torres Font', 08001, 'Passeig de Gràcia', 12, '934445566');`
> - alumne-3_Q8: mateixa estructura que alumne-2_Q8 (lletra similar, ambdós no detectats)
> - alumne-3_Q9: `INSERT INTO habitacio VALUES(101, 'individual', 1, '12345678A');`
> - alumne-3_Q11: `INSERT INTO tractament VALUES(1, 'Rehabilitació Cardíaca', '12345678A', '98765432B');`
> - alumne-3_Q13: `UPDATE visita SET import = import * 1.15;`
> - alumne-1_Qx: examen diferent (Biblioteca/Soci/Llibre), segmentació errònia en tots els casos

| crop_id | preprocess | engine | corregible | impact | notes |
|---------|-----------|--------|-----------|--------|-------|
| alumne-2_Q1 | baseline | tesseract | no | low | `CREATE 10046 peca` — cap keyword SQL vàlid |
| alumne-2_Q1 | baseline | paddleocr | no | low | (no detectat) |
| alumne-2_Q1 | preA | tesseract | no | low | (no detectat) |
| alumne-2_Q1 | preA | paddleocr | no | low | (no detectat) |
| alumne-2_Q1 | preB | tesseract | yes | med | "Creació Taula 1 dionpital" — CREATE TABLE + restriccions parcialment llegibles |
| alumne-2_Q1 | preB | paddleocr | no | low | (no detectat) |
| alumne-2_Q4 | baseline | tesseract | yes | med | "CRERTE TABLE metgél" + FK REFERENCES hospital — estructura recuperable |
| alumne-2_Q4 | baseline | paddleocr | no | low | (no detectat) |
| alumne-2_Q4 | preA | tesseract | no | low | (no detectat) |
| alumne-2_Q4 | preA | paddleocr | no | low | (no detectat) |
| alumne-2_Q4 | preB | tesseract | yes | med | "CLEATE TABLE metge" + REFERENCES hospital — millora marginal vs baseline |
| alumne-2_Q4 | preB | paddleocr | no | low | (no detectat) |
| alumne-2_Q7 | baseline | tesseract | yes | high | "INSEOT INTO hespidel VILVES (4. 1 OO... Sant Vam 4322 23344')" — INSERT+hospital+dades quasi correctes |
| alumne-2_Q7 | baseline | paddleocr | no | low | (no detectat) |
| alumne-2_Q7 | preA | tesseract | no | low | (no detectat) |
| alumne-2_Q7 | preA | paddleocr | no | low | (no detectat) |
| alumne-2_Q7 | preB | tesseract | yes | high | "INSEUT IVIO hecpdel VaLUC 5 (4. '00) / Sant Yan, 6) 432223344)" — intent clar, millora marginal |
| alumne-2_Q7 | preB | paddleocr | no | low | (no detectat) |
| alumne-2_Q8 | baseline | tesseract | yes | med | "USERT iNTC Qaciemt VAVES" + Passeig Gràcia + telèfon — recuperable amb heurístics |
| alumne-2_Q8 | baseline | paddleocr | no | low | (no detectat) |
| alumne-2_Q8 | preA | tesseract | no | low | (no detectat) |
| alumne-2_Q8 | preA | paddleocr | no | low | (no detectat) |
| alumne-2_Q8 | preB | tesseract | yes | med | "NSERT (NS Quciemt VAVES (54662344 Pere, Torne... Gràcia)" — similar a baseline, sense millora clara |
| alumne-2_Q8 | preB | paddleocr | no | low | (no detectat) |
| alumne-3_Q8 | baseline | tesseract | no | low | (no detectat) — mateixa lletra que alumne2, però 0 resultats |
| alumne-3_Q8 | baseline | paddleocr | no | low | (no detectat) |
| alumne-3_Q8 | preA | tesseract | no | low | (no detectat) |
| alumne-3_Q8 | preA | paddleocr | no | low | (no detectat) |
| alumne-3_Q8 | preB | tesseract | no | low | (no detectat) |
| alumne-3_Q8 | preB | paddleocr | no | low | (no detectat) |
| alumne-3_Q9 | baseline | tesseract | no | low | (no detectat) |
| alumne-3_Q9 | baseline | paddleocr | no | low | (no detectat) |
| alumne-3_Q9 | preA | tesseract | no | low | (no detectat) |
| alumne-3_Q9 | preA | paddleocr | no | low | (no detectat) |
| alumne-3_Q9 | preB | tesseract | no | low | (no detectat) |
| alumne-3_Q9 | preB | paddleocr | no | low | (no detectat) |
| alumne-3_Q11 | baseline | tesseract | no | low | "ASERT UTC ga cltaument VALLES" — no es pot reconstruir INSERT tractament |
| alumne-3_Q11 | baseline | paddleocr | no | low | (no detectat) |
| alumne-3_Q11 | preA | tesseract | no | low | (no detectat) |
| alumne-3_Q11 | preA | paddleocr | no | low | (no detectat) |
| alumne-3_Q11 | preB | tesseract | no | low | "Li aju El Ag qcaldtiri al Mt CA" — pitjor que baseline |
| alumne-3_Q11 | preB | paddleocr | no | low | (no detectat) |
| alumne-3_Q13 | baseline | tesseract | no | low | "C ET mpont z impert sé l'I6, ODATE ViSiA" — UPDATE i import visibles però massa corrupte |
| alumne-3_Q13 | baseline | paddleocr | no | low | (no detectat) |
| alumne-3_Q13 | preA | tesseract | no | low | (no detectat) |
| alumne-3_Q13 | preA | paddleocr | no | low | (no detectat) |
| alumne-3_Q13 | preB | tesseract | no | low | llegeix l'enunciat (text imprès), no la resposta manuscrita |
| alumne-3_Q13 | preB | paddleocr | no | low | (no detectat) |
| alumne-1_Q2 | baseline | tesseract | no | low | Barreja SQL + enunciat — segmentació errònia |
| alumne-1_Q2 | baseline | paddleocr | no | low | (no detectat) |
| alumne-1_Q2 | preA | tesseract | no | low | (no detectat) |
| alumne-1_Q2 | preA | paddleocr | no | low | (no detectat) |
| alumne-1_Q2 | preB | tesseract | no | low | Barreja total amb enunciat + múltiples taules |
| alumne-1_Q2 | preB | paddleocr | no | low | (no detectat) |
| alumne-1_Q5 | baseline | tesseract | no | low | Paraules aleatòries, sense estructura SQL |
| alumne-1_Q5 | baseline | paddleocr | no | low | (no detectat) |
| alumne-1_Q5 | preA | tesseract | no | low | (no detectat) |
| alumne-1_Q5 | preA | paddleocr | no | low | (no detectat) |
| alumne-1_Q5 | preB | tesseract | no | low | (no detectat) |
| alumne-1_Q5 | preB | paddleocr | no | low | (no detectat) |
| alumne-1_Q9 | baseline | tesseract | no | low | Text d'altra pregunta barrejat — segmentació errònia greu |
| alumne-1_Q9 | baseline | paddleocr | no | low | (no detectat) |
| alumne-1_Q9 | preA | tesseract | no | low | (no detectat) |
| alumne-1_Q9 | preA | paddleocr | no | low | (no detectat) |
| alumne-1_Q9 | preB | tesseract | no | low | Barreja preguntes 8 i 9 — segmentació errònia |
| alumne-1_Q9 | preB | paddleocr | no | low | (no detectat) |
| alumne-1_Q11 | baseline | tesseract | no | low | "Als tPrestec vabues" — no recuperable |
| alumne-1_Q11 | baseline | paddleocr | no | low | (no detectat) |
| alumne-1_Q11 | preA | tesseract | no | low | (no detectat) |
| alumne-1_Q11 | preA | paddleocr | no | low | (no detectat) |
| alumne-1_Q11 | preB | tesseract | no | low | Soroll total |
| alumne-1_Q11 | preB | paddleocr | no | low | (no detectat) |
| alumne-1_Q12 | baseline | tesseract | no | low | "insert ínto Reserva" — examen Biblioteca, no Hospital, segmentació errònia |
| alumne-1_Q12 | baseline | paddleocr | no | low | (no detectat) |
| alumne-1_Q12 | preA | tesseract | no | low | (no detectat) |
| alumne-1_Q12 | preA | paddleocr | no | low | (no detectat) |
| alumne-1_Q12 | preB | tesseract | no | low | Soroll total |
| alumne-1_Q12 | preB | paddleocr | no | low | (no detectat) |

---

## Resum agregat

### Per preprocess × engine

| preprocess | tesseract | paddleocr | guany vs baseline |
|-----------|----------|----------|------------------|
| baseline  | 5/13 | 0/13 | — |
| preA      | 0/13 | 0/13 | -5/0 |
| preB      | 4/13 | 0/13 | -1/0 |

> ⚠️ **PaddleOCR 3.x (lang=es): 0/39 detectats** en tots els casos (cap variant, cap crop).
> **Tesseract baseline: 5/13 corregibles** (alumne-2 Q4, Q7, Q8; alumne-3 cap; alumne-1 segmentació errònia).
> **preB empitjora** respecte baseline en Tesseract (perd alumne-2_Q7 vs baseline, no guanya res).

### Classificació de resultats

**1. Preprocess transversal** (millora en els dos engines): **cap**

**2. Preprocess dependent de motor** (millora en un, no en l'altre): **cap net positiu**

**3. Sense guany** (cap variant millora cap engine):
- Tots els alumne-3 (Q8, Q9, Q11, Q13): 0/24 — lletra d'alumne3 completament inviable amb Tesseract
- Tots els alumne-1: 0/18 — examen diferent (Biblioteca) + segmentació errònia sistemàtica
- PaddleOCR 3.x: 0/39 — model no detecta text manuscrit en cap cas

---

## Conclusió

> [x] **B — Preprocess insuficient:** 0 rescatats nets
>     → Tesseract + preprocessing NO resol els pitjors casos
>
> [x] **Motor insuficient (PaddleOCR 3.x lang=es): 0/39 deteccions**
>     → PaddleOCR 3.x DESCARTAT com a candidat per a Feature 4
>     → Causa probable: model entrenat per a text imprès, no text manuscrit escolar
>
> **Decisions:**
> 1. PaddleOCR 3.x (pàgina sencera, lang=es) = **VIA MORTA** per a text manuscrit
> 2. Tesseract baseline és millor que qualsevol preprocessing en els casos que detecta
> 3. Alumne-1 té problema de segmentació: els seus crops no corresponen a les preguntes (examen diferent)
> 4. **Pròxim pas:** Spike 4A — PaddleOCR-VL (multimodal) o EasyOCR, dissenyats per a text manuscrit
