# =============================================================================
# Pragya-Pravah — Docker Development Makefile
# =============================================================================
# Usage: make up | make down | make logs | make shell
# =============================================================================

.PHONY: up down build rebuild logs shell app-shell db-shell grpc-shell test clean

# Detect OS for script selection
ifeq ($(OS),Windows_NT)
    UP_SCRIPT = powershell -ExecutionPolicy Bypass -File scripts/docker-up.ps1
else
    UP_SCRIPT = bash scripts/docker-up.sh
endif

# ─── Lifecycle ─────────────────────────────────────────────────────────────

up:
	$(UP_SCRIPT)

down:
	docker compose down

down-clean:
	docker compose down -v --rmi local

build:
	docker compose build

rebuild:
	docker compose build --no-cache

# ─── Logs ──────────────────────────────────────────────────────────────────

logs:
	docker compose logs -f

logs-app:
	docker compose logs -f app

logs-db:
	docker compose logs -f db

logs-grpc:
	docker compose logs -f grpc

logs-nginx:
	docker compose logs -f nginx

# ─── Shell Access ──────────────────────────────────────────────────────────

shell-app:
	docker compose exec app sh

shell-db:
	docker compose exec db psql -U postgres -d pragyapravah

shell-grpc:
	docker compose exec grpc sh

shell-nginx:
	docker compose exec nginx sh

# ─── Database ──────────────────────────────────────────────────────────────

db-migrate:
	docker compose exec app npx drizzle-kit migrate

db-generate:
	docker compose exec app npx drizzle-kit generate

db-push:
	docker compose exec app npx drizzle-kit push

db-studio:
	docker compose exec app npx drizzle-kit studio

db-seed:
	docker compose exec app npx tsx src/db/seed.ts

db-reset:
	make down-clean
	make up

# ─── Testing ───────────────────────────────────────────────────────────────

test:
	docker compose exec app npm test

typecheck:
	docker compose exec app npm run typecheck

# ─── Maintenance ───────────────────────────────────────────────────────────

prune:
	docker system prune -f

stats:
	docker compose stats
