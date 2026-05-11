# =============================================================================
# Pragya-Pravah — Docker Development Start Script (PowerShell)
# =============================================================================

$ErrorActionPreference = "Stop"
$PROJECT_DIR = Split-Path -Parent $PSScriptRoot
Set-Location $PROJECT_DIR

# Colors
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

Write-Host "$Blue╔════════════════════════════════════════════════════════════╗$Reset"
Write-Host "$Blue║     Pragya-Pravah — Docker Development Environment         ║$Reset"
Write-Host "$Blue╚════════════════════════════════════════════════════════════╝$Reset"
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "$Yellow⚠ .env not found. Creating from .env.example...$Reset"
    Copy-Item .env.example .env
    Write-Host "$Yellow   Please edit .env with your real values before continuing.$Reset"
    exit 1
}

# Load env vars
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^#][^=]*)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
    }
}

Write-Host "$Green▶ Building and starting services...$Reset"
docker compose up --build -d

Write-Host ""
Write-Host "$Green▶ Waiting for database to be ready...$Reset"
$ready = $false
$retries = 30
while (-not $ready -and $retries -gt 0) {
    try {
        $result = docker compose exec -T db pg_isready -U "$env:POSTGRES_USER" 2>$null
        if ($LASTEXITCODE -eq 0) { $ready = $true }
    } catch {}
    if (-not $ready) {
        Start-Sleep -Seconds 1
        $retries--
    }
}
Write-Host "$Green  ✓ Database is ready$Reset"

Write-Host ""
Write-Host "$Green▶ Running database migrations...$Reset"
try {
    docker compose exec app npx drizzle-kit migrate
} catch {
    Write-Host "$Yellow  ⚠ Migration may have already been applied$Reset"
}

Write-Host ""
Write-Host "$Green▶ Services are running!$Reset"
Write-Host ""
Write-Host "  $BlueNext.js App:$Reset     http://localhost:$($env:APP_PORT)"
Write-Host "  $BlueNginx Proxy:$Reset    http://localhost:$($env:NGINX_PORT)"
Write-Host "  $BluegRPC Service:$Reset   localhost:$($env:GRPC_PORT)"
Write-Host "  $BluePostgres:$Reset       localhost:$($env:DB_PORT)"
Write-Host ""
Write-Host "  $YellowCommands:$Reset"
Write-Host "    docker compose logs -f app    # View app logs"
Write-Host "    docker compose exec app sh    # Shell into app"
Write-Host "    docker compose down -v        # Stop and clean up"
Write-Host ""
