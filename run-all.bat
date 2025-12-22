@echo off
SETLOCAL

echo ===================================================
echo   Starting Trading Agents (Backend + Frontend)
echo ===================================================

:: Check if npx is available
where npx >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npx is not found. Please install Node.js.
    pause
    exit /b 1
)

echo.
echo Launching services...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.

:: Use npx to run concurrently
:: -k: kill others if one fails
:: -n: names for output
:: -c: colors
call npx -y concurrently --kill-others --names "BACKEND,FRONTEND" --prefix-colors "blue,magenta" "cd backend && python start_api.py" "cd frontend && npm run dev"

if %errorlevel% neq 0 (
    echo [ERROR] Failed to start services.
    pause
)

ENDLOCAL
