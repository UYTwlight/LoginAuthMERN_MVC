@echo off
echo ========================================
echo   Starting Full System
echo   Frontend + Backend + Camera Detection
echo ========================================
echo.

REM Stop any existing Node.js processes to prevent port conflicts
echo Checking for existing Node.js processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel%==0 (
    echo [OK] Stopped existing Node.js processes
    timeout /t 2 /nobreak > nul
) else (
    echo [OK] No existing processes found
)
echo.

REM Check if main.exe exists
if not exist "Emotion-statistics\main.exe" (
    echo [ERROR] main.exe not found!
    echo Please compile first: cd Emotion-statistics ^&^& build_main.bat
    pause
    exit /b 1
)

echo [OK] C++ executable found
echo.

REM Start Backend in new window
echo Starting Backend (port 3001)...
start "Backend Server" cmd /k "cd Backend && npm start"
timeout /t 3 /nobreak > nul

REM Start Frontend in new window  
echo Starting Frontend (port 3000)...
start "Frontend App" cmd /k "cd Frontend && npm start"
timeout /t 2 /nobreak > nul

echo.
echo ========================================
echo   System Starting...
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Two terminal windows opened:
echo   1. Backend Server (green)
echo   2. Frontend App (white)
echo.
echo Browser will open automatically at:
echo   http://localhost:3000
echo.
echo ========================================
echo   How to Use:
echo ========================================
echo.
echo 1. Login to the web app
echo 2. Navigate to Camera page
echo 3. Select emotion model (default: MobileNet)
echo 4. Select camera ID (default: 0)
echo 5. Click "Bat dau" to start detection
echo 6. OpenCV window will appear
echo 7. Click "Dung" to stop
echo.

echo.
echo System is running!
echo React will automatically open the browser at http://localhost:3000
echo Close this window or press Ctrl+C to exit.
echo.
