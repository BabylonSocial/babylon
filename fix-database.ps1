# Fix database password and test connection
Write-Host "🔧 Fixing database password..." -ForegroundColor Yellow

# Stop and remove postgres container and volume
Write-Host "Stopping postgres container..." -ForegroundColor Cyan
docker-compose stop postgres 2>&1 | Out-Null
docker-compose rm -f postgres 2>&1 | Out-Null

# Remove the volume to ensure fresh start
Write-Host "Removing postgres volume..." -ForegroundColor Cyan
docker volume rm babylon_postgres_data 2>&1 | Out-Null

# Start postgres fresh
Write-Host "Starting fresh postgres container..." -ForegroundColor Cyan
docker-compose up -d postgres

# Wait for postgres to be ready
Write-Host "Waiting for postgres to initialize (15 seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

# Verify it's running
$status = docker-compose ps postgres | Select-String "healthy"
if ($status) {
    Write-Host "✅ Postgres is healthy" -ForegroundColor Green
} else {
    Write-Host "⚠️  Postgres may still be starting. Waiting 10 more seconds..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Test connection
Write-Host "`n🧪 Testing database connection..." -ForegroundColor Cyan
$env:DATABASE_URL = "postgresql://babylon:babylon_dev_password@localhost:5433/babylon"

# Try to connect
$testResult = docker exec babylon-postgres psql -U babylon -d babylon -c "SELECT 'Connection successful!' as status;" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database connection successful!" -ForegroundColor Green
    Write-Host "`nYou can now run:" -ForegroundColor Cyan
    Write-Host "  . .\setup-env.ps1" -ForegroundColor White
    Write-Host "  bun run db:push" -ForegroundColor White
} else {
    Write-Host "❌ Connection failed. Output:" -ForegroundColor Red
    Write-Host $testResult
    Write-Host "`nTry manually resetting the password:" -ForegroundColor Yellow
    Write-Host "  docker exec babylon-postgres psql -U postgres -c `"ALTER USER babylon WITH PASSWORD 'babylon_dev_password';`"" -ForegroundColor White
}
