# Setup environment for Babylon development
# Run this before running bun commands: . .\setup-env.ps1

$env:DATABASE_URL = "postgresql://babylon:babylon_dev_password@localhost:5433/babylon"
Write-Host "✅ DATABASE_URL set to: postgresql://babylon:****@localhost:5433/babylon" -ForegroundColor Green

# Verify Docker is running
$postgresRunning = docker ps --filter "name=babylon-postgres" --format "{{.Names}}" | Select-String "babylon-postgres"
if ($postgresRunning) {
    Write-Host "✅ PostgreSQL container is running" -ForegroundColor Green
} else {
    Write-Host "⚠️  PostgreSQL container is not running. Run: docker-compose up -d" -ForegroundColor Yellow
}
