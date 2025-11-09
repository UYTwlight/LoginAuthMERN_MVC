@echo off
echo ================================================
echo Starting Full Emotion Analysis System
echo ================================================
echo.

REM Check if MongoDB is running
echo [1/3] Checking MongoDB...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo     [OK] MongoDB is running
) else (
    echo     [WARNING] MongoDB is not running!
    echo     Please start MongoDB before continuing.
    echo.
    echo     Quick start MongoDB:
    echo     - Run: net start MongoDB
    echo     - Or start MongoDB service from Services
    pause
    exit /b 1
)

echo.
echo [2/3] Starting Backend API Server...
echo     Starting on http://localhost:5000
start "Backend API" cmd /k "cd /d %~dp0Backend && npm start"
timeout /t 3 >nul

echo.
echo [3/3] Starting Frontend React App...
echo     Starting on http://localhost:3000
start "Frontend React" cmd /k "cd /d %~dp0Frontend && npm start"

echo.
echo ================================================
echo System Started!
echo ================================================
echo.
echo Services running:
echo   - MongoDB:  mongodb://localhost:27017
echo   - Backend:  http://localhost:5000
echo   - Frontend: http://localhost:3000
echo.
echo To run emotion detection:
echo   1. cd Emotion-statistics
echo   2. .\run_main.bat  (for camera)
echo   3. or .\main.exe MobileNet_custom.onnx "video.mp4"
echo.
echo To view reports:
echo   1. Open http://localhost:3000
echo   2. Login
echo   3. Navigate to Reports page
echo.
echo System is ready! Services will keep running in background.
echo Close terminal windows to stop services.
echo.
