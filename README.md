# laboratori_profes

Monorepo del **Laboratori Profes**: una sola base de codi, frontend oficial a **`apps/frontend`**.

**Agents i models:** comença per **`llm.txt`** (índex jeràrquic i URLs raw). Després **`AGENTS_ARQUITECTURA.md`** (normativa) i **`docs/ESTAT.md`** (estat i verificació). Resum de disseny: **`docs/architecture.md`**; eines: **`docs/engineering-rules.md`**.

**`legacy/figma-prototype`** és històric i **no oficial**; no l’usis com a base de noves features.

## Requisits

- Node.js **≥ 20** (recomanat **22**, com a CI i Docker).

## Validació canònica del frontend (Docker)

La **font de veritat** per `test`, `typecheck`, `lint` i `build` és el contenidor **`frontend-check`** (Node 22), no el `npm` del host.

Des de l’arrel del repo (cal Docker):

```bash
./scripts/run_frontend.sh test
./scripts/run_frontend.sh typecheck
./scripts/run_frontend.sh lint
./scripts/run_frontend.sh build
```

Atajos equivalents: `./test.sh`, `./typecheck.sh`, `./lint.sh`, `./build.sh`.

Cada execució fa `npm ci` dins el contenidor i després la comanda; les dependències es guarden en volums Docker (`node_modules_root`, `node_modules_apps_frontend`).

## Desenvolupament local

Opcional al host (conveniència; **no** substitueix la validació Docker per tancar tasques):

```bash
npm install
npm run dev
```

Altres scripts al host: `npm run build`, `test`, `lint`, `typecheck` — mateixes comandes que al contenidor, però la verificació oficial és la de la secció anterior.

## Visualitzar amb Docker

Des de l’arrel del projecte:

```bash
docker compose up -d --build
```

(`-d` en segon pla; el servei té `restart: unless-stopped` per sobreviure reinicis del servidor.)

Per defecte:

- **HTTP:** port **9088** → `http://IP:9088`
- **HTTPS:** port **9443** → `https://IP:9443` (certificat **autofirmat**)

Al mateix servidor: http://localhost:9088 i https://localhost:9443

### HTTPS (autofirmat)

El navegador mostrarà **avís de seguretat** (no és Let’s Encrypt). Cal acceptar el risc / “Continuar al lloc” per veure la pàgina.

Perquè el cert inclogui la **IP pública** (i redueixi errors de nom), crea un fitxer `.env` al costat de `docker-compose.yml`:

```bash
cp .env.example .env
# edita PROFES_TLS_SAN_IP amb la IP del servidor
docker compose up -d --build
```

O en una línia: `PROFES_TLS_SAN_IP=46.225.28.149 docker compose up -d --build`

**HTTPS de confiança (sense avís):** cal un **domini** apuntant al servidor i un proxy amb **Let’s Encrypt** (Caddy, Traefik, etc.); això no ho cobreix aquest MVP.

Canviar ports del host:

```bash
PROFES_HTTP_PORT=9100 PROFES_HTTPS_PORT=9543 docker compose up -d --build
```

### Obrir el port cap a internet

Docker ja escolta a `0.0.0.0`. Al firewall del proveïdor, obre **TCP** al **9088** (HTTP) i, si vols HTTPS, al **9443**.

1. Regles **inbound** cap a la IP del servidor.
2. Prova: `http://IP:9088` i/o `https://IP:9443`

**Seguretat:** qualsevol amb l’URL pot veure la UI; si el proveïdor ho permet, val la pena **restringir per IP** (només la teva IP de casa) a la regla del firewall.

## CI

Workflow **`.github/workflows/ci.yml`**: instal·lació amb `npm ci`, després `lint`, `typecheck`, `test`, `build`.
