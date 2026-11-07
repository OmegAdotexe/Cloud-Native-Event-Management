@echo off
echo Stopping Relay / CampusConnect services...

REM Stop docker containers
docker stop campusconnect-postgres campusconnect-mailhog >nul 2>&1

echo Containers stopped. Close the Backend and Frontend command prompt windows to stop the servers.
pause
