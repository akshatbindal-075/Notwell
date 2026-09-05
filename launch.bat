@echo off
REM ============================================================
REM  Notwell — Launcher
REM  Starts backend (FastAPI) and frontend (Next.js) together.
REM  Place this file at the project root (same level as
REM  backend/ and frontend/ folders) before running.
REM ============================================================

REM Ensure Node.js is in PATH even if Explorer has not refreshed yet
set "NODE_PKG=C:\Users\Aksh\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64"
if exist "%NODE_PKG%" set "PATH=%NODE_PKG%;%PATH%"

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