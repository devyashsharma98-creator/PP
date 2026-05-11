#!/bin/bash
# =============================================================================
# Pragya-Pravah — Docker Development Start Script
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Pragya-Pravah — Docker Development Environment         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env exists, if not copy from example
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ .env not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}   Please edit .env with your real values before continuing.${NC}"
    exit 1
fi

# Export env vars for compose
export $(grep -v '^#' .env | xargs)

echo -e "${GREEN}▶ Building and starting services...${NC}"
docker compose up --build -d

echo ""
echo -e "${GREEN}▶ Waiting for database to be ready...${NC}"
until docker compose exec -T db pg_isready -U "${POSTGRES_USER:-postgres}" > /dev/null 2>&1; do
    sleep 1
done
echo -e "${GREEN}  ✓ Database is ready${NC}"

echo ""
echo -e "${GREEN}▶ Running database migrations...${NC}"
docker compose exec app npx drizzle-kit migrate || true

echo ""
echo -e "${GREEN}▶ Services are running!${NC}"
echo ""
echo -e "  ${BLUE}Next.js App:${NC}     http://localhost:${APP_PORT:-3000}"
echo -e "  ${BLUE}Nginx Proxy:${NC}    http://localhost:${NGINX_PORT:-80}"
echo -e "  ${BLUE}gRPC Service:${NC}   localhost:${GRPC_PORT:-50051}"
echo -e "  ${BLUE}Postgres:${NC}       localhost:${DB_PORT:-5432}"
echo -e "  ${BLUE}Neon Local:${NC}     localhost:${NEON_PORT:-5433} (if using --profile neon)"
echo ""
echo -e "  ${YELLOW}Commands:${NC}"
echo -e "    docker compose logs -f app    # View app logs"
echo -e "    docker compose exec app sh    # Shell into app"
echo -e "    docker compose down -v        # Stop and clean up"
echo ""
