#!/bin/bash
# =============================================================================
# Pragya-Pravah — Docker Development Mode (Hot Reload)
# =============================================================================
# This starts ONLY the app in dev mode with volume mounts for live code editing.
# The database and other services must be running separately.
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

if [ ! -f .env ]; then
    echo "⚠ .env not found. Creating from .env.example..."
    cp .env.example .env
    echo "Please edit .env before continuing."
    exit 1
fi

# Start only app in dev mode
echo "🚀 Starting Next.js in development mode with hot reload..."
docker compose -f docker-compose.yml -f docker-compose.override.yml up --build app
