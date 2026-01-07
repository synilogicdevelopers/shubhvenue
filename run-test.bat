@echo off
echo ========================================
echo Venue API Test Script
echo ========================================
echo.

REM Check if node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo Checking dependencies...
if not exist "node_modules\axios" (
    echo Installing dependencies...
    call npm install axios form-data
)

echo.
echo Running tests...
echo.
node test-venue-api.mjs

pause


