@echo off
setlocal

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

echo Web: http://localhost:4173/
echo API: http://localhost:3000/api/health
echo Press Ctrl+C to stop both processes.
echo.
call npm run dev
