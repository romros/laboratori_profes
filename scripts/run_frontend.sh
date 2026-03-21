#!/usr/bin/env bash
# Validació canònica del frontend: tot s’executa dins el contenidor frontend-check (Docker).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if docker compose version >/dev/null 2>&1; then
  DC=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  DC=(docker-compose)
else
  echo "run_frontend.sh: cal Docker Compose (docker compose o docker-compose)." >&2
  exit 1
fi

cmd="${1:-}"
case "$cmd" in
  test | typecheck | lint | build)
    "${DC[@]}" run --rm frontend-check sh -c "npm ci && npm run $cmd"
    ;;
  shell)
    "${DC[@]}" run --rm frontend-check sh -l
    ;;
  *)
    echo "Ús: $0 test|typecheck|lint|build|shell" >&2
    echo "  Executa la comanda npm corresponent dins el servei frontend-check (Node 22)." >&2
    exit 1
    ;;
esac
