@echo off
setlocal EnableExtensions

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

if not exist ".env" (
  echo Error: .env was not found.
  echo Copy .env.example to .env and configure DATABASE_URL and JWT_SECRET.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo Error: npm was not found. Install Node.js 20 or newer.
  exit /b 1
)

if not exist "node_modules" (
  call npm install
  if errorlevel 1 exit /b %errorlevel%
)

set "API_PORT=3000"
for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$line = Get-Content -LiteralPath '.env' | Where-Object { $_ -match '^PORT=' } | Select-Object -First 1; if ($line) { $line.Substring(5).Trim() }"`) do set "API_PORT=%%P"
set "WEB_PORT=4173"

echo Stopping old listeners on ports %API_PORT% and %WEB_PORT%...
powershell -NoProfile -Command ^
  "$ports = @(%API_PORT%, %WEB_PORT%);" ^
  "$pids = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort } | Select-Object -ExpandProperty OwningProcess -Unique;" ^
  "foreach ($processId in $pids) { try { Stop-Process -Id $processId -Force -ErrorAction Stop; Write-Host ('Stopped PID ' + $processId) } catch { Write-Warning $_.Exception.Message } }"

echo Web: http://localhost:4173/
echo API: http://localhost:%API_PORT%/api/health
echo Press Ctrl+C to stop both processes.
echo.
call npm run dev
