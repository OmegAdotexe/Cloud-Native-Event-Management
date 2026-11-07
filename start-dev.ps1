# start-dev.ps1
# Helper script to launch all services for Relay / CampusConnect

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Starting CampusConnect / Relay Platform   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Start Docker Daemon if needed
$dockerRunning = docker ps 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[1/4] Starting Docker Desktop daemon..." -ForegroundColor Yellow
    Start-Process "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\com.docker.backend.exe" -WindowStyle Hidden
    Start-Sleep -Seconds 5
} else {
    Write-Host "[1/4] Docker daemon is running." -ForegroundColor Green
}

# 2. Ensure PostgreSQL & MailHog containers are running
$pgStatus = docker inspect -f '{{.State.Running}}' campusconnect-postgres 2>$null
if ($pgStatus -ne "true") {
    Write-Host "[2/4] Starting PostgreSQL container (port 5433)..." -ForegroundColor Yellow
    docker start campusconnect-postgres 2>$null
    if ($LASTEXITCODE -ne 0) {
        docker run -d --name campusconnect-postgres --restart unless-stopped -v campusconnect-postgres-data:/var/lib/postgresql/data -p 5433:5432 -e POSTGRES_DB=campusconnect -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres postgres:15-alpine
    }
} else {
    Write-Host "[2/4] PostgreSQL container is running on port 5433." -ForegroundColor Green
}

$mailhogStatus = docker inspect -f '{{.State.Running}}' campusconnect-mailhog 2>$null
if ($mailhogStatus -ne "true") {
    docker start campusconnect-mailhog 2>$null
    if ($LASTEXITCODE -ne 0) {
        docker run -d --name campusconnect-mailhog --restart unless-stopped -p 1025:1025 -p 8025:8025 mailhog/mailhog:latest 2>$null
    }
}

# 3. Check RabbitMQ service
$rabbitService = Get-Service RabbitMQ -ErrorAction SilentlyContinue
if ($rabbitService -and $rabbitService.Status -ne "Running") {
    Write-Host "[3/4] Starting RabbitMQ Windows Service..." -ForegroundColor Yellow
    Start-Service RabbitMQ
} else {
    Write-Host "[3/4] RabbitMQ is running on port 5672." -ForegroundColor Green
}

# 4. Launch Backend & Frontend in separate terminal windows
$rootPath = $PSScriptRoot
Write-Host "[4/4] Launching Spring Boot Backend (port 8080) and Vite Frontend (port 5173)..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootPath\backend'; `$env:PATH = \"$env:JAVA_HOME\bin;`$env:PATH\"; `$env:SPRING_PROFILES_ACTIVE='dev'; Write-Host 'Starting Backend API on http://localhost:8080...' -ForegroundColor Green; mvn spring-boot:run"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootPath'; Write-Host 'Starting Vite Frontend on http://localhost:5173...' -ForegroundColor Green; npm run dev"

Write-Host "`nAll services have been triggered!" -ForegroundColor Green
Write-Host "Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "Backend:   http://localhost:8080" -ForegroundColor White
Write-Host "RabbitMQ:  http://localhost:15672 (guest / guest)" -ForegroundColor White
Write-Host "Accounts:  superadmin@example.com / admin@example.com / participant@example.com (password: password)`n" -ForegroundColor White

