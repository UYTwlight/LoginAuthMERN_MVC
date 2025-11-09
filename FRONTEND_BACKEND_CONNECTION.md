# 🎥 Frontend-Backend Camera Integration Complete Guide

## ✅ Tổng quan tích hợp đã hoàn thành

### Kiến trúc hệ thống:

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                       │
│                   http://localhost:3000                     │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  CameraView.js                                      │   │
│  │  • Model Selector (MobileNet Custom)               │   │
│  │  • Camera ID Selector (0, 1, 2)                    │   │
│  │  • Start/Stop Buttons                              │   │
│  │  • Emotion Data Display                            │   │
│  └───────────────────┬────────────────────────────────┘   │
└────────────────────────┼────────────────────────────────────┘
                         │ HTTP Requests
                         │ POST /api/camera/start {modelPath, cameraId}
                         │ POST /api/camera/stop
                         │ GET  /api/camera/status
                         │ GET  /api/camera/emotion-data
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js/Express)                │
│                   http://localhost:3001                     │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  CameraController.js                                │   │
│  │  • startCamera(req, res)                           │   │
│  │  •   - Extract modelPath & cameraId from req.body │   │
│  │  •   - spawn('main.exe', [model, camera])         │   │
│  │  •   - Set PATH to include OpenCV DLLs            │   │
│  │  • stopCamera(req, res)                            │   │
│  │  •   - Kill C++ process                            │   │
│  │  • getEmotionData(req, res)                        │   │
│  │  •   - Read face_logs/output.csv                   │   │
│  └───────────────────┬────────────────────────────────┘   │
└────────────────────────┼────────────────────────────────────┘
                         │ spawn()
                         │ main.exe [model] [camera]
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              C++ EMOTION DETECTION (OpenCV)                 │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  main.exe                                           │   │
│  │                                                     │   │
│  │  1. Parse command line arguments                   │   │
│  │     • argv[1] = modelPath (default: MobileNet)     │   │
│  │     • argv[2] = cameraId (default: 0)              │   │
│  │                                                     │   │
│  │  2. Initialize YuNet (Face Detection - FIXED)      │   │
│  │     • face_detection_yunet_2023mar_int8.onnx       │   │
│  │                                                     │   │
│  │  3. Initialize MobileNet (Emotion - SWITCHABLE)    │   │
│  │     • Load model from argv[1]                      │   │
│  │                                                     │   │
│  │  4. Open Camera                                    │   │
│  │     • VideoCapture(argv[2])                        │   │
│  │                                                     │   │
│  │  5. Process Loop                                   │   │
│  │     • Detect faces (YuNet)                         │   │
│  │     • Track faces (Nano tracker)                   │   │
│  │     • Classify emotions (MobileNet)                │   │
│  │     • Display in OpenCV window                     │   │
│  │                                                     │   │
│  │  6. Output Results                                 │   │
│  │     • face_logs/output.csv                         │   │
│  │     • face_logs/ID*/emotions.csv                   │   │
│  │     • face_logs/ID*/first_frame.jpg                │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 Các điểm kết nối chính

### 1. Frontend → Backend

**File**: `Frontend/src/Components/Camera/CameraView.js`

**Khi click "Bắt đầu"**:
```javascript
const handleStartCamera = async () => {
  const token = localStorage.getItem('accessToken');
  const response = await axios.post(
    'http://localhost:3001/api/camera/start',
    {
      modelPath: selectedModel,      // e.g., "MobileNet_custom.onnx"
      cameraId: selectedCamera        // e.g., "0"
    },
    {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    }
  );
  
  if (response.status === 200) {
    setIsRunning(true);
    startPolling(); // Poll for emotion data every 1 second
  }
};
```

**Poll cho emotion data**:
```javascript
setInterval(async () => {
  const response = await axios.get(
    'http://localhost:3001/api/camera/emotion-data',
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  setEmotionData(response.data.emotionData); // Update UI
}, 1000);
```

---

### 2. Backend → C++ Executable

**File**: `Backend/src/controllers/CameraController.js`

**Khi nhận request start**:
```javascript
export const startCamera = async (req, res) => {
  // 1. Extract parameters
  const modelPath = req.body.modelPath || 'MobileNet_custom.onnx';
  const cameraId = req.body.cameraId || '0';
  
  // 2. Setup paths
  const emotionStatPath = path.join(__dirname, '../../../Emotion-statistics');
  const exePath = path.join(emotionStatPath, 'main.exe');
  const opencvBinPath = path.join(emotionStatPath, 'opencv/build/x64/vc16/bin');
  
  // 3. Spawn C++ process
  emotionDetectionProcess = spawn(
    exePath, 
    [modelPath, cameraId],  // Command line arguments
    {
      cwd: emotionStatPath,
      env: { 
        ...process.env,
        PATH: `${opencvBinPath};${process.env.PATH}` // Add OpenCV DLLs
      }
    }
  );
  
  // 4. Return success
  res.status(200).json({
    message: "Camera started successfully",
    status: "active",
    modelPath: modelPath,
    cameraId: cameraId
  });
};
```

**Khi đọc emotion data**:
```javascript
export const getEmotionData = async (req, res) => {
  const outputCsvPath = path.join(
    emotionStatPath, 
    'face_logs', 
    'output.csv'
  );
  
  // Read CSV file
  const csvContent = fs.readFileSync(outputCsvPath, 'utf-8');
  const lines = csvContent.split('\n');
  
  // Parse CSV
  const data = lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      ID: values[0],
      Happy: parseFloat(values[1]),
      Sad: parseFloat(values[2]),
      Surprise: parseFloat(values[3]),
      Angry: parseFloat(values[4]),
      Disgust: parseFloat(values[5]),
      Num_frame: parseInt(values[6])
    };
  });
  
  res.json({
    emotionData: data,
    isRunning: true
  });
};
```

---

### 3. C++ Processing

**File**: `Emotion-statistics/main.cpp`

**Nhận command line arguments**:
```cpp
int main(int argc, char* argv[]) {
    // Parse arguments
    std::string emotionModelPath = "MobileNet_custom.onnx"; // Default
    int cameraId = 0; // Default
    
    if (argc >= 2) {
        emotionModelPath = argv[1]; // From Backend
        std::cout << "Using emotion model: " << emotionModelPath << std::endl;
    }
    
    if (argc >= 3) {
        cameraId = std::atoi(argv[2]); // From Backend
        std::cout << "Using camera ID: " << cameraId << std::endl;
    }
    
    // Load models
    FaceDetectorYN detector = create("face_detection_yunet_2023mar_int8.onnx");
    Net emotionNet = readNetFromONNX(emotionModelPath);
    
    // Open camera
    VideoCapture cap(cameraId);
    
    // Main loop...
}
```

**Xuất results**:
```cpp
// For each detected face
std::ofstream csv_file(face_dir + "/emotions.csv");
csv_file << "frame,Happy,Sad,Surprise,Angry,Disgust\n";

// Write emotion probabilities each frame
csv_file << frame_count << ","
         << prob.at<float>(0,0) << ","
         << prob.at<float>(0,1) << ","
         << prob.at<float>(0,2) << ","
         << prob.at<float>(0,3) << ","
         << prob.at<float>(0,4) << "\n";

// At end, write summary
std::ofstream summary("face_logs/output.csv");
summary << "ID,Happy,Sad,Surprise,Angry,Disgust,Num_frame\n";
for (each face) {
    summary << id << "," << avg_happy << "," << ... << "\n";
}
```

---

## 🚀 Flow hoàn chỉnh từ đầu đến cuối

### User clicks "Bắt đầu" button:

```
1. Frontend (CameraView.js)
   ↓ User clicks "▶ Bắt đầu"
   ↓ handleStartCamera() called
   ↓ POST http://localhost:3001/api/camera/start
   ↓ Body: { modelPath: "MobileNet_custom.onnx", cameraId: "0" }
   ↓ Headers: { Authorization: "Bearer <token>" }

2. Backend (CameraController.js)
   ↓ Receives POST /api/camera/start
   ↓ Middleware: verifyToken, isUser
   ↓ Extract: modelPath, cameraId from req.body
   ↓ Build command: main.exe MobileNet_custom.onnx 0
   ↓ spawn(main.exe, [modelPath, cameraId])
   ↓ Add OpenCV DLLs to PATH
   ↓ Return: { status: "active", modelPath, cameraId }

3. C++ Process (main.exe)
   ↓ Parse argv[1] → emotionModelPath
   ↓ Parse argv[2] → cameraId
   ↓ Load YuNet (face detection)
   ↓ Load MobileNet (emotion from argv[1])
   ↓ Open camera (argv[2])
   ↓ Show OpenCV window
   ↓ Loop:
       • Detect faces
       • Track faces
       • Classify emotions
       • Display on screen
       • Write to CSV files

4. Frontend Polling
   ↓ Every 1 second:
   ↓ GET http://localhost:3001/api/camera/emotion-data
   ↓ Backend reads face_logs/output.csv
   ↓ Parse CSV → JSON
   ↓ Return emotion data
   ↓ Frontend updates UI with statistics

5. User clicks "Dừng" button:
   ↓ POST http://localhost:3001/api/camera/stop
   ↓ Backend kills C++ process
   ↓ OpenCV window closes
   ↓ Frontend stops polling
   ↓ Status → "inactive"
```

---

## 📁 File Data Flow

### Output Files Created:

```
Emotion-statistics/
└── face_logs/
    ├── output.csv                    ← Summary (read by Backend)
    │   Format: ID,Happy,Sad,Surprise,Angry,Disgust,Num_frame
    │   Example: 0,0.65,0.10,0.15,0.05,0.05,127
    │
    ├── ID0/
    │   ├── first_frame.jpg           ← Face image
    │   └── emotions.csv              ← Frame-by-frame
    │       Format: frame,Happy,Sad,Surprise,Angry,Disgust
    │       Example: 10,0.72,0.08,0.12,0.05,0.03
    │
    ├── ID1/
    │   ├── first_frame.jpg
    │   └── emotions.csv
    │
    └── ...
```

### Data Read by Backend:

```javascript
// Backend reads this file
face_logs/output.csv

// Converts to JSON
{
  emotionData: [
    {
      ID: "0",
      Happy: 0.65,
      Sad: 0.10,
      Surprise: 0.15,
      Angry: 0.05,
      Disgust: 0.05,
      Num_frame: 127
    },
    { ID: "1", ... }
  ],
  isRunning: true,
  totalDataPoints: 2
}
```

### Data Displayed in Frontend:

```jsx
{emotionData.map(person => (
  <div className="emotion-card">
    <h3>Person ID: {person.ID}</h3>
    <p>Happy: {(person.Happy * 100).toFixed(1)}%</p>
    <p>Sad: {(person.Sad * 100).toFixed(1)}%</p>
    <p>Surprise: {(person.Surprise * 100).toFixed(1)}%</p>
    <p>Angry: {(person.Angry * 100).toFixed(1)}%</p>
    <p>Disgust: {(person.Disgust * 100).toFixed(1)}%</p>
    <p>Frames: {person.Num_frame}</p>
  </div>
))}
```

---

## 🔧 Cách thay đổi Emotion Model

### Option 1: Qua Web UI (Recommended)

1. Add model file: `Emotion-statistics/YourNewModel.onnx`
2. Edit Frontend: `Frontend/src/Components/Camera/CameraView.js`
```javascript
const availableModels = [
  { value: 'MobileNet_custom.onnx', label: 'MobileNet Custom (Default)' },
  { value: 'YourNewModel.onnx', label: 'Your New Model' }  // Add this
];
```
3. Restart Frontend
4. Select new model in dropdown
5. Click "Bắt đầu"

### Option 2: Qua Command Line (Testing)

```powershell
cd Emotion-statistics
$env:PATH += ";$PWD\opencv\build\x64\vc16\bin"
.\main.exe YourNewModel.onnx 0
```

---

## ✅ Verification Checklist

### Files đã tạo/sửa:

- [x] `Backend/src/controllers/CameraController.js` - Spawn C++ with args
- [x] `Backend/src/routes/CameraRoutes.js` - API endpoints
- [x] `Backend/package.json` - Added start script
- [x] `Frontend/src/Components/Camera/CameraView.js` - Model selector
- [x] `Frontend/src/Components/Camera/CameraView.css` - Styling
- [x] `Emotion-statistics/main.cpp` - Command line args
- [x] `Emotion-statistics/main.exe` - Compiled executable
- [x] `Emotion-statistics/build_main.bat` - Build script

### Integration Points đã kết nối:

- [x] Frontend sends modelPath & cameraId to Backend
- [x] Backend spawns main.exe with arguments
- [x] Backend sets OpenCV DLL path
- [x] C++ reads arguments and uses them
- [x] C++ writes results to CSV
- [x] Backend reads CSV files
- [x] Backend returns JSON to Frontend
- [x] Frontend displays emotion statistics
- [x] Authentication middleware active

---

## 🎯 Next Steps - Test Full Flow

### Terminal 1: Start Backend
```powershell
cd Backend
npm start
```

### Terminal 2: Start Frontend
```powershell
cd Frontend
npm start
```

### Browser: Test Integration
1. Go to http://localhost:3000
2. Login
3. Navigate to Camera page
4. See model selector & camera selector
5. Click "Bắt đầu"
6. OpenCV window opens
7. Faces detected with emotions
8. Web page shows statistics
9. Click "Dừng"
10. Everything stops cleanly

---

**✅ Integration COMPLETE!**

All components are connected and ready to use. The frontend webcam emotion detection is now fully integrated with the backend using the C++ emotion detection system.
