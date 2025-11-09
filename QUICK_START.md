# Quick Start Guide - Emotion Detection System

## 🚀 Quick Start (3 Steps)

### Step 1: Start Backend
```bash
cd Backend
npm start
```
Backend runs on: http://localhost:3001

### Step 2: Start Frontend
```bash
cd Frontend
npm start
```
Frontend runs on: http://localhost:3000

### Step 3: Use Camera
1. Login to web app
2. Go to "Camera" page
3. Select model: **MobileNet Custom (Default)**
4. Select camera: **Camera 0**
5. Click **"▶ Bắt đầu"** (Start)
6. OpenCV window will appear
7. Click **"⏹ Dừng"** (Stop) when done

---

## 📋 Command Line Usage

### Test Emotion Detection Directly

```powershell
cd Emotion-statistics
$env:PATH += ";$PWD\opencv\build\x64\vc16\bin"
.\main.exe
```

Press **ESC** in OpenCV window to exit.

### Use Different Model

```powershell
.\main.exe YourModel.onnx
```

### Use Different Camera

```powershell
.\main.exe MobileNet_custom.onnx 1
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `Emotion-statistics/main.exe` | C++ emotion detection executable |
| `Emotion-statistics/main.cpp` | Source code |
| `Emotion-statistics/build_main.bat` | Build script |
| `Emotion-statistics/MobileNet_custom.onnx` | Emotion model (switchable) |
| `Emotion-statistics/face_detection_yunet_2023mar_int8.onnx` | Face detector (fixed) |
| `Backend/src/controllers/CameraController.js` | Backend API |
| `Frontend/src/Components/Camera/CameraView.js` | Frontend UI |

---

## 🔧 Rebuild C++ (If Needed)

```powershell
cd Emotion-statistics
.\build_main.bat
```

Warnings (C4566) are normal and harmless.

---

## 🎯 API Endpoints

| Endpoint | Method | Body | Description |
|----------|--------|------|-------------|
| `/api/camera/start` | POST | `{ modelPath, cameraId }` | Start detection |
| `/api/camera/stop` | POST | - | Stop detection |
| `/api/camera/status` | GET | - | Check if running |
| `/api/camera/emotion-data` | GET | - | Get emotion results |
| `/api/camera/logs` | GET | - | Get detailed logs |

---

## 📊 Output Files

After running detection, files are saved in:

```
Emotion-statistics/face_logs/
├── output.csv              # Summary (avg emotions per person)
├── ID0/
│   ├── first_frame.jpg     # Face image
│   └── emotions.csv        # Frame-by-frame data
├── ID1/
│   ├── first_frame.jpg
│   └── emotions.csv
└── ...
```

### CSV Format

**output.csv**:
```csv
ID,Happy,Sad,Surprise,Angry,Disgust,Num_frame
0,0.65,0.10,0.15,0.05,0.05,127
```

**emotions.csv**:
```csv
frame,Happy,Sad,Surprise,Angry,Disgust
10,0.72,0.08,0.12,0.05,0.03
20,0.68,0.09,0.14,0.06,0.03
```

---

## ✅ Verification Checklist

Before using, verify:

- [ ] `main.exe` exists in `Emotion-statistics/`
- [ ] OpenCV folder exists: `Emotion-statistics/opencv/build/`
- [ ] Backend is running (port 3001)
- [ ] Frontend is running (port 3000)
- [ ] Logged in with valid credentials
- [ ] Camera is available (not in use)

---

## 🐛 Common Issues

### "Can't open camera"
- Camera in use by another app
- Try camera ID 1 or 2
- Check Windows camera permissions

### "main.exe not found"
- Run `build_main.bat` to compile
- Check if compilation succeeded

### "OpenCV DLL not found"
- OpenCV not extracted properly
- Re-run `download_opencv.ps1`
- Check PATH includes OpenCV bin folder

### "Model not loading"
- Check ONNX file exists
- Verify file name spelling
- Ensure model is compatible (64x64 input, 5 emotions output)

---

## 💡 Tips

- **Default model works out of the box** - no configuration needed
- **YuNet face detector is fixed** - only emotion model changes
- **Multiple cameras** - use camera ID 0, 1, 2, etc.
- **Real-time display** - OpenCV window shows live detection
- **Web results** - Check web page for statistics and averages

---

## 📚 Documentation

- **HOW_TO_ADD_EMOTION_MODELS.md** - Guide for adding new models
- **CAMERA_INTEGRATION_SUMMARY.md** - Complete technical details
- **BUILD_INSTRUCTIONS.md** - Build system documentation
- **CPP_SERVICE_GUIDE.md** - C++ service architecture (archived)

---

## 🎓 Model Requirements

To add a new emotion model:

- **Format**: ONNX
- **Input**: 64x64x3 (BGR, normalized to 0-1)
- **Output**: 5 classes [Happy, Sad, Surprise, Angry, Disgust]
- **Location**: Place in `Emotion-statistics/` folder
- **Frontend**: Add to `availableModels` array in CameraView.js

---

**Last Updated**: November 7, 2025
**Status**: Ready to use ✅
