@echo off
setlocal EnableExtensions

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo [1/4] Checking Node.js and npm...
where node >nul 2>nul || (
  echo Error: Node.js was not found. Install Node.js 20 or newer.
  exit /b 1
)
where npm >nul 2>nul || (
  echo Error: npm was not found.
  exit /b 1
)

for /f "delims=" %%V in ('node -p "process.versions.node.split('.')[0]"') do set "NODE_MAJOR=%%V"
if %NODE_MAJOR% LSS 20 (
  echo Error: Node.js 20 or newer is required. Current version:
  node --version
  exit /b 1
)

echo [2/4] Preparing environment...
if not exist ".env" (
  copy /y ".env.example" ".env" >nul
  for /f "delims=" %%S in ('node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"') do set "JWT_SECRET=%%S"
  powershell -NoProfile -Command ^
    "$path = Join-Path (Get-Location) '.env';" ^
    "$content = Get-Content -LiteralPath $path -Raw;" ^
    "$content = $content -replace '(?m)^JWT_SECRET=.*$', ('JWT_SECRET=' + $env:JWT_SECRET);" ^
    "[System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))"
  echo Created .env with a new JWT secret.
  echo Review DATABASE_URL in .env if your PostgreSQL credentials differ.
) else (
  echo Existing .env kept unchanged.
)

echo [3/4] Installing dependencies...
call npm install
if errorlevel 1 exit /b %errorlevel%

echo [4/4] Applying database schema...
where psql >nul 2>nul
if errorlevel 1 (
  echo Warning: psql was not found. Install PostgreSQL and run:
  echo   psql DATABASE_URL -f database\schema.sql
) else (
  for /f "usebackq delims=" %%D in (`powershell -NoProfile -Command "$line = Get-Content -LiteralPath '.env' | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1; if ($line) { $line.Substring(13).Trim() }"`) do set "DATABASE_URL=%%D"
  if not defined DATABASE_URL (
    echo Warning: DATABASE_URL is missing from .env. Schema was not applied.
  ) else (
    psql "%DATABASE_URL%" -f "database\schema.sql"
    if errorlevel 1 (
      echo Warning: Could not apply schema. Check PostgreSQL and DATABASE_URL, then run install.bat again.
    ) else (
      echo Database schema applied.
    )
  )
)

echo.
echo Installation complete.
echo Run: run-public-server.bat
