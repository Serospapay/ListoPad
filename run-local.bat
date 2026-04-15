@echo off
setlocal enableextensions enabledelayedexpansion

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo.
echo ==========================================
echo   Lystopad Local Runner
echo ==========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install Node.js ^>= 18.
  pause
  exit /b 1
)

set "PY_CMD=python"
where python >nul 2>&1
if errorlevel 1 (
  where py >nul 2>&1
  if errorlevel 1 (
    echo [ERROR] Python not found. Install Python 3.9+.
    pause
    exit /b 1
  ) else (
    set "PY_CMD=py -3"
  )
)

echo [1/5] Installing frontend dependencies...
call npm install
if errorlevel 1 (
  echo [ERROR] npm install failed.
  pause
  exit /b 1
)

echo [2/5] Installing backend dependencies...
call %PY_CMD% -m pip install -r requirements.txt
if errorlevel 1 (
  echo [ERROR] pip install failed.
  pause
  exit /b 1
)

echo [3/5] Running database migrations...
call %PY_CMD% manage.py migrate
if errorlevel 1 (
  echo [ERROR] Django migrations failed.
  pause
  exit /b 1
)

echo [4/5] Starting backend at http://127.0.0.1:8000 ...
start "Lystopad Backend" cmd /k "cd /d \"%ROOT_DIR%\" && %PY_CMD% manage.py runserver 127.0.0.1:8000"

echo [5/5] Starting frontend at http://127.0.0.1:3000 ...
start "Lystopad Frontend" cmd /k "cd /d \"%ROOT_DIR%\" && npm run dev -- --host 127.0.0.1 --port 3000"

echo.
echo Services started:
echo - Backend:  http://127.0.0.1:8000
echo - Frontend: http://127.0.0.1:3000
echo.
echo Press any key to close this launcher...
pause >nul
exit /b 0
