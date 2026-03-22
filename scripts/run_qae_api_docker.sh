#!/usr/bin/env bash
# Servidor QAE dins Docker (útil si al host no hi ha npm / Node).
# Publica el port 8787 al host. Cal QAE_DEV_HOST=0.0.0.0 per acceptar el mapeig de ports.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if docker compose version >/dev/null 2>&1; then
  DC=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  DC=(docker-compose)
else
  echo "run_qae_api_docker.sh: cal Docker Compose (docker compose o docker-compose)." >&2
  exit 1
fi

PUBLISH="${QAE_API_PUBLISH_PORT:-8787}"

exec "${DC[@]}" run --rm \
  -p "${PUBLISH}:8787" \
  -e QAE_DEV_HOST=0.0.0.0 \
  -e QAE_API_PORT=8787 \
  frontend-check sh -c "npm ci && cd apps/frontend && npm run dev:qae-api"
