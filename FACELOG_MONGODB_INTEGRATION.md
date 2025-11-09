# Face Log MongoDB Integration Guide

## Tổng quan

Hệ thống đã được cập nhật để tự động lưu metadata của các face log sessions vào MongoDB, giúp quản lý và truy vấn lịch sử phân tích hiệu quả hơn.

## Kiến trúc

### 1. **MongoDB Schema**

#### FaceLogSession Collection
```javascript
{
  sessionId: String,          // Tên thư mục: "Camera_0_20251109_101419"
  source: String,             // "Camera_0", "video_name", etc.
  sourceType: String,         // "camera", "video", "image"
  timestamp: String,          // "20251109_101419"
  startTime: Date,            // Thời điểm bắt đầu
  endTime: Date,              // Thời điểm kết thúc
  status: String,             // "running", "completed", "stopped", "error"
  faceCount: Number,          // Số lượng khuôn mặt phát hiện được
  faceIds: [String],          // ["ID0", "ID1", "ID2", ...]
  directoryPath: String,      // Đường dẫn tuyệt đối đến thư mục
  notes: String,              // Ghi chú (optional)
  createdAt: Date,            // Auto-generated
  updatedAt: Date             // Auto-generated
}
```

### 2. **API Endpoints**

#### C++ App APIs (Không cần authentication)
```
POST   /api/emotions/face-logs/sessions
       Body: { sessionId, source, sourceType, timestamp, directoryPath }
       → Tạo session mới trong MongoDB

PATCH  /api/emotions/face-logs/sessions/:sessionId
       Body: { faceIds: [], faceCount: N, status: "..." }
       → Cập nhật session (thêm faces, cập nhật status)
```

#### Frontend/Reports APIs (Cần authentication)
```
GET    /api/emotions/face-logs/sessions
       → Lấy danh sách tất cả sessions từ MongoDB

GET    /api/emotions/face-logs/sessions/:sessionId
       → Lấy dữ liệu chi tiết (đọc CSV từ file system)

GET    /api/emotions/face-logs/image/:sessionId/:faceId/:imageName
       → Lấy ảnh first_frame.jpg
```

### 3. **Luồng hoạt động**

#### Khi C++ App bắt đầu phân tích:

1. **Tạo thư mục session** trong `face_logs/`
   ```
   face_logs/Camera_0_20251109_101419/
   ```

2. **Gọi API tạo session** trong MongoDB
   ```cpp
   createFaceLogSession(
       "Camera_0_20251109_101419",  // sessionId
       "Camera_0",                   // source
       "camera",                     // sourceType
       "20251109_101419",           // timestamp
       "D:/...../face_logs/Camera_0_20251109_101419"  // directoryPath
   );
   ```

3. **Khi phát hiện face mới:**
   - Tạo thư mục `ID0/`, `ID1/`, ...
   - Lưu `first_frame.jpg` và `emotions.csv`
   - **Cập nhật MongoDB** với faceIds mới:
     ```cpp
     updateFaceLogSession(sessionId, ["ID0", "ID1"], "");
     ```

4. **Khi kết thúc:**
   - Đóng tất cả CSV files
   - **Cập nhật status** thành "completed":
     ```cpp
     updateFaceLogSession(sessionId, finalFaceIds, "completed");
     ```

#### Khi User xem Reports:

1. **Frontend gọi API** lấy danh sách sessions:
   ```javascript
   GET /api/emotions/face-logs/sessions
   ```
   → Trả về danh sách từ MongoDB (nhanh, đã indexed)

2. **User chọn session** → Frontend gọi API lấy chi tiết:
   ```javascript
   GET /api/emotions/face-logs/sessions/Camera_0_20251109_101419
   ```
   → Backend đọc CSV files và tính toán statistics

3. **Hiển thị:**
   - Session list với thông tin: source, timestamp, faceCount, status
   - Charts và statistics cho từng face
   - Ảnh first_frame của mỗi face

## Code Changes

### 1. Backend Models (`Backend/src/models/Emotion.js`)
- ✅ Thêm `FaceLogSession` schema
- ✅ Export model mới

### 2. Backend Controller (`Backend/src/controllers/EmotionController.js`)
- ✅ `createFaceLogSession()` - Tạo session mới
- ✅ `updateFaceLogSession()` - Cập nhật session
- ✅ `getFaceLogSessions()` - Lấy danh sách từ MongoDB
- ✅ `getFaceLogSessionData()` - Đọc CSV và tính statistics

### 3. Backend Routes (`Backend/src/routes/EmotionRoutes.js`)
- ✅ Thêm 4 routes mới cho face log management

### 4. C++ App (`Emotion-statistics/main.cpp`)
- ✅ `createFaceLogSession()` - Gọi API tạo session
- ✅ `updateFaceLogSession()` - Gọi API cập nhật
- ✅ Tích hợp vào main loop:
  - Tạo session khi bắt đầu
  - Cập nhật khi có face mới
  - Cập nhật status khi kết thúc

### 5. Frontend (`Frontend/src/Components/Reports/Reports_FaceLogs.js`)
- ✅ Lấy sessions từ MongoDB thay vì scan file system
- ✅ Hiển thị status badge (running/completed/error)
- ✅ Render charts và statistics

## Lợi ích

### ✅ **Performance**
- Query sessions từ MongoDB nhanh hơn scan file system
- Index trên startTime, sourceType giúp filter hiệu quả

### ✅ **Scalability**
- Dễ dàng thêm filters: theo ngày, theo camera, theo status
- Có thể phân trang (pagination) khi có nhiều sessions

### ✅ **Data Integrity**
- MongoDB đảm bảo dữ liệu nhất quán
- Có thể add validation, constraints

### ✅ **Features mở rộng**
- Thêm user tracking (ai chạy session nào)
- Thêm notes/comments cho mỗi session
- Export reports, analytics tổng hợp

## Testing

### Test tạo session mới:
```bash
# Run C++ app với camera
cd Emotion-statistics
main.exe MobileNet_custom.onnx 0

# Hoặc với video
main.exe MobileNet_custom.onnx "path/to/video.mp4" --headless
```

### Verify trong MongoDB:
```javascript
// Connect to MongoDB
use emotion-detection

// Check sessions
db.facelogsessions.find().sort({startTime: -1}).limit(5)

// Check một session cụ thể
db.facelogsessions.findOne({sessionId: "Camera_0_20251109_101419"})
```

### Test Reports page:
1. Login vào web app: http://localhost:3000
2. Navigate to **Reports** page
3. Verify:
   - Danh sách sessions hiển thị đúng
   - Chọn session → Thấy faces, charts, statistics
   - Ảnh first_frame hiển thị đúng

## Configuration

### Enable/Disable API Sync
In `main.cpp`:
```cpp
const bool ENABLE_API_SYNC = true;  // Set false để tắt MongoDB sync
```

### API Host/Port
```cpp
const char* API_HOST = "localhost";
const int API_PORT = 3001;
```

## Troubleshooting

### Lỗi: "Failed to create face log session"
- **Kiểm tra Backend có chạy không:** `http://localhost:3001`
- **Kiểm tra MongoDB connection:** Backend console có lỗi MongoDB không?
- **Verify API endpoint:** POST `/api/emotions/face-logs/sessions`

### Sessions không hiển thị trong Reports
- **Check MongoDB:** `db.facelogsessions.find()`
- **Check authentication:** Token hết hạn → Login lại
- **Check browser console:** Có lỗi API không?

### CSV data không đọc được
- **Verify thư mục:** Session folder có tồn tại trong `face_logs/` không?
- **Check CSV files:** Mỗi `ID*/emotions.csv` có đúng format không?
- **Check permissions:** Backend có quyền đọc file không?

## Next Steps

### Tính năng có thể mở rộng:
1. **Search & Filter:** Tìm kiếm sessions theo camera, date range, status
2. **Export Reports:** Xuất PDF/Excel với charts và statistics
3. **Session Management:** Delete, rename, merge sessions
4. **Notifications:** Email/SMS khi phân tích hoàn thành
5. **User Tracking:** Gán session cho user cụ thể
6. **Retention Policy:** Tự động xóa sessions cũ sau N ngày

## API Documentation

See full API documentation in `/Backend/API_DOCUMENTATION.md`
