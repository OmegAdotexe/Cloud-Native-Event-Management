# start-dev.ps1
# Helper script to launch all services for Relay / CampusConnect

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Starting CampusConnect / Relay Platform   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$rootPath = $PSScriptRoot

# 1. Start Docker containers (PostgreSQL, RabbitMQ, MailHog) via docker compose
Write-Host "[1/3] Starting infrastructure containers (PostgreSQL :5432, RabbitMQ :5672, MailHog :1025/:8025)..." -ForegroundColor Yellow
$composeFile = Join-Path $rootPath "backend\docker-compose.yml"
docker compose -f $composeFile up -d 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Docker Compose failed or Docker Desktop is not running." -ForegroundColor Red
    Write-Host "If running without Docker, you can run the backend in standalone in-memory mode using:" -ForegroundColor Yellow
    Write-Host "  mvn spring-boot:run `"-Dspring-boot.run.profiles=local,dev`"" -ForegroundColor Cyan
} else {
    Write-Host "Infrastructure containers are up and running." -ForegroundColor Green
}

# 2. Launch Backend & Frontend in separate terminal windows
Write-Host "[2/3] Launching Spring Boot Backend (port 8080)..." -ForegroundColor Cyan
$javaPathCmd = if ($env:JAVA_HOME) { "`$env:PATH = `"$env:JAVA_HOME\bin;`$env:PATH`";" } else { "" }
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootPath\backend'; $javaPathCmd `$env:SPRING_PROFILES_ACTIVE='dev'; Write-Host 'Starting Backend API on http://localhost:8080...' -ForegroundColor Green; mvn spring-boot:run"

Write-Host "[3/3] Launching Vite Frontend (port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootPath'; Write-Host 'Starting Vite Frontend on http://localhost:5173...' -ForegroundColor Green; npm run dev"

Write-Host "`nAll services have been triggered!" -ForegroundColor Green
Write-Host "Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "Backend:   http://localhost:8080" -ForegroundColor White
Write-Host "MailHog:   http://localhost:8025" -ForegroundColor White
Write-Host "RabbitMQ:  http://localhost:15672 (guest / guest)" -ForegroundColor White
Write-Host "Accounts:  superadmin@example.com / admin@example.com / participant@example.com (password: password)`n" -ForegroundColor White
