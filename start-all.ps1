Write-Host "Starting all RosRest services..." -ForegroundColor Green
Write-Host ""

Write-Host "Starting API on port 3002..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\apps\api'; npm run dev"
Start-Sleep -Seconds 3

Write-Host "Starting Admin on port 3001..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\apps\admin'; npm run dev"
Start-Sleep -Seconds 2

Write-Host "Starting Site on port 3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\apps\site'; npm run dev"

Write-Host ""
Write-Host "All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "API:    http://localhost:3002" -ForegroundColor Yellow
Write-Host "Admin:  http://localhost:3001  (admin.rosrest.com)" -ForegroundColor Yellow
Write-Host "Site:   http://localhost:3000  (rosrest.com)" -ForegroundColor Yellow
Write-Host ""
