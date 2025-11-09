@echo off
echo ========================================
echo   Stopping All Services
echo ========================================
echo.

echo Stopping Node.js processes (Backend + Frontend)...
taskkill /F /IM node.exe 2>nul
if %errorlevel%==0 (
    echo [OK] Node.js processes stopped
) else (
    echo [INFO] No Node.js processes running
)

echo.
echo Stopping C++ Camera Detection (main.exe)...
taskkill /F /IM main.exe 2>nul
if %errorlevel%==0 (
    echo [OK] Camera detection stopped
) else (
    echo [INFO] No camera detection running
)

echo.
echo ========================================
echo   All services stopped!
echo ========================================
echo.
pause
