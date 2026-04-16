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
  echo [1/7] Skipping dependency installation ^(--skip-install^).
) else (
  echo [1/7] Installing frontend dependencies...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    call :maybe_pause
    exit /b 1
  )

  echo [2/7] Installing backend dependencies...
  call %PY_CMD% -m pip install -r requirements.txt
  if errorlevel 1 (
    echo [ERROR] pip install failed.
    call :maybe_pause
    exit /b 1
  )
)

set "DB_ENGINE_RUNTIME=%DB_ENGINE%"
if not defined DB_ENGINE_RUNTIME (
  if exist "%ROOT_DIR%\.env" (
    for /f "usebackq tokens=1,* delims==" %%A in (`findstr /R /B /C:"DB_ENGINE=" "%ROOT_DIR%\.env"`) do (
      if /I "%%A"=="DB_ENGINE" set "DB_ENGINE_RUNTIME=%%B"
    )
  )
)
if not defined DB_ENGINE_RUNTIME set "DB_ENGINE_RUNTIME=mongodb"

set "DB_ENGINE=%DB_ENGINE_RUNTIME%"

echo [3/7] Checking database connectivity...
if /I "%DB_ENGINE_RUNTIME%"=="mongodb" (
  call :require_mongodb_backend
  if errorlevel 1 (
    call :maybe_pause
    exit /b 1
  )
)
if /I "%DB_ENGINE_RUNTIME%"=="mongo" (
  call :require_mongodb_backend
  if errorlevel 1 (
    call :maybe_pause
    exit /b 1
  )
)
set "DB_ENGINE=%DB_ENGINE_RUNTIME%"

if /I "%DB_ENGINE_RUNTIME%"=="mongodb" (
  set "MONGODB_URI_RUNTIME=%MONGODB_URI%"
  if not defined MONGODB_URI_RUNTIME (
    if exist "%ROOT_DIR%\.env" (
      for /f "usebackq tokens=1,* delims==" %%A in (`findstr /R /B /C:"MONGODB_URI=" "%ROOT_DIR%\.env"`) do (
        if /I "%%A"=="MONGODB_URI" set "MONGODB_URI_RUNTIME=%%B"
      )
    )
  )
  if not defined MONGODB_URI_RUNTIME set "MONGODB_URI_RUNTIME=mongodb://localhost:27017/"
  call :check_mongodb "%MONGODB_URI_RUNTIME%"
  if errorlevel 1 (
    echo [ERROR] MongoDB is not reachable: %MONGODB_URI_RUNTIME%
    call :detect_mongodb_service
    if /I "%MONGO_SERVICE_STATUS%"=="running" (
      echo         MongoDB service is running, but connection still failed.
      echo         Check host/port in MONGODB_URI and firewall rules.
    ) else if /I "%MONGO_SERVICE_STATUS%"=="stopped" (
      echo         MongoDB service is installed but stopped.
      echo         Start it and retry.
    ) else if /I "%MONGO_SERVICE_STATUS%"=="not_found" (
      echo         MongoDB service was not found on this machine.
      echo         Install/start MongoDB or use a reachable external URI.
    ) else (
      echo         Could not determine MongoDB service state.
    )
    call :maybe_pause
    exit /b 1
  )
) else if /I "%DB_ENGINE_RUNTIME%"=="mongo" (
  set "MONGODB_URI_RUNTIME=%MONGODB_URI%"
  if not defined MONGODB_URI_RUNTIME (
    if exist "%ROOT_DIR%\.env" (
      for /f "usebackq tokens=1,* delims==" %%A in (`findstr /R /B /C:"MONGODB_URI=" "%ROOT_DIR%\.env"`) do (
        if /I "%%A"=="MONGODB_URI" set "MONGODB_URI_RUNTIME=%%B"
      )
    )
  )
  if not defined MONGODB_URI_RUNTIME set "MONGODB_URI_RUNTIME=mongodb://localhost:27017/"
  call :check_mongodb "%MONGODB_URI_RUNTIME%"
  if errorlevel 1 (
    echo [ERROR] MongoDB is not reachable: %MONGODB_URI_RUNTIME%
    call :detect_mongodb_service
    if /I "%MONGO_SERVICE_STATUS%"=="running" (
      echo         MongoDB service is running, but connection still failed.
      echo         Check host/port in MONGODB_URI and firewall rules.
    ) else if /I "%MONGO_SERVICE_STATUS%"=="stopped" (
      echo         MongoDB service is installed but stopped.
      echo         Start it and retry.
    ) else if /I "%MONGO_SERVICE_STATUS%"=="not_found" (
      echo         MongoDB service was not found on this machine.
      echo         Install/start MongoDB or use a reachable external URI.
    ) else (
      echo         Could not determine MongoDB service state.
    )
    call :maybe_pause
    exit /b 1
  )
) else (
  echo [INFO] DB_ENGINE=%DB_ENGINE_RUNTIME% ^- MongoDB check skipped.
)

if defined MONGODB_URI_RUNTIME set "MONGODB_URI=%MONGODB_URI_RUNTIME%"

echo [4/7] Running database migrations...
call %PY_CMD% manage.py mongo_migrate --noinput
if errorlevel 1 (
  echo [ERROR] Django migrations failed.
  call :maybe_pause
  exit /b 1
)

echo [5/7] Seeding demo catalog ^(real books, idempotent^)...
call %PY_CMD% manage.py seed_demo_books
if errorlevel 1 (
  echo [ERROR] seed_demo_books failed.
  call :maybe_pause
  exit /b 1
)

echo [6/7] Starting backend at http://127.0.0.1:8000 ...
set "BACKEND_START_CMD=cd /d ""%ROOT_DIR%"" && set DB_ENGINE=%DB_ENGINE_RUNTIME% && %PY_CMD% manage.py runserver 127.0.0.1:8000"
start "Lystopad Backend" cmd /k "%BACKEND_START_CMD%"

echo [7/7] Starting frontend at http://127.0.0.1:3000 ...
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

:require_mongodb_backend
%PY_CMD% -c "import django_mongodb_backend" 2>nul
if errorlevel 1 (
  echo [ERROR] Пакет django-mongodb-backend не встановлено. Виконайте pip install -r requirements.txt і повторіть.
  exit /b 1
)
exit /b 0

:check_mongodb
set "MONGO_URI_CHECK=%~1"
if not defined MONGO_URI_CHECK set "MONGO_URI_CHECK=mongodb://localhost:27017/"
echo %MONGO_URI_CHECK% | findstr /I "mongodb+srv" >nul
if not errorlevel 1 (
  echo [INFO] mongodb+srv: пропуск TCP-перевірки ^(кластер Atlas^).
  exit /b 0
)
powershell -NoProfile -Command "$uri = $env:MONGO_URI_CHECK; if (-not $uri) { $uri = 'mongodb://localhost:27017/' }; if ($uri -notmatch '^mongodb(\+srv)?:\/\/') { exit 1 }; $normalized = $uri -replace '^mongodb\+srv://', 'mongodb://'; try { $u = [System.Uri]$normalized } catch { exit 1 }; $mongoHost = if ([string]::IsNullOrWhiteSpace($u.Host)) { 'localhost' } else { $u.Host }; $mongoPort = if ($u.Port -gt 0) { $u.Port } else { 27017 }; try { $client = New-Object System.Net.Sockets.TcpClient; $async = $client.BeginConnect($mongoHost, $mongoPort, $null, $null); if (-not $async.AsyncWaitHandle.WaitOne(3000, $false)) { throw 'timeout' }; $client.EndConnect($async); $client.Close(); exit 0 } catch { exit 1 }"
exit /b %errorlevel%

:detect_mongodb_service
set "MONGO_SERVICE_STATUS=unknown"
for /f "usebackq delims=" %%S in (`powershell -NoProfile -Command "$services = Get-Service -ErrorAction SilentlyContinue ^| Where-Object { $_.Name -match '^Mongo(DB)?$' -or $_.Name -match '^MongoDB' -or $_.DisplayName -match 'MongoDB' }; if (-not $services) { 'not_found' } elseif ($services ^| Where-Object { $_.Status -eq 'Running' }) { 'running' } else { 'stopped' }"`) do (
  set "MONGO_SERVICE_STATUS=%%S"
)
exit /b 0
