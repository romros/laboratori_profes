# Contracte de feasibility — template-inference (Feature 0)

**Versió:** 1.1 · **Àmbit:** decisió **go / no-go** abans de schemas, validators o integració LLM.  
**Filosofia:** **fail-closed** (dubte o conflicte → **`no_apte`**) i **minimització de dades**.

---

## 1) Definició operativa: «seminanonimitzable»

Un examen és **seminanonimitzable** només si es compleix **tot** el següent:

1. **Layout estable:** mateixes zones d’enunciats i respostes entre còpies; la plantilla pot referenciar blocs sense tractar cada còpia com un cas únic.
2. **Avaluació sobre regions delimitables:** la **major part de l’avaluació** (vegeu §3) es fa sobre ítems amb **regió delimitable** — tancada (OM, graella, caselles) o **un requadre fix i únic** per ítem.
3. **Identitat fora de la resposta:** les dades identificatives estan en **zones separades** de les respostes avaluables (vegeu §4).

Si falla qualsevol punt → no és seminanonimitzable en sentit estricte; classifiqueu amb §3–§6.

---

## 2) Categories de resultat

| Codi | Nom | Significat |
|------|-----|------------|
| **`apte`** | GO | Pipeline estàndard; sense conflictes ni dubte. |
| **`apte_amb_limitacions`** | GO parcial | Només si §5 es compleix **al complet**. |
| **`no_apte`** | NO-GO | Rebutjar inferència automàtica com a camí principal. |

---

## 3) `apte` — predomini operatiu (regions delimitables)

**Regla de comptatge:** classifiqueu cada ítem avaluable com **`d`** (té regió delimitable a plantilla: tancat o requadre fix propi) o **`n`** (text lliure sense caixa pròpia, o regió compartida amb identificació, o no assignable a coordenades estables).

**Per obtenir `apte` cal tot això:**

1. **`#d > #n`** (estricte: més ítems delimitables que no delimitables).
2. Si es coneix el **pes** de cada ítem a la nota: la suma de pesos dels **`n`** ha de ser **estrictament inferior** a la suma de pesos dels **`d`**. Si **no** es coneix el pes: només (1).
3. **Cap** ítem `n` és **crític** per al negoci del flux: aquí “crític” vol dir *única peça* sense la qual no té sentit el pipeline (p. ex. un sol desenvolupament lliure que concentra tota la nota). Un sol ítem `n` que concentra la major part de la nota → **`no_apte`** (cas mixt no apte).

**Cas mixt (resum):** si la part **no estructurada / no delimitable** és **majoritària** en nombre d’ítems **o** en pes de nota **o** és l’**únic nucli** avaluable → **`no_apte`**, no `apte`.

Resta de requisits `apte` (sense canvi de sentit): layout fix entre còpies; sense enunciats únics per alumne dins la mateixa casella de resposta.

---

## 4) Separació identitat / resposta (regla dura)

**`no_apte`** si es compleix **qualsevol**:

- Identificació (nom, DNI, número, signatura identificable) **dins** la mateixa regió que la resposta avaluable, **o** a la mateixa línia/bloc de resposta, **o** de manera que llegir la resposta exigeixi llegir la identificació en el mateix fragment.
- Identificació **reutilitzada** com a part del contingut a corregir (p. ex. “signa aquí” dins l’àrea de nota).

*En aquest contracte no s’accepta “es podrà separar amb IA” com a argument per evitar `no_apte`.*

---

## 5) `apte_amb_limitacions` (molt restringit)

Només vàlid si **tot** això és cert:

1. **Llista tancada** de **fins a 3** limitacions, cadascuna en **una frase** concreta (accionable).
2. Cada limitació és d’aquest conjunt **permès** (compatible amb pipeline sense inferència oberta sobre tot el document):
   - revisió humana obligatòria d’**un** requadre o ítem **ja delimitat**;
   - **exclusió** d’una pàgina o secció **numerada** del processament automàtic;
   - **desactivació** d’un ítem concret en el flux automàtic.
3. **Cap** limitació del tipus “interpretar tot el full”, “decidir límits sobre la marxa” o equivalent.

Si (1)–(3) fallen → **`no_apte`**, no `apte_amb_limitacions`.

---

## 6) `no_apte` — triggers i conflictes

**Triggers addicionals (qualsevol → `no_apte`):**

- Text lliure sense caixa per pregunta com a forma principal de resposta.
- Layout diferent per alumne o ordre aleatori sense mapa estable.
- Respostes en marges no delimitats o barreja enunciat/resposta sense zones fixes.
- Dubte raonable sobre §1–§3.

**Resolució de conflictes:**

- Si dues regles o dues lectures del mateix examen donen resultats **incompatibles** (p. ex. un camí diu `apte` i un altre `no_apte`) → **`no_apte`**.
- Si després d’aplicar les regles ordades (§7) el cas **no** encaixa en `apte` ni en `apte_amb_limitacions` → **`no_apte`**.

---

## 7) Ordre d’aplicació (decisió)

1. Comprovar **`no_apte`** per §4, §6 (triggers) i §3 (cas mixt majoritari / crític): si aplica → **`no_apte`**.
2. Si no → comprovar **`apte`** (§3 complet + §1).
3. Si no és `apte` però tampoc ha caigut en `no_apte` al pas 1 → comprovar **`apte_amb_limitacions`** (§5 complet); si falla → **`no_apte`**.

**Minimització de dades:** excloure identificadors i fragments no necessaris per plantilla i mapatge; qualsevol dubte sobre necessitat → **`no_apte`** fins a criteri escrit de PM.

---

## 8) Exemples

1. Graella OM/R + capçalera separada → **`apte`**.
2. Deu pàgines de desenvolupament lliure sense caixes → **`no_apte`**.
3. Graella estable a totes les pàgines rellevants; cal **excloure la pàgina 4** (duplicat d’escaneig); una sola limitació de tipus «exclusió de pàgina numerada» → **`apte_amb_limitacions`**.
4. Nom escrit a mà dins cada resposta → **`no_apte`** (§4).
5. Sis ítems `d` i vuit ítems `n` → **`no_apte`** (§3: `#d` no és major que `#n`).

---

## 9) Fora d’abast

Formats de fitxer, implementació de comptadors, prompts i schemas: fora d’aquest document; aquest contracte ha de ser **executable** per un agent sense interpretació creativa.
