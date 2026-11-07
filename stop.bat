@echo off
echo ========================================================
echo Stopping Relay / CampusConnect Services
echo ========================================================

REM 1. Stop docker containers
echo Stopping PostgreSQL and MailHog containers...
docker stop campusconnect-postgres campusconnect-mailhog >nul 2>&1

REM 2. Terminate background processes on port 8080 (backend) and 5173 (frontend)
echo Stopping Java backend and Node frontend processes...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8080,5173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

echo ========================================================
echo All CampusConnect services and containers stopped.
echo ========================================================
pause
