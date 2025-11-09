# 🔗 Kết nối Frontend - Backend - C++ Emotion Detection

## ✅ ĐÃ HOÀN THÀNH - Tích hợp thành công!

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INTERFACE (Browser)                    │
│                    http://localhost:3000                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ 1. User clicks "Bắt đầu"
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React App)                         │
│             src/Components/Camera/CameraView.js                 │
│                                                                 │
│  • Model Selector: [MobileNet Custom ▼]                        │
│  • Camera Selector: [Camera 0 ▼]                               │
│  • Button: [▶ Bắt đầu]                                         │
│                                                                 │
│  const handleStartCamera = async () => {                       │
│    axios.post('http://localhost:3001/api/camera/start', {      │
│      modelPath: 'MobileNet_custom.onnx',                       │
│      cameraId: '0'                                             │
│    })                                                           │
│  }                                                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ 2. POST /api/camera/start
                            │    Body: { modelPath, cameraId }
                            │    Header: Authorization: Bearer <token>
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js/Express)                    │
│                    http://localhost:3001                        │
│           src/controllers/CameraController.js                   │
│                                                                 │
│  export const startCamera = async (req, res) => {              │
│    const modelPath = req.body.modelPath;                       │
│    const cameraId = req.body.cameraId;                         │
│                                                                 │
│    emotionDetectionProcess = spawn(                            │
│      'main.exe',                                               │
│      [modelPath, cameraId],  // ← Command line args            │
│      {                                                          │
│        cwd: 'Emotion-statistics/',                             │
│        env: {                                                   │
│          PATH: 'opencv/build/x64/vc16/bin;...'                │
│        }                                                        │
│      }                                                          │
│    );                                                           │
│                                                                 │
│    res.json({ status: 'active' });                            │
│  }                                                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ 3. spawn('main.exe', [model, camera])
                            │    Working dir: Emotion-statistics/
                            │    PATH includes: opencv/build/.../bin/
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              C++ EMOTION DETECTION (main.exe)                   │
│                  Emotion-statistics/main.cpp                    │
│                                                                 │
│  int main(int argc, char* argv[]) {                            │
│    // 4. Parse command line arguments                          │
│    string modelPath = argv[1];  // "MobileNet_custom.onnx"    │
│    int cameraId = atoi(argv[2]); // 0                          │
│                                                                 │
│    // 5. Load models                                           │
│    FaceDetectorYN detector = create(                           │
│      "face_detection_yunet_2023mar_int8.onnx"                 │
│    );                                                           │
│    Net emotionNet = readNetFromONNX(modelPath);  // From argv │
│                                                                 │
│    // 6. Open camera                                           │
│    VideoCapture cap(cameraId);  // From argv                   │
│                                                                 │
│    // 7. Main processing loop                                  │
│    while (true) {                                              │
│      cap >> frame;                                             │
│      detector->detect(frame, faces);  // YuNet                │
│      emotionNet.forward(face);        // MobileNet            │
│      imshow("Detection", frame);      // OpenCV window        │
│                                                                 │
│      // 8. Write results to CSV                               │
│      csv << frame_id << "," << emotions << "\n";              │
│    }                                                            │
│  }                                                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ 9. Output files created
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CSV OUTPUT FILES                           │
│               Emotion-statistics/face_logs/                     │
│                                                                 │
│  output.csv                                                     │
│  ├── ID,Happy,Sad,Surprise,Angry,Disgust,Num_frame            │
│  ├── 0,0.65,0.10,0.15,0.05,0.05,127                           │
│  └── 1,0.45,0.20,0.25,0.05,0.05,98                            │
│                                                                 │
│  ID0/emotions.csv                                               │
│  ├── frame,Happy,Sad,Surprise,Angry,Disgust                   │
│  ├── 10,0.72,0.08,0.12,0.05,0.03                              │
│  └── 20,0.68,0.09,0.14,0.06,0.03                              │
│                                                                 │
│  ID0/first_frame.jpg (Face image)                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ 10. Backend polls CSV every 1 sec
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Read CSV)                           │
│           src/controllers/CameraController.js                   │
│                                                                 │
│  export const getEmotionData = async (req, res) => {          │
│    // Read face_logs/output.csv                               │
│    const csvContent = fs.readFileSync('output.csv', 'utf-8'); │
│    const data = parseCsv(csvContent);                          │
│                                                                 │
│    res.json({                                                   │
│      emotionData: [                                            │
│        {                                                        │
│          ID: "0",                                              │
│          Happy: 0.65,                                          │
│          Sad: 0.10,                                            │
│          ...                                                    │
│        }                                                        │
│      ]                                                          │
│    });                                                          │
│  }                                                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ 11. GET /api/camera/emotion-data
                            │     Returns JSON
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Display Results)                   │
│             src/Components/Camera/CameraView.js                 │
│                                                                 │
│  // Poll every 1 second                                        │
│  setInterval(async () => {                                     │
│    const response = await axios.get(                           │
│      'http://localhost:3001/api/camera/emotion-data'          │
│    );                                                           │
│    setEmotionData(response.data.emotionData);                  │
│  }, 1000);                                                      │
│                                                                 │
│  // Display in UI                                              │
│  {emotionData.map(person => (                                  │
│    <div>                                                        │
│      <h3>Person {person.ID}</h3>                               │
│      <p>Happy: {person.Happy * 100}%</p>                       │
│      <p>Sad: {person.Sad * 100}%</p>                           │
│      ...                                                        │
│    </div>                                                       │
│  ))}                                                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ 12. User sees live statistics!
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     USER SEES RESULTS                           │
│                                                                 │
│  Person 0                                                       │
│  ├─ Happy: 65.0%    █████████░                                │
│  ├─ Sad: 10.0%      ██░░░░░░░░                                │
│  ├─ Surprise: 15.0% ███░░░░░░░                                │
│  ├─ Angry: 5.0%     █░░░░░░░░░                                │
│  └─ Disgust: 5.0%   █░░░░░░░░░                                │
│  Frames: 127                                                    │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Key Points Kết Nối

### 1️⃣ Frontend → Backend
- **Method**: HTTP POST/GET
- **URL**: http://localhost:3001/api/camera/*
- **Authentication**: JWT Bearer token
- **Data**: JSON body với modelPath và cameraId

### 2️⃣ Backend → C++ Process
- **Method**: Node.js `spawn()`
- **Command**: `main.exe [modelPath] [cameraId]`
- **Working Dir**: `Emotion-statistics/`
- **Environment**: PATH includes OpenCV DLLs

### 3️⃣ C++ → File System
- **Method**: Write CSV files
- **Location**: `Emotion-statistics/face_logs/`
- **Format**: 
  - `output.csv` (summary)
  - `ID*/emotions.csv` (detailed)
  - `ID*/first_frame.jpg` (images)

### 4️⃣ Backend → Frontend
- **Method**: HTTP GET response
- **URL**: /api/camera/emotion-data
- **Format**: JSON với emotionData array
- **Polling**: Every 1 second

## ✅ Verification Steps

1. ✅ Frontend gửi request với model và camera đã chọn
2. ✅ Backend nhận request, spawn C++ process với args
3. ✅ C++ executable chạy với đúng model và camera
4. ✅ OpenCV window hiện lên với live detection
5. ✅ CSV files được tạo ra trong face_logs/
6. ✅ Backend đọc CSV và convert sang JSON
7. ✅ Frontend nhận JSON và hiển thị statistics
8. ✅ UI update real-time mỗi giây

## 🎉 Kết quả

**TẤT CẢ CÁC THÀNH PHẦN ĐÃ ĐƯỢC KẾT NỐI THÀNH CÔNG!**

- ✅ Frontend UI có model selector
- ✅ Backend API nhận modelPath từ Frontend
- ✅ C++ process nhận arguments từ Backend
- ✅ C++ sử dụng model đã chọn
- ✅ Results được ghi vào CSV
- ✅ Backend đọc CSV
- ✅ Frontend hiển thị results

**READY TO USE! 🚀**

---

Để test toàn bộ hệ thống:

```bash
# Chạy script này để start tất cả
.\start-all.bat
```

Hoặc manual:

```bash
# Terminal 1: Backend
cd Backend
npm start

# Terminal 2: Frontend
cd Frontend  
npm start

# Browser: http://localhost:3000
# Login → Camera page → Select model → Bắt đầu → See live detection!
```
