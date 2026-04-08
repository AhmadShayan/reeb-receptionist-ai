@echo off
title REEB AI - Launcher
echo.
echo  ====================================
echo    Agentic REEB AI - Local Launcher
echo  ====================================
echo.

REM ── Check Python ─────────────────────────────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install Python 3.10+ and try again.
    pause
    exit /b 1
)

REM ── Check Node ───────────────────────────────────────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install Node.js and try again.
    pause
    exit /b 1
)

REM ── Backend setup ────────────────────────────────────────────────────────────
if not exist backend\.env (
    copy backend\.env.example backend\.env >nul
    echo [INFO] Created backend\.env from template. Edit it to add your API keys.
)

echo [1/2] Installing backend dependencies...
python -m pip install -r backend\requirements.txt -q

REM ── Frontend setup ───────────────────────────────────────────────────────────
echo [2/2] Installing frontend dependencies...
call npm install --silent 2>nul

REM ── Launch backend in a new window ───────────────────────────────────────────
echo.
echo Starting backend on http://localhost:8000 ...
start "REEB Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

REM ── Wait a moment so backend starts first ────────────────────────────────────
timeout /t 3 /nobreak >nul

REM ── Launch frontend in a new window ──────────────────────────────────────────
echo Starting frontend...
start "REEB Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo  Both servers are starting in separate windows.
echo.
echo  Frontend : http://localhost:5173
echo  Backend  : http://localhost:8000
echo  API Docs : http://localhost:8000/docs
echo.
echo  Close the two server windows to stop REEB.
echo.
pause
