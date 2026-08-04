@echo off
REM ============================================================
REM  AI Clinical Documentation Assistant — Launcher
REM  Starts backend (FastAPI) and frontend (Next.js) together.
REM  Place this file at the project root (same level as
REM  backend/ and frontend/ folders) before running.
REM ============================================================

echo Starting backend (FastAPI)...
start "Backend - FastAPI" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate && uvicorn app.main:app --reload"

echo Waiting a few seconds for backend to boot...
timeout /t 5 /nobreak >nul

echo Starting frontend (Next.js)...
start "Frontend - Next.js" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are launching in separate windows.
echo Backend:  http://localhost:8000/docs
echo Frontend: http://localhost:3000
echo.
pause