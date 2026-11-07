@echo off
echo ========================================================
echo Starting Relay / CampusConnect Services
echo ========================================================

REM 1. Ensure Docker containers are running
echo Starting PostgreSQL and MailHog containers...
docker start campusconnect-postgres campusconnect-mailhog >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Note: If containers aren't created yet, please start Docker Desktop.
)

REM 2. Start Backend in a new window
echo Starting Backend API on port 8080...
start "CampusConnect-Backend" cmd /c "cd /d %~dp0backend && \"C:\Program Files\Java\jdk-25.0.3\bin\java.exe\" -jar target\backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev --DB_PORT=5433 --DB_USER=postgres --DB_PASSWORD=postgres --DB_NAME=campusconnect --RABBITMQ_HOST=localhost --RABBITMQ_PORT=5672 --RABBITMQ_USER=guest --RABBITMQ_PASSWORD=guest --JWT_SECRET=RYuPADGXp6U3uf5t4rr_qzZlIY1-yETCfAW0VQb___4"

REM 3. Start Frontend in a new window
echo Starting Frontend Web App on port 5173...
start "CampusConnect-Frontend" cmd /c "cd /d %~dp0 && npm run dev -- --host 0.0.0.0 --port 5173"

echo ========================================================
echo All services launched!
echo - Frontend:  http://localhost:5173
echo - Backend:   http://localhost:8080
echo - MailHog:   http://localhost:8025
echo - RabbitMQ:  http://localhost:15672
echo ========================================================
pause
