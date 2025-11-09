# C++ Emotion Detection Service Integration Guide

## 📋 Overview
This guide explains how to build and run the C++ Emotion Detection Service that integrates with the MERN stack application.

## 🏗️ Architecture

### Service Architecture
```
Frontend (React) ←→ Backend (Node.js) ←→ C++ Service (HTTP Server)
                                              ↓
                                         OpenCV + ONNX Models
```

### Files Structure
```
Emotion-statistics/
├── main_service.cpp              # C++ HTTP service (NEW)
├── main.cpp                      # Original standalone version
├── CMakeLists.txt               # Build configuration
├── build_vs.bat                 # Visual Studio build script
├── face_detection_yunet_2023mar_int8.onnx
├── MobileNet_custom.onnx
└── face_logs/                   # Generated emotion logs
```

## 🔧 Prerequisites

### 1. Visual Studio 2022
- Install "Desktop development with C++" workload
- Ensure cl.exe compiler is available

### 2. OpenCV Installation
Install OpenCV via vcpkg:
```powershell
# Install vcpkg if not already installed
git clone https://github.com/Microsoft/vcpkg.git
cd vcpkg
.\bootstrap-vcpkg.bat

# Install OpenCV
.\vcpkg install opencv4:x64-windows
.\vcpkg integrate install
```

### 3. cpp-httplib Library
Download from: https://github.com/yhirose/cpp-httplib

Option A: Single Header (Recommended)
```powershell
cd "c:\Users\Admin\OneDrive - VNU-HCMUS\Desktop\Ứng dụng thị giác máy tính\WEB\LoginAuthMERN_MVC\Emotion-statistics"
mkdir include
# Download httplib.h to include/httplib.h
```

Option B: Via vcpkg
```powershell
.\vcpkg install cpp-httplib:x64-windows
```

## 🛠️ Building the C++ Service

### Step 1: Configure OpenCV Path
Edit `build_vs.bat` line 11-12:
```batch
REM Update this path to your vcpkg installation
set OPENCV_DIR=C:\path\to\vcpkg\installed\x64-windows
```

### Step 2: Build the Service
```powershell
cd "c:\Users\Admin\OneDrive - VNU-HCMUS\Desktop\Ứng dụng thị giác máy tính\WEB\LoginAuthMERN_MVC\Emotion-statistics"
.\build_vs.bat
```

Expected output:
```
Microsoft (R) C/C++ Optimizing Compiler...
Creating library main_service.lib...
Build completed successfully!
Executable: main_service.exe
```

### Step 3: Test the Service
```powershell
# Start the service
.\main_service.exe

# In another terminal, test the endpoints:
# Health check
curl http://localhost:8080/health

# Start camera
curl -X POST http://localhost:8080/start

# Get status
curl http://localhost:8080/status

# Get emotion data
curl http://localhost:8080/emotion-data

# Stop camera
curl -X POST http://localhost:8080/stop
```

## 🚀 Running the Full Application

### Terminal 1: C++ Service
```powershell
cd "c:\Users\Admin\OneDrive - VNU-HCMUS\Desktop\Ứng dụng thị giác máy tính\WEB\LoginAuthMERN_MVC\Emotion-statistics"
.\main_service.exe
```
Output: `Emotion Detection Service running on http://localhost:8080`

### Terminal 2: Backend (Node.js)
```powershell
cd "c:\Users\Admin\OneDrive - VNU-HCMUS\Desktop\Ứng dụng thị giác máy tính\WEB\LoginAuthMERN_MVC\Backend"
npm start
```
Output: `Server is running on port 5000`

### Terminal 3: Frontend (React)
```powershell
cd "c:\Users\Admin\OneDrive - VNU-HCMUS\Desktop\Ứng dụng thị giác máy tính\WEB\LoginAuthMERN_MVC\Frontend"
npm start
```
Output: Opens browser at `http://localhost:3000`

## 📡 API Endpoints

### C++ Service (Port 8080)

#### Health Check
```http
GET /health
Response: {"status": "ok", "service": "Emotion Detection Service"}
```

#### Start Camera
```http
POST /start
Response: {
  "success": true,
  "message": "Camera started successfully",
  "isRunning": true
}
```

#### Stop Camera
```http
POST /stop
Response: {
  "success": true,
  "message": "Camera stopped successfully",
  "isRunning": false
}
```

#### Get Status
```http
GET /status
Response: {
  "isRunning": true,
  "dataPointsCollected": 42
}
```

#### Get Emotion Data
```http
GET /emotion-data
Response: {
  "isRunning": true,
  "emotionData": [
    {
      "faceId": 1,
      "timestamp": "2024-01-15T10:30:45",
      "emotions": {
        "Happy": 0.85,
        "Sad": 0.05,
        "Surprise": 0.03,
        "Angry": 0.02,
        "Disgust": 0.05
      },
      "dominantEmotion": "Happy"
    }
  ]
}
```

### Backend (Port 5000)

Backend automatically forwards requests to C++ service:

```http
POST /api/camera/start        → http://localhost:8080/start
POST /api/camera/stop         → http://localhost:8080/stop
GET  /api/camera/status       → http://localhost:8080/status
GET  /api/camera/emotion-data → http://localhost:8080/emotion-data
GET  /api/camera/logs         → Read local CSV files
```

## 🔍 How It Works

### 1. Initialization
- Frontend user clicks "Start Camera" in Dashboard
- Backend receives request, checks if C++ service is running
- If not running, Backend spawns `main_service.exe`

### 2. Camera Processing
- C++ service opens webcam using OpenCV
- Runs in separate thread to avoid blocking HTTP requests
- Detects faces using YuNet model
- Classifies emotions using MobileNet model
- Stores results in thread-safe vector

### 3. Data Flow
```
Webcam → YuNet (Face Detection) → Face Tracking → MobileNet (Emotion) → JSON Storage
                                                                              ↓
Frontend ← Backend (axios) ← HTTP Response ← C++ Service (httplib) ←────────┘
```

### 4. Frontend Polling
- Frontend polls `/api/camera/emotion-data` every 1 second
- Displays emotion bars and dominant emotion
- Shows real-time updates

## 🐛 Troubleshooting

### Issue: OpenCV headers not found
```
error C1083: Cannot open include file: 'opencv2/opencv.hpp'
```

**Solution:**
1. Install OpenCV via vcpkg
2. Update OPENCV_DIR in `build_vs.bat`
3. Run `vcpkg integrate install`

### Issue: cpp-httplib not found
```
fatal error C1083: Cannot open include file: 'httplib.h'
```

**Solution:**
1. Download httplib.h from GitHub
2. Place in `Emotion-statistics/include/httplib.h`
3. Or install via vcpkg: `vcpkg install cpp-httplib:x64-windows`

### Issue: C++ service won't start
```
Error starting camera: connect ECONNREFUSED
```

**Solution:**
1. Check if main_service.exe exists
2. Run manually: `.\main_service.exe`
3. Check console for errors
4. Ensure port 8080 is not in use

### Issue: Camera access denied
```
OpenCV Error: Could not open camera
```

**Solution:**
1. Check Windows camera permissions
2. Close other apps using webcam (Zoom, Teams, etc.)
3. Try different camera index in code

### Issue: Models not found
```
Error: Could not load face_detection_yunet_2023mar_int8.onnx
```

**Solution:**
1. Ensure models are in Emotion-statistics folder
2. Run main_service.exe from Emotion-statistics directory
3. Check file paths in main_service.cpp

## 📊 Performance Considerations

### Memory Management
- Emotion data limited to last 1000 entries
- Automatic cleanup prevents memory leaks
- Thread-safe operations using std::mutex

### CPU Usage
- Face detection: ~10-20% CPU per frame
- Emotion classification: ~5-10% CPU per face
- HTTP server: Minimal overhead

### Optimization Tips
1. Reduce frame processing rate (skip frames)
2. Lower camera resolution
3. Process every Nth frame instead of all
4. Use GPU acceleration (if available)

## 🔐 Security Notes

1. **Port Exposure**: C++ service runs on localhost:8080 (not exposed externally)
2. **CORS**: Backend acts as proxy, implements CORS protection
3. **Authentication**: All camera endpoints require JWT token
4. **Resource Limits**: Maximum 1000 emotion data points in memory

## 📝 Code Modification Guide

### Change Service Port
Edit `main_service.cpp` line ~15:
```cpp
const int PORT = 8080;  // Change to desired port
```

Also update `Backend/src/controllers/CameraController.js`:
```javascript
const CPP_SERVICE_PORT = 8080;  // Match the port
```

### Modify Emotion Classes
Edit the emotion vector in `main_service.cpp`:
```cpp
std::vector<std::string> emotions = {"Happy", "Sad", "Surprise", "Angry", "Disgust", "Fear", "Neutral"};
```

### Add New Endpoints
In `main_service.cpp`, add new route:
```cpp
svr.Get("/custom-endpoint", [](const httplib::Request& req, httplib::Response& res) {
    json response;
    response["custom"] = "data";
    res.set_content(response.dump(), "application/json");
});
```

## 🎯 Next Steps

1. ✅ Build C++ service successfully
2. ✅ Test all HTTP endpoints
3. ✅ Start full application stack
4. ⏳ Test camera functionality in web UI
5. ⏳ Monitor emotion data display
6. ⏳ Check emotion logs generation

## 📚 Additional Resources

- [OpenCV Documentation](https://docs.opencv.org/)
- [cpp-httplib GitHub](https://github.com/yhirose/cpp-httplib)
- [YuNet Face Detection](https://github.com/ShiqiYu/libfacedetection)
- [ONNX Runtime](https://onnxruntime.ai/)

## 🤝 Contributing

If you encounter issues or have improvements:
1. Document the problem in detail
2. Include error messages and logs
3. Describe your environment (OS, OpenCV version, etc.)
4. Test proposed solutions before implementing

---

**Last Updated:** January 2024
**Status:** Ready for production testing
