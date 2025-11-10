@echo off
echo ========================================
echo Building Emotion Detection Application
echo ========================================
echo.

REM Check if OpenCV exists locally
if exist "opencv\build\include\opencv2\opencv.hpp" (
    echo [OK] Found OpenCV in local directory
    set OPENCV_DIR=%cd%\opencv
) else if exist "C:\opencv\build\include\opencv2\opencv.hpp" (
    echo [OK] Found OpenCV at C:\opencv
    set OPENCV_DIR=C:\opencv
) else (
    echo [ERROR] OpenCV not found
    echo.
    echo Please run: .\download_opencv.ps1
    exit /b 1
)

echo OpenCV location: %OPENCV_DIR%
echo.

REM Initialize Visual Studio environment
echo Initializing Visual Studio environment...

REM Try to find Visual Studio using vswhere (works for VS 2017+)
set "VSWHERE=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe"
if exist "%VSWHERE%" (
    for /f "usebackq tokens=*" %%i in (`"%VSWHERE%" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath`) do (
        set "VS_PATH=%%i"
    )
)

REM Fallback to common paths if vswhere fails
if not defined VS_PATH (
    if exist "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat" (
        set "VS_PATH=C:\Program Files\Microsoft Visual Studio\2022\Community"
    ) else if exist "C:\Program Files\Microsoft Visual Studio\2022\Professional\VC\Auxiliary\Build\vcvarsall.bat" (
        set "VS_PATH=C:\Program Files\Microsoft Visual Studio\2022\Professional"
    ) else if exist "C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\Auxiliary\Build\vcvarsall.bat" (
        set "VS_PATH=C:\Program Files\Microsoft Visual Studio\2022\Enterprise"
    ) else if exist "C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Auxiliary\Build\vcvarsall.bat" (
        set "VS_PATH=C:\Program Files (x86)\Microsoft Visual Studio\2019\Community"
    )
)

if not defined VS_PATH (
    echo [ERROR] Visual Studio not found
    echo Please install Visual Studio 2019 or 2022 with C++ tools
    exit /b 1
)

call "%VS_PATH%\VC\Auxiliary\Build\vcvarsall.bat" x64
if errorlevel 1 (
    echo [ERROR] Failed to initialize Visual Studio
    exit /b 1
)

echo [OK] Visual Studio environment initialized
echo.

REM Set OpenCV paths
set OPENCV_INCLUDE=%OPENCV_DIR%\build\include
set OPENCV_LIB=%OPENCV_DIR%\build\x64\vc16\lib
set OPENCV_BIN=%OPENCV_DIR%\build\x64\vc16\bin

REM Set OpenCV library file (use release version)
set OPENCV_LIB_FILE=opencv_world4100.lib

if not exist "%OPENCV_LIB%\%OPENCV_LIB_FILE%" (
    echo [WARNING] Release library not found, trying debug version...
    set OPENCV_LIB_FILE=opencv_world4100d.lib
    if not exist "%OPENCV_LIB%\%OPENCV_LIB_FILE%" (
        echo [ERROR] Could not find opencv_world library
        exit /b 1
    )
)

echo [OK] Found OpenCV library: %OPENCV_LIB_FILE%
echo.

REM Add OpenCV DLLs to PATH
set PATH=%OPENCV_BIN%;%PATH%

REM Compile
echo ========================================
echo Compiling main.cpp...
echo ========================================
echo.

cl /EHsc /std:c++17 /wd4566 /utf-8 ^
   /I"%OPENCV_INCLUDE%" ^
   main.cpp ^
   /link ^
   /LIBPATH:"%OPENCV_LIB%" ^
   %OPENCV_LIB_FILE% ^
   /OUT:main.exe

if errorlevel 1 (
    echo.
    echo ========================================
    echo [ERROR] Compilation failed!
    echo ========================================
    exit /b 1
)

echo.
echo ========================================
echo [SUCCESS] Build completed!
echo ========================================
echo.
echo Executable: main.exe
echo.
echo Usage:
echo   main.exe [emotion_model] [camera_id]
echo.
echo Examples:
echo   main.exe
echo   main.exe MobileNet_custom.onnx
echo   main.exe MobileNet_custom.onnx 0
echo   main.exe emotion_model_v2.onnx 1
echo.
echo Required files in same directory:
echo   - face_detection_yunet_2023mar_int8.onnx
echo   - MobileNet_custom.onnx (or your custom model)
echo.
