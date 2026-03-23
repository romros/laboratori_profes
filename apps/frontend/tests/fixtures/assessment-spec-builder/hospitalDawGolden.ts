/**
 * Context global del document (preàmbul del professor) — text ABANS de "Es demana:".
 * Extret del PDF real `enunciat-daw.pdf` (pàgina 1).
 * Inclou: model lògic relacional, restriccions globals de les taules, capçalera de l’exercici.
 * NO inclou el llistat de preguntes numerades.
 *
 * S’usa com a `examDocumentContext` a la passada 2 de Feature 2.
 */
export const hospitalDawExamDocumentContext = `DAW/DAM – 0484. BASE DE DADES
ASIXC – 0372. GESTIÓ DE BASES DE DADES
PROVA AVALUCIÓ A3. Estructura de la base de dades

Realitza la creació de la base de dades per a la gestió d’un hospital

A partir del següent model lògic relacional:

Hospital(codi, cp, carrer, numero, telefon)
cp, carrer, numero, telefon són camps obligatoris.
numero ha de ser un número positiu.

Pacient(nif, nom, cognoms, cp, carrer, numero, telefon)
cp, carrer, numero, telefon són camps obligatoris.
numero ha de ser un número positiu.

Habitacio(numHabitacio, tipus, codiHosp, nifPacient)
codiHosp és clau forana de Hospital.
nifPacient és clau forana de Pacient.
tipus pot tenir els valors ‘individual’ o ‘compartida’.
Si s’elimina un hospital, les habitacions d’aquest hospital es posaran a NULL automàticament.

Metge(nifMetge, nom, especialitat, codiHosp)
codiHosp és clau forana de Hospital.

Tractament(idTractament, nomTractament, nifPacient, nifMetge)
nifPacient és clau forana de Pacient.
nifMetge és clau forana de Metge.

Visita(idVisita, data, import, motiu, tipus, nifPacient, nifMetge)
nifPacient és clau forana de Pacient.
nifMetge és clau forana de Metge.
tipus només pot tenir els valors ‘consulta’ o ‘urgència’.
idVisita ha de ser un número positiu.
Quan s’esborri un pacient, totes les seves visites associades hanuran de ser esborrades.`

/**
 * Text COMPLET de l’enunciat hospital DAW tal com surt del PDF (amb preàmbul + preguntes).
 * Inclou el model relacional + "Es demana:" + llistat de 15 preguntes.
 * Font: `tests/fixtures/template-inference/pdf/enunciat-daw.pdf`
 */
export const hospitalDawExamTextFull = `DAW/DAM – 0484. BASE DE DADES
ASIXC – 0372. GESTIÓ DE BASES DE DADES
PROVA AVALUCIÓ A3. Estructura de la base de dades

Realitza la creació de la base de dades per a la gestió d’un hospital

A partir del següent model lògic relacional:

Hospital(codi, cp, carrer, numero, telefon)
cp, carrer, numero, telefon són camps obligatoris.
numero ha de ser un número positiu.

Pacient(nif, nom, cognoms, cp, carrer, numero, telefon)
cp, carrer, numero, telefon són camps obligatoris.
numero ha de ser un número positiu.

Habitacio(numHabitacio, tipus, codiHosp, nifPacient)
codiHosp és clau forana de Hospital.
nifPacient és clau forana de Pacient.
tipus pot tenir els valors ‘individual’ o ‘compartida’.
Si s’elimina un hospital, les habitacions d’aquest hospital es posaran a NULL automàticament.

Metge(nifMetge, nom, especialitat, codiHosp)
codiHosp és clau forana de Hospital.

Tractament(idTractament, nomTractament, nifPacient, nifMetge)
nifPacient és clau forana de Pacient.
nifMetge és clau forana de Metge.

Visita(idVisita, data, import, motiu, tipus, nifPacient, nifMetge)
nifPacient és clau forana de Pacient.
nifMetge és clau forana de Metge.
tipus només pot tenir els valors ‘consulta’ o ‘urgència’.
idVisita ha de ser un número positiu.
Quan s’esborri un pacient, totes les seves visites associades hanuran de ser esborrades.

Es demana:
1. Creació Taula 1 (Hospital) amb les restriccions corresponents. (0,75 punts)
2. Creació Taula 2 (Pacient) amb les restriccions corresponents. (0,75 punts)
3. Creació Taula 3 (Habitacio) amb les restriccions corresponents. (1,5 punts)
4. Creació Taula 4 (Metge) amb les restriccions corresponents. (0,75 punts)
5. Creació Taula 5 (Tractament) amb les restriccions corresponents. (1,25 punts)
6. Creació Taula 6 (Visita) amb les restriccions corresponents. (1,75 punts)
7. Inserir un hospital amb codi 1 ubicat al carrer Sant Joan, número 50, codi postal 08001, telèfon 932223344. (0,33 punts)
8. Inserir un pacient anomenat Pere Torres Font, amb adreça Passeig de Gràcia, número 12, codi postal 08001, telèfon 934445566 i NIF 12345678A. (0,33 punts)
9. Assignar una habitació número 101, de tipus individual, a l’hospital 1 per al pacient amb NIF 12345678A. (0,33 punts)
10. Afegir un metge amb NIF 98765432B, nom Dr. Laura López, especialitat Cardiologia, associada a l’hospital 1. (0,33 punts)
11. Assignar un tractament anomenat Rehabilitació Cardíaca, amb idTractament 1, per al pacient 12345678A, assignat al metge 98765432B. (0,33 punts)
12. Registrar una visita amb idVisita 1, data 2024-02-01, import 100€, motiu Revisió postoperatòria, tipus consulta, per al pacient 12345678A, atès pel metge 98765432B. (0,33 punts)
13. Incrementar en un 15% l’import de totes les visites registrades. (0,5 punts)
14. Canviar el tipus de dades del codi postal de Pacient de numèric a caràcter (o viceversa depenent de la definició). (0,4 punts)
15. Esborrar totes les visites on el tipus sigui ‘consulta’. (0,37 punts)
`

/**
 * Text extret (sense PDF) de l’examen hospital DAW — alineat amb
 * `tests/fixtures/template-anchor/template_hospital_daw.json` (15 preguntes).
 * Versió simplificada sense preàmbul (retrocompatibilitat).
 * Per al text complet amb model relacional, useu `hospitalDawExamTextFull`.
 */
export const hospitalDawExamText = `F_IT_008_01 — Examen LDD Ordinària — Cas Hospital (DAW)

Instruccions: responeu en SQL PostgreSQL. Es valorarà sintaxi, restriccions i coherència amb l’enunciat.

1. (0,33 punts) Creació Taula 1 (Hospital) amb les restriccions corresponents.
2. (0,33 punts) Creació Taula 2 (Pacient) amb les restriccions corresponents.
3. (0,33 punts) Creació Taula 3 (Habitacio) amb les restriccions corresponents.
4. (0,33 punts) Creació Taula 4 (Metge) amb les restriccions corresponents.
5. (0,33 punts) Creació Taula 5 (Tractament) amb les restriccions corresponents.
6. (0,33 punts) Creació Taula 6 (Visita) amb les restriccions corresponents.
7. (0,33 punts) Inserir un hospital amb codi 1 ubicat al carrer Sant Joan, número 50, codi postal 08001, telèfon 932223344.
8. (0,33 punts) Inserir un pacient anomenat Pere Torres Font, amb adreça Passeig de Gràcia, número 12, codi postal 08001, telèfon 934445566 i NIF 12345678A.
9. (0,33 punts) Assignar una habitació número 101, de tipus individual, a l'hospital 1 per al pacient amb NIF 12345678A.
10. (0,33 punts) Afegir un metge amb NIF 98765432B, nom Dr. Laura López, especialitat Cardiologia, associada a l'hospital 1.
11. (0,33 punts) Assignar un tractament anomenat Rehabilitació Cardíaca, amb idTractament 1, per al pacient 12345678A, assignat al metge 98765432B.
12. (0,33 punts) Registrar una visita amb idVisita 1, data 2024-02-01, import 100€, motiu Revisió postoperatòria, tipus consulta, per al pacient 12345678A, atès pel metge 98765432B.
13. (0,33 punts) Incrementar en un 15% l'import de totes les visites registrades.
14. (0,33 punts) Canviar el tipus de dades del codi postal de Pacient de numèric a caràcter.
15. (0,33 punts) Esborrar totes les visites on el tipus sigui consulta.
`

export const hospitalDawSolutionText = `SOLUCIONARI — Examen Hospital (DAW)

Q1. CREATE TABLE Hospital (
  id INT PRIMARY KEY,
  carrer VARCHAR(120) NOT NULL,
  numero INT NOT NULL,
  codi_postal CHAR(5) NOT NULL,
  telefon VARCHAR(20) NOT NULL,
  CONSTRAINT chk_hospital_numero_pos CHECK (numero > 0)
);

Q2. CREATE TABLE Pacient (
  nif CHAR(9) PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  adreça VARCHAR(150) NOT NULL,
  numero INT NOT NULL,
  codi_postal CHAR(5) NOT NULL,
  telefon VARCHAR(20) NOT NULL,
  id_hospital INT REFERENCES Hospital(id) ON DELETE SET NULL
);

Q3. CREATE TABLE Habitacio (
  id_hospital INT NOT NULL REFERENCES Hospital(id) ON DELETE CASCADE,
  numero_hab INT NOT NULL,
  tipus VARCHAR(20) NOT NULL,
  PRIMARY KEY (id_hospital, numero_hab),
  CONSTRAINT chk_habitacio_tipus CHECK (tipus IN ('individual', 'doble'))
);

Q4. CREATE TABLE Metge (
  nif CHAR(9) PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  especialitat VARCHAR(80) NOT NULL,
  id_hospital INT NOT NULL REFERENCES Hospital(id) ON DELETE CASCADE
);

Q5. CREATE TABLE Tractament (
  id_tractament INT PRIMARY KEY,
  nom VARCHAR(120) NOT NULL,
  CONSTRAINT chk_tractament_nom CHECK (char_length(trim(nom)) > 0)
);

Q6. CREATE TABLE Visita (
  id_visita INT PRIMARY KEY,
  data_visita DATE NOT NULL,
  import NUMERIC(10,2) NOT NULL,
  motiu VARCHAR(200) NOT NULL,
  tipus VARCHAR(40) NOT NULL,
  nif_pacient CHAR(9) NOT NULL REFERENCES Pacient(nif),
  nif_metge CHAR(9) NOT NULL REFERENCES Metge(nif)
);

Q7. INSERT INTO Hospital (id, carrer, numero, codi_postal, telefon)
VALUES (1, 'Sant Joan', 50, '08001', '932223344');

Q8. INSERT INTO Pacient (nif, nom, adreça, numero, codi_postal, telefon, id_hospital)
VALUES ('12345678A', 'Pere Torres Font', 'Passeig de Gràcia', 12, '08001', '934445566', NULL);

Q9. INSERT INTO Habitacio (id_hospital, numero_hab, tipus)
VALUES (1, 101, 'individual');
UPDATE Pacient SET id_hospital = 1 WHERE nif = '12345678A';

Q10. INSERT INTO Metge (nif, nom, especialitat, id_hospital)
VALUES ('98765432B', 'Dr. Laura López', 'Cardiologia', 1);

Q11. INSERT INTO Tractament (id_tractament, nom) VALUES (1, 'Rehabilitació Cardíaca');
INSERT INTO tractament_pacient_metge (nif_pacient, id_tractament, nif_metge)
VALUES ('12345678A', 1, '98765432B');

Q12. INSERT INTO Visita (id_visita, data_visita, import, motiu, tipus, nif_pacient, nif_metge)
VALUES (1, DATE '2024-02-01', 100.00, 'Revisió postoperatòria', 'consulta', '12345678A', '98765432B');

Q13. UPDATE Visita SET import = import * 1.15;

Q14. ALTER TABLE Pacient ALTER COLUMN codi_postal TYPE VARCHAR(5) USING codi_postal::varchar;

Q15. DELETE FROM Visita WHERE tipus = 'consulta';
`
