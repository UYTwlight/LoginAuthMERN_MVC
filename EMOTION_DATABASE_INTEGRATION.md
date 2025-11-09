# Hệ thống Phân tích và Lưu trữ Cảm xúc - MongoDB Integration

## 📚 Tổng quan

Hệ thống đã được nâng cấp để tự động lưu trữ dữ liệu phân tích cảm xúc vào MongoDB và hiển thị báo cáo tổng quan trên giao diện web.

---

## 🏗️ Kiến trúc Hệ thống

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  C++ Emotion    │ ──HTTP──│   Node.js API    │ ───────│    MongoDB      │
│  Detection App  │ Requests │   (Express)      │         │    Database     │
│  (main.exe)     │          └──────────────────┘         └─────────────────┘
└─────────────────┘                   │
                                      │
                                      │ REST API
                                      │
                            ┌─────────▼──────────┐
                            │   React Frontend   │
                            │   Reports Page     │
                            └────────────────────┘
```

---

## 📦 Database Schema

### 1. EmotionSession Collection
Lưu thông tin về mỗi phiên phân tích (mỗi lần chạy ứng dụng C++)

```javascript
{
  _id: ObjectId,
  sessionName: "Camera_0_20251108_143022",
  sourceType: "camera" | "video",
  sourceId: "0" | "video_path",
  startTime: Date,
  endTime: Date,
  status: "running" | "completed" | "stopped" | "error",
  totalFrames: Number,
  totalFaces: Number,
  createdBy: ObjectId (ref: UserData)
}
```

### 2. EmotionData Collection
Lưu dữ liệu cảm xúc chi tiết cho mỗi frame

```javascript
{
  _id: ObjectId,
  sessionId: ObjectId (ref: EmotionSession),
  faceId: "ID0" | "ID1" | ...,
  frameNumber: Number,
  timestamp: Date,
  emotions: {
    happy: 0.0-1.0,
    sad: 0.0-1.0,
    surprise: 0.0-1.0,
    angry: 0.0-1.0,
    disgust: 0.0-1.0
  },
  dominantEmotion: "happy" | "sad" | "surprise" | "angry" | "disgust",
  confidence: 0.0-1.0
}
```

### 3. FaceStatistics Collection
Lưu thống kê tổng hợp cho mỗi khuôn mặt trong session

```javascript
{
  _id: ObjectId,
  sessionId: ObjectId (ref: EmotionSession),
  faceId: "ID0",
  firstFramePath: "face_logs/Camera_0_20251108_143022/ID0/first_frame.jpg",
  totalFrames: Number,
  averageEmotions: {
    happy: Number,
    sad: Number,
    surprise: Number,
    angry: Number,
    disgust: Number
  },
  dominantEmotion: "happy",
  emotionDistribution: {
    happy: Percentage,
    sad: Percentage,
    ...
  }
}
```

---

## 🔌 API Endpoints

### Session Management

#### `POST /api/emotions/sessions`
Tạo session mới (được gọi từ C++ app khi bắt đầu)

**Request Body:**
```json
{
  "sessionName": "Camera_0_20251108_143022",
  "sourceType": "camera",
  "sourceId": "0"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tạo session thành công",
  "data": {
    "_id": "673e1234567890abcdef1234",
    "sessionName": "Camera_0_20251108_143022",
    ...
  }
}
```

#### `GET /api/emotions/sessions`
Lấy danh sách tất cả sessions (yêu cầu authentication)

**Query Parameters:**
- `page`: Số trang (default: 1)
- `limit`: Số items/trang (default: 20)
- `status`: Lọc theo status
- `sourceType`: Lọc theo loại nguồn

#### `GET /api/emotions/sessions/:sessionId`
Lấy chi tiết một session

#### `PATCH /api/emotions/sessions/:sessionId/status`
Cập nhật trạng thái session

**Request Body:**
```json
{
  "status": "completed"
}
```

### Emotion Data

#### `POST /api/emotions/emotions`
Lưu dữ liệu cảm xúc (batch insert từ C++ app)

**Request Body:**
```json
{
  "sessionId": "673e1234567890abcdef1234",
  "emotionRecords": [
    {
      "faceId": "ID0",
      "frameNumber": 100,
      "emotions": {
        "happy": 0.85,
        "sad": 0.02,
        "surprise": 0.05,
        "angry": 0.03,
        "disgust": 0.05
      }
    },
    ...
  ]
}
```

#### `GET /api/emotions/emotions/:sessionId`
Lấy dữ liệu cảm xúc theo session

**Query Parameters:**
- `faceId`: Lọc theo face ID
- `page`: Số trang
- `limit`: Số items/trang

### Statistics

#### `POST /api/emotions/statistics/:sessionId/:faceId/calculate`
Tính toán thống kê cho một face (được gọi khi kết thúc session)

#### `GET /api/emotions/statistics/:sessionId`
Lấy tất cả thống kê của session (hiển thị trên Reports page)

**Response:**
```json
{
  "success": true,
  "data": {
    "session": { ... },
    "faceStatistics": [ ... ],
    "overallStatistics": {
      "totalFaces": 3,
      "totalFrames": 500,
      "overallEmotionDistribution": {
        "happy": 0.45,
        "sad": 0.15,
        "surprise": 0.20,
        "angry": 0.10,
        "disgust": 0.10
      }
    }
  }
}
```

---

## 🔧 Cấu hình C++ Application

### Constants trong main.cpp

```cpp
const std::string API_HOST = "localhost";
const int API_PORT = 5000;
const bool ENABLE_API_SYNC = true; // Set false để tắt đồng bộ API
const int BATCH_SIZE = 50; // Gửi mỗi 50 emotion records
```

### Flow hoạt động

1. **Khởi tạo:** 
   - Tạo session folder local
   - Gọi `createSession()` → Nhận `dbSessionId`

2. **Processing Loop:**
   - Phát hiện khuôn mặt
   - Phân tích cảm xúc
   - Ghi vào CSV (local)
   - Buffer emotion data
   - Khi buffer đạt `BATCH_SIZE` → Gọi `sendEmotionBatch()`

3. **Cleanup:**
   - Gửi batch cuối cùng
   - Gọi `calculateStatistics()` cho mỗi face
   - Gọi `updateSessionStatus("completed")`

---

## 🖥️ Frontend - Reports Page

### Features

1. **Session List Panel (bên trái):**
   - Hiển thị tất cả sessions
   - Filter theo status, source type
   - Làm mới danh sách
   - Click để xem chi tiết

2. **Statistics Panel (bên phải):**
   - **Tổng quan:** Số faces, frames, loại nguồn
   - **Pie Chart:** Phân bố cảm xúc tổng thể
   - **Bar Chart:** So sánh cảm xúc giữa các faces
   - **Table:** Bảng thống kê chi tiết từng face

### Navigation

```javascript
// Trong Dashboard/Navbar
<Link to="/reports">
  📊 Báo cáo
</Link>
```

---

## 🚀 Hướng dẫn Sử dụng

### Bước 1: Khởi động Backend

```powershell
cd Backend
npm install
npm start
```

Backend sẽ chạy trên `http://localhost:5000`

### Bước 2: Khởi động Frontend

```powershell
cd Frontend
npm install
npm start
```

Frontend sẽ chạy trên `http://localhost:3000`

### Bước 3: Chạy Emotion Detection

**Với Camera:**
```powershell
cd Emotion-statistics
.\run_main.bat
# hoặc
.\main.exe MobileNet_custom.onnx 0
```

**Với Video:**
```powershell
.\main.exe MobileNet_custom.onnx "path/to/video.mp4"
```

### Bước 4: Xem Báo cáo

1. Đăng nhập vào web app: `http://localhost:3000`
2. Navigate đến **Reports** page
3. Chọn session muốn xem từ danh sách
4. Xem biểu đồ và thống kê

---

## 📊 Ví dụ Output

### Console Output (C++ App)

```
==========================================
  Emotion Detection System
==========================================
Emotion Model: MobileNet_custom.onnx
Video Source: 0
==========================================
Creating log directory...
Created root log folder: face_logs
Created session folder: face_logs/Camera_0_20251108_143022
[API] Session created: 673e1234567890abcdef1234
Database session ID: 673e1234567890abcdef1234
...
[API] Sent 50 emotion records
[API] Sent 50 emotion records
...
Sending final batch of 23 records...
[API] Sent 23 emotion records
Calculating statistics for all faces...
[API] Statistics calculated for ID0
[API] Statistics calculated for ID1
[API] Statistics calculated for ID2
[API] Session status updated to: completed
```

### Reports Page UI

```
📊 Báo cáo phân tích cảm xúc
┌──────────────────────────────┬────────────────────────────────────┐
│ Danh sách Sessions           │  📈 Tổng quan Session              │
│                              │                                    │
│ ┌─ Camera_0_20251108_143022 │  ┌────┬────┬────┬────┐            │
│ │  📹 Camera (0)             │  │ 3  │500 │ 📹 │ ✓ │            │
│ │  Hoàn thành                │  │Face│Frm │Type│   │            │
│ │  Khuôn mặt: 3 | Frames:500 │  └────┴────┴────┴────┘            │
│ └────────────────────────────│                                    │
│                              │  🎭 Phân bố cảm xúc tổng thể       │
│ ┌─ video_meeting_143500     │     [Pie Chart]                    │
│ │  🎬 Video                  │                                    │
│ │  ...                       │  👤 Phân tích từng khuôn mặt       │
│ └────────────────────────────│     [Bar Chart]                    │
│                              │                                    │
└──────────────────────────────┴────────────────────────────────────┘
```

---

## 🔍 Troubleshooting

### 1. API Connection Failed

**Triệu chứng:** `[API] Failed to create session. Status: 0`

**Giải pháp:**
- Kiểm tra Backend đang chạy: `http://localhost:5000`
- Kiểm tra MongoDB đang chạy
- Tạm thời tắt API sync: Set `ENABLE_API_SYNC = false` trong main.cpp

### 2. Empty Sessions List

**Triệu chứng:** "Chưa có session nào" trên Reports page

**Giải pháp:**
- Chạy emotion detection app ít nhất 1 lần
- Kiểm tra console C++ app có `[API] Session created` không
- Verify data trong MongoDB: `db.emotionsessions.find()`

### 3. No Statistics Data

**Triệu chứng:** Session có trong list nhưng không có statistics

**Giải pháp:**
- Kiểm tra app C++ có chạy đến hết không (ESC để thoát)
- Verify `calculateStatistics()` được gọi trong cleanup
- Manual calculate: `POST /api/emotions/statistics/:sessionId/:faceId/calculate`

---

## 📝 Database Queries

### MongoDB Shell Commands

```javascript
// Xem tất cả sessions
db.emotionsessions.find().pretty()

// Đếm số emotion records
db.emotiondata.countDocuments()

// Xem statistics của một session
db.facestatistics.find({ sessionId: ObjectId("...") })

// Xóa tất cả dữ liệu (để test lại)
db.emotionsessions.deleteMany({})
db.emotiondata.deleteMany({})
db.facestatistics.deleteMany({})

// Tìm session gần nhất
db.emotionsessions.find().sort({ createdAt: -1 }).limit(1)

// Thống kê nhanh
db.emotionsessions.aggregate([
  {
    $group: {
      _id: "$sourceType",
      count: { $sum: 1 },
      totalFaces: { $sum: "$totalFaces" },
      totalFrames: { $sum: "$totalFrames" }
    }
  }
])
```

---

## 🎯 Performance Tips

1. **Batch Size:** 
   - Default: 50 records/batch
   - Tăng để giảm số API calls (nhưng tăng latency)
   - Giảm để real-time hơn

2. **Database Indexes:**
   - `EmotionData`: Index trên `{ sessionId: 1, faceId: 1 }`
   - `FaceStatistics`: Unique index trên `{ sessionId: 1, faceId: 1 }`

3. **API Timeout:**
   - Connection: 300ms
   - Read: 5s (10s cho statistics calculation)

---

## 📈 Future Enhancements

- [ ] Real-time WebSocket updates
- [ ] Export reports to PDF
- [ ] Advanced filtering (date range, emotion type)
- [ ] Comparison between sessions
- [ ] Video playback with emotion timeline
- [ ] Face recognition integration

---

## 📞 Support

Nếu gặp vấn đề, kiểm tra:

1. ✅ MongoDB đang chạy
2. ✅ Backend API server đang chạy (port 5000)
3. ✅ Frontend dev server đang chạy (port 3000)
4. ✅ C++ app được build với httplib.h
5. ✅ Các model files (.onnx) có trong thư mục

---

*Cập nhật lần cuối: 08/11/2025*
*Phiên bản: 2.0 - MongoDB Integration*
