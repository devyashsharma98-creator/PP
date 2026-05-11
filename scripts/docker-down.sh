#!/bin/bash
# =============================================================================
# Pragya-Pravah — Docker Stop & Cleanup Script
# =============================================================================

set -e

echo "Stopping Pragya-Pravah services..."
docker compose down

echo "Done."
