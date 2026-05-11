# =============================================================================
# Pragya-Pravah — Docker Stop & Cleanup Script (PowerShell)
# =============================================================================

Write-Host "Stopping Pragya-Pravah services..."
docker compose down
Write-Host "Done."
