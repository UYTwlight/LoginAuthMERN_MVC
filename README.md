# 🎥 Webcam Emotion Detection - Full Stack Application

Real-time emotion detection system using MERN stack + OpenCV + Deep Learning.

## 🌟 Features

- **Real-time Face Detection**: YuNet model (OpenCV)
- **Emotion Classification**: MobileNet (5 emotions: Happy, Sad, Surprise, Angry, Disgust)
- **Web Interface**: React frontend with model selection
- **REST API**: Node.js/Express backend
- **Authentication**: JWT-based with role management (Admin/User)
- **Switchable Models**: Easy to add new emotion detection models
- **Data Logging**: CSV output with frame-by-frame and summary statistics

---

## 🏗️ Architecture

```
Frontend (React)  →  Backend (Node.js)  →  C++ Emotion Detection (OpenCV)
     ↓                      ↓                          ↓
  port 3000            port 3001                  main.exe
  Model UI          Spawn Process              Face + Emotion
  Statistics          Read CSV                  Write CSV
```

---

## 🚀 Quick Start (1 Command)

```bash
start-all.bat
```

This will:
1. ✅ Check if `main.exe` exists
2. ✅ Start Backend (port 3001)
3. ✅ Start Frontend (port 3000)
4. ✅ Open browser at http://localhost:3000

---

## 📋 Manual Setup

### Prerequisites

- Node.js 14+ and npm
- Visual Studio 2022 (for C++ compilation)
- MongoDB (local or Atlas)
- Webcam

### 1. Install Dependencies

```bash
# Backend
cd Backend
npm install

# Frontend
cd Frontend
npm install
```

### 2. Configure Environment

Create `Backend/.env`:
```env
MONGO_URL="your_mongodb_connection_string"
JWT_SECRET="your_jwt_secret"
REFRESH_SECRET="your_refresh_secret"
ACCESS_SECRET="your_access_secret"
```

### 3. Compile C++ Emotion Detection

```bash
cd Emotion-statistics
.\build_main.bat
```

This will:
- Detect OpenCV installation
- Initialize Visual Studio environment
- Compile `main.cpp` → `main.exe`

### 4. Start Backend

```bash
cd Backend
npm start
```

Backend runs at: http://localhost:3001

### 5. Start Frontend

```bash
cd Frontend
npm start
```

Frontend runs at: http://localhost:3000

---

## 📖 Usage Guide

### 1. Login
- Navigate to http://localhost:3000
- Login with your credentials
- (First time: Register a new account)

### 2. Camera Page
- Click "Camera" in navigation menu
- See camera control interface

### 3. Select Configuration
- **Emotion Model**: Choose from dropdown (default: MobileNet Custom)
- **Camera ID**: Select camera (0, 1, 2)

### 4. Start Detection
- Click "▶ Bắt đầu" button
- OpenCV window appears showing live detection
- Web page updates with emotion statistics every second

### 5. Stop Detection
- Click "⏹ Dừng" button
- OpenCV window closes
- Final statistics displayed

### 6. View Logs
- Click "📊 Xem Logs" button
- See detailed per-face emotion data
- View face images and frame-by-frame analysis

---

## 🎯 Adding New Emotion Models

### 1. Prepare Your Model
- Format: ONNX
- Input: 64x64x3 (BGR, normalized 0-1)
- Output: 5 emotions [Happy, Sad, Surprise, Angry, Disgust]

### 2. Add Model File
```bash
# Copy your model to:
Emotion-statistics/YourNewModel.onnx
```

### 3. Update Frontend
Edit `Frontend/src/Components/Camera/CameraView.js`:
```javascript
const availableModels = [
  { value: 'MobileNet_custom.onnx', label: 'MobileNet Custom (Default)' },
  { value: 'YourNewModel.onnx', label: 'Your Model Name' }  // Add this
];
```

### 4. Test
- Restart Frontend
- Select your model from dropdown
- Click "Bắt đầu"

See [HOW_TO_ADD_EMOTION_MODELS.md](HOW_TO_ADD_EMOTION_MODELS.md) for details.

---

## 📁 Project Structure

```
LoginAuthMERN_MVC/
├── Backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── CameraController.js    # Camera API logic
│   │   │   └── UserController.js      # Auth logic
│   │   ├── routes/
│   │   │   ├── CameraRoutes.js        # /api/camera/*
│   │   │   └── UserRoutes.js          # /api/auth/*
│   │   ├── middleware/
│   │   │   └── auth.js                # JWT verification
│   │   ├── models/
│   │   │   └── User.js                # MongoDB schema
│   │   └── app.js                     # Entry point
│   └── package.json
│
├── Frontend/                   # React application
│   ├── src/
│   │   ├── Components/
│   │   │   ├── Camera/
│   │   │   │   ├── CameraView.js      # Camera UI
│   │   │   │   └── CameraView.css     # Styling
│   │   │   ├── Auth/                  # Login/Register
│   │   │   ├── Dashboard/             # Dashboard
│   │   │   └── UserManagement/        # Admin panel
│   │   └── App.js
│   └── package.json
│
├── Emotion-statistics/         # C++ Emotion Detection
│   ├── main.cpp                       # Main C++ code
│   ├── main.exe                       # Compiled executable
│   ├── build_main.bat                 # Build script
│   ├── MobileNet_custom.onnx          # Emotion model
│   ├── face_detection_yunet_2023mar_int8.onnx  # Face model
│   ├── opencv/                        # OpenCV 4.10.0
│   └── face_logs/                     # Output CSV files
│
├── start-all.bat               # Start everything
├── QUICK_START.md              # Quick reference
├── HOW_TO_ADD_EMOTION_MODELS.md       # Model guide
├── FRONTEND_BACKEND_CONNECTION.md     # Integration details
└── README.md                   # This file
```

---

## 🔌 API Endpoints

### Camera Control

| Endpoint | Method | Auth | Body | Description |
|----------|--------|------|------|-------------|
| `/api/camera/start` | POST | ✓ | `{ modelPath, cameraId }` | Start detection |
| `/api/camera/stop` | POST | ✓ | - | Stop detection |
| `/api/camera/status` | GET | ✓ | - | Check if running |
| `/api/camera/emotion-data` | GET | ✓ | - | Get emotion stats |
| `/api/camera/logs` | GET | ✓ | - | Get detailed logs |

### Authentication

| Endpoint | Method | Auth | Body | Description |
|----------|--------|------|------|-------------|
| `/api/auth/register` | POST | ✗ | `{ name, email, password }` | Register user |
| `/api/auth/login` | POST | ✗ | `{ email, password }` | Login |
| `/api/auth/logout` | POST | ✓ | - | Logout |
| `/api/auth/user` | GET | ✓ | - | Get user info |

---

## 📊 Output Format

### CSV Files

**face_logs/output.csv** (Summary):
```csv
ID,Happy,Sad,Surprise,Angry,Disgust,Num_frame
0,0.65,0.10,0.15,0.05,0.05,127
1,0.45,0.20,0.25,0.05,0.05,98
```

**face_logs/ID0/emotions.csv** (Frame-by-frame):
```csv
frame,Happy,Sad,Surprise,Angry,Disgust
10,0.72,0.08,0.12,0.05,0.03
20,0.68,0.09,0.14,0.06,0.03
30,0.70,0.08,0.13,0.06,0.03
```

### JSON Response

```json
{
  "timestamp": "2025-11-07T10:30:00.000Z",
  "emotionData": [
    {
      "ID": "0",
      "Happy": 0.65,
      "Sad": 0.10,
      "Surprise": 0.15,
      "Angry": 0.05,
      "Disgust": 0.05,
      "Num_frame": 127
    }
  ],
  "isRunning": true,
  "totalDataPoints": 1
}
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check port 3001
netstat -ano | findstr :3001

# Kill process if needed
taskkill /PID <PID> /F
```

### Frontend won't start
```bash
# Check port 3000
netstat -ano | findstr :3000

# Clear cache
cd Frontend
rm -rf node_modules package-lock.json
npm install
```

### C++ compilation fails
```bash
# Check if Visual Studio installed
where cl.exe

# Rebuild
cd Emotion-statistics
.\build_main.bat
```

### Camera won't open
- Close other apps using camera (Zoom, Teams, etc.)
- Try different camera ID (0, 1, 2)
- Check Windows camera permissions

### OpenCV DLL not found
```bash
# Add OpenCV to PATH
cd Emotion-statistics
$env:PATH += ";$PWD\opencv\build\x64\vc16\bin"
```

### MongoDB connection fails
- Check internet connection
- Verify connection string in `.env`
- Test: `mongosh "your_connection_string"`

---

## 🔒 Security Notes

- JWT tokens required for all camera operations
- User authentication: 30 min access token, 7 day refresh token
- Admin authentication: 365 day access token
- Only authenticated users can start/stop camera
- Model paths validated on backend
- CSV files stored server-side only

---

## 🎓 Technologies Used

### Frontend
- React 18
- Axios (HTTP client)
- React Router (navigation)
- CSS3 (styling)

### Backend
- Node.js 18+
- Express (web framework)
- Mongoose (MongoDB ODM)
- JWT (authentication)
- bcrypt (password hashing)
- CORS (cross-origin requests)

### C++ Emotion Detection
- OpenCV 4.10.0 (computer vision)
- ONNX Runtime (model inference)
- YuNet (face detection)
- MobileNet (emotion classification)
- Visual Studio 2022 (compiler)

---

## 📚 Documentation

- [QUICK_START.md](QUICK_START.md) - Quick reference guide
- [HOW_TO_ADD_EMOTION_MODELS.md](HOW_TO_ADD_EMOTION_MODELS.md) - Add new models
- [FRONTEND_BACKEND_CONNECTION.md](FRONTEND_BACKEND_CONNECTION.md) - Integration details
- [CAMERA_INTEGRATION_SUMMARY.md](CAMERA_INTEGRATION_SUMMARY.md) - Technical summary
- [TEST_CAMERA_INTEGRATION.md](TEST_CAMERA_INTEGRATION.md) - Testing checklist

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

This project is for educational purposes.

---

## 👨‍💻 Authors

- Backend & Integration: GitHub Copilot
- Frontend UI: GitHub Copilot
- C++ Emotion Detection: GitHub Copilot

---

## 🎉 Acknowledgments

- OpenCV for computer vision library
- YuNet for face detection model
- MobileNet architecture for emotion classification
- MERN stack community

---

**Status**: ✅ Production Ready
**Last Updated**: November 7, 2025
**Version**: 1.0.0
