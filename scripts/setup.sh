#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Denshees Project Setup ==="
echo ""

# 1. Copy .env.example files to .env (if .env doesn't already exist)
copy_env() {
  local dir="$1"
  local name="$2"
  if [ -f "$dir/.env" ]; then
    echo "[$name] .env already exists, skipping."
  elif [ -f "$dir/.env.example" ]; then
    cp "$dir/.env.example" "$dir/.env"
    echo "[$name] Created .env from .env.example — please fill in your values."
  else
    echo "[$name] No .env.example found, skipping."
  fi
}Campaign

echo "--- Setting up environment files ---"
copy_env "$ROOT_DIR/apps/denshees-frontend" "frontend"
copy_env "$ROOT_DIR/apps/denshees-backend" "backend"
echo ""

# 2. Install dependencies
echo "--- Installing dependencies ---"
cd "$ROOT_DIR"
pnpm install
echo ""

# 3. Generate Prisma client and run migrations
echo "--- Running database migrations ---"
pnpm --filter @denshees/database db:generate
pnpm --filter @denshees/database db:migrate
echo ""

echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "  1. Fill in your .env files with real values"
echo "  2. Run 'pnpm dev' to start the development servers"
