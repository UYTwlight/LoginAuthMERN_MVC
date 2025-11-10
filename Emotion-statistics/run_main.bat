@echo off
REM ========================================
REM Run Face Detection + Emotion Recognition
REM ========================================

echo Starting Face Detection with Emotion Recognition...
echo.

REM Add OpenCV DLL to PATH
set OPENCV_BIN=%~dp0opencv\build\x64\vc16\bin
set PATH=%OPENCV_BIN%;%PATH%

REM Check prerequisites
if not exist "main.exe" (
    echo [ERROR] main.exe not found! Please build first.
    pause
    exit /b 1
)

if not exist "face_detection_yunet_2023mar_int8.onnx" (
    echo [ERROR] YuNet model not found!
    pause
    exit /b 1
)

if not exist "MobileNet_custom.onnx" (
    echo [ERROR] MobileNet model not found!
    pause
    exit /b 1
)

REM Create output directory
if not exist "face_logs" mkdir face_logs

echo ========================================
echo All checks passed!
echo Starting main.exe...
echo Press ESC in window to exit
echo ========================================
echo.

REM Run main.exe
main.exe

echo.
echo ========================================
echo Program ended with exit code: %ERRORLEVEL%
echo ========================================
pause
