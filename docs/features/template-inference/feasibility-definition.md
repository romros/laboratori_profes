# Contracte de feasibility — template-inference (Feature 0)

**Versió:** 1.0 · **Àmbit:** decisió **go / no-go** abans de schemas, validators o integració LLM.  
**Filosofia:** **fail-closed** (davant dubte → no apte o amb limitacions explícites) i **minimització de dades** (només el necessari per la plantilla i la correcció).

---

## 1) Definició operativa: «seminanonimitzable»

En aquest producte, un examen és **seminanonimitzable** si es compleix **tot** el següent:

1. **Estructura repetible:** les pàgines tenen un **layout estable** (mateixes zones per a enunciats i respostes entre alumnes o entre versions del mateix examen), de manera que una **plantilla** pot referenciar coordenades o blocs sense dependre d’interpretar cada còpia com un cas únic.
2. **Respostes avaluables sense text lliure com a eix principal:** la puntuació prevista es basa en **opcions tancades** (p. ex. marcatge, caselles, graella) o en blocs on el contingut a avaluar està **delimitat** (àrea coneguda), no en assaigs extensos sense delimitació.
3. **Separació operativa identitat / correcció:** les dades identificatives de l’estudiant (nom, DNI, número d’alumne, etc.) poden **localitzar-se en zones concretes** o excloure’s del flux d’inferència de plantilla **sense** que la resta de l’examen sigui majoritàriament text lliure barrejat amb enunciats.

Si **falta** algun punt → l’examen **no** és seminanonimitzable en sentit estricte; vegeu §3 i §4 per classificar-lo com `no_apte` o `apte_amb_limitacions`.

---

## 2) Categories de resultat

| Codi | Nom | Significat |
|------|-----|------------|
| **`apte`** | GO | El pipeline de template-inference pot executar-se amb criteris normals; expectativa de resultat fiable sense advertències estructurals majors. |
| **`apte_amb_limitacions`** | GO parcial | El processament és permès **només** si l’usuari accepta limitacions documentades (p. ex. parts no automatitzables, revisió manual obligatòria en seccions concretes). |
| **`no_apte`** | NO-GO | No s’ha d’iniciar inferència automàtica de plantilla com a camí principal; cal canvi de format, redisseny de l’examen o flux manual fora d’aquest feature. |

---

## 3) Criteris d’`apte` (totes s’han de complir)

- Layout **fix** o quasi fix entre còpies (mateix nombre de seccions, mateix ordre, mateixes àrees de resposta).
- **Predomini clar** (en nombre d’ítems i en pes de la nota previst) de **respostes tancades** o de camps **delimitats**; el text lliure sense caixa pròpia és **minoritari** i **no** és el nucli de l’avaluació.
- Les dades personals ocupen **zones identificables** (capçalera, quadre reservat) o poden **ometre’s** del document processat sense trencar la lectura de la resta de respostes.
- No hi ha **dependència** de contingut generat a mà diferent per cada alumne dins la mateixa àrea de resposta (p. ex. enunciats únics per estudiant dins la mateixa casella de resposta).

---

## 4) Criteris d’`no_apte` (qualsevol és suficient)

- Predomini de **text lliure** sense delimitació per pregunta (assaig, composició, problemes oberts sense caselles).
- Layout **diferent** per alumne o **aleatorització** de preguntes sense mapa estable a plantilla.
- Respostes **barrejades** amb enunciats en el mateix flux sense zones fixes (p. ex. fulls escanejats sense estructura, marges amb anotacions manuals com a part de la resposta vàlida).
- **Impossibilitat** d’isolar identificadors sense llegir gran part del cos (p. ex. nom escrit a mà dins cada resposta).
- **Dubte raonable** sobre si es compleix §1 (definició) → es tracta com **`no_apte`** fins que el PM o una tasca explícita reclassifiqui el cas.

---

## 5) Criteris d’`apte_amb_limitacions`

Es fa servir quan **no** és `apte` però tampoc cau en tots els motius de `no_apte` de manera que impedeixi qualsevol ús. Indicadors típics:

- Barreja clara: **part tancada estructurada** + **una o poques** preguntes obertes delimitades (àrea fixa per pregunta).
- Capçalera amb dades personals **situada** però una secció amb text lliure **limitada** i etiquetada.
- Qualsevol cas on el revisor pugui llistar **fins a 3 limitacions concretes** (p. ex. «pregunta 5 només revisió humana», «ignorar pàgina 2 si escaneig duplicat»).

**Obligació:** les limitacions s’han de **enumerar** abans de continuar; sense llista explícita → classificar com `no_apte`.

---

## 6) Regles de decisió (ordre d’aplicació)

1. Si es compleix **§3 al complet** → **`apte`**.
2. Si es compleix **qualsevol punt de §4** → **`no_apte`** (tret que una tasca de PM defineixi una excepció escrita).
3. Si **no** és `apte` i **no** és `no_apte` segons §4, però hi ha **§5** amb limitacions enumerables → **`apte_amb_limitacions`**.
4. Si després d’aplicar 1–3 el cas queda **sense classe** → **`no_apte`** (fail-closed).
5. **Minimització de dades:** en tots els casos, el disseny del flux ha d’**excloure** identificadors i fragments no necessaris per inferir la plantilla i mapejar respostes; si cal més dada del mínim → justificar en la tasca o document de limitacions.

---

## 7) Exemples típics

1. **Full de respostes tipus test** amb graella OM/R, capçalera amb nom i assignatura → **`apte`**.
2. **Examen d’oposició** amb 10 pàgines de desenvolupament lliure sense caixes → **`no_apte`**.
3. **Parcial** amb 20 ítems tancats + 1 pregunta oberta en un requadre fix al final → **`apte_amb_limitacions`** (limitació: correcció manual de la pregunta oberta).
4. **PDF generat** amb mateixa plantilla però ordre de preguntes aleatori entre alumnes sense clau de mapatge → **`no_apte`**.
5. **Escaneig** amb enunciats impresos i respostes a llapis en marges no delimitats → **`no_apte`**.

---

## 8) Fora d’abast d’aquest document

No defineix formats de fitxer, llindars numèrics implementables, prompts ni schemas Zod: només el **contracte conceptual** per al futur validator i polítiques d’IA alineades amb **fail-closed** i **minimització de dades**.
