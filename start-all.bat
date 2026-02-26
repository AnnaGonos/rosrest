@echo off
echo Starting all RosRest services...
echo.

start "API (port 3002)" cmd /k "cd /d %~dp0apps\api && npm run dev"
timeout /t 3 /nobreak >nul

start "Admin (port 3001)" cmd /k "cd /d %~dp0apps\admin && npm run dev"
timeout /t 2 /nobreak >nul

start "Site (port 3000)" cmd /k "cd /d %~dp0apps\site && npm run dev"

echo.
echo All services started!
echo.
echo API:    http://localhost:3002
echo Admin:  http://localhost:3001  (admin.rosrest.com)
echo Site:   http://localhost:3000  (rosrest.com)
echo.
pause
