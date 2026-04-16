@echo off
setlocal enableextensions enabledelayedexpansion

set "NO_PAUSE=0"
set "SKIP_INSTALL=0"

:parse_args
if "%~1"=="" goto :args_done
if /I "%~1"=="--no-pause" set "NO_PAUSE=1"
if /I "%~1"=="--skip-install" set "SKIP_INSTALL=1"
shift
goto :parse_args
:args_done

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"
cd /d "%ROOT_DIR%"

echo.
echo ==========================================
echo   Lystopad Local Runner
echo ==========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install Node.js ^>= 18.
  call :maybe_pause
  exit /b 1
)

set "PY_CMD="
if exist "%ROOT_DIR%\.venv\Scripts\python.exe" (
  call "%ROOT_DIR%\.venv\Scripts\python.exe" --version >nul 2>&1
  if not errorlevel 1 set "PY_CMD=%ROOT_DIR%\.venv\Scripts\python.exe"
)
if not defined PY_CMD (
  where python >nul 2>&1
  if not errorlevel 1 (
    call python --version >nul 2>&1
    if not errorlevel 1 set "PY_CMD=python"
  )
)
if not defined PY_CMD (
  where py >nul 2>&1
  if not errorlevel 1 (
    call py -3 --version >nul 2>&1
    if not errorlevel 1 set "PY_CMD=py -3"
  )
)
if not defined PY_CMD (
  echo [ERROR] Python not found. Install Python 3.9+ or recreate .venv.
  call :maybe_pause
  exit /b 1
)

if "%SKIP_INSTALL%"=="1" (
  echo [1/5] Skipping dependency installation ^(--skip-install^).
) else (
  echo [1/5] Installing frontend dependencies...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    call :maybe_pause
    exit /b 1
  )

  echo [2/5] Installing backend dependencies...
  call %PY_CMD% -m pip install -r requirements.txt
  if errorlevel 1 (
    echo [ERROR] pip install failed.
    call :maybe_pause
    exit /b 1
  )
)

echo [3/5] Running database migrations...
call %PY_CMD% manage.py migrate
if errorlevel 1 (
  echo [ERROR] Django migrations failed.
  call :maybe_pause
  exit /b 1
)

echo [4/5] Starting backend at http://127.0.0.1:8000 ...
set "BACKEND_START_CMD=cd /d ""%ROOT_DIR%"" && %PY_CMD% manage.py runserver 127.0.0.1:8000"
start "Lystopad Backend" cmd /k "%BACKEND_START_CMD%"

echo [5/5] Starting frontend at http://127.0.0.1:3000 ...
set "FRONTEND_START_CMD=cd /d ""%ROOT_DIR%"" && npm run dev -- --host 127.0.0.1 --port 3000"
start "Lystopad Frontend" cmd /k "%FRONTEND_START_CMD%"

echo.
echo Services started:
echo - Backend:  http://127.0.0.1:8000
echo - Frontend: http://127.0.0.1:3000
echo.
if "%NO_PAUSE%"=="1" goto :EOF
echo Press any key to close this launcher...
call :maybe_pause
exit /b 0

:maybe_pause
if "%NO_PAUSE%"=="1" exit /b 0
pause >nul
exit /b 0
