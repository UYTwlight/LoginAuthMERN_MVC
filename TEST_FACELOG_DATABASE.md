# Test Face Log Database Integration

## ✅ Đã Hoàn Thành

### 1. **Sửa API Port trong C++**
- **File**: `Emotion-statistics/main.cpp`
- **Thay đổi**: 
  ```cpp
  const int API_PORT = 3001; // Đã sửa từ 5000 → 3001
  ```
- **Build**: C++ đã được compile lại thành công (main.exe - 12:31 PM)

### 2. **API Endpoints Đã Test**
✅ **POST** `/api/emotions/face-logs/sessions` - Tạo session mới
✅ **PATCH** `/api/emotions/face-logs/sessions/:sessionId` - Cập nhật session

**Test Result**:
```
✅ SUCCESS! Status: 200
Session created in MongoDB với:
- sessionId
- source (Camera_0)
- sourceType (camera/video)
- timestamp
- directoryPath
- faceIds []
- faceCount: 0
- status: running
```

### 3. **Cách C++ Hoạt Động**

Khi camera được start từ Dashboard:
1. C++ process được spawn bởi Backend
2. C++ tạo thư mục face_logs/Camera_X hoặc video_name
3. **C++ gọi API POST** → Tạo FaceLogSession trong MongoDB
4. Mỗi khi phát hiện face mới → C++ gọi **PATCH API** cập nhật faceIds
5. Khi stop camera → C++ gọi **PATCH API** với status: "completed"

## 🧪 Cách Test

### **Bước 1: Đảm bảo hệ thống đang chạy**
```powershell
# Kiểm tra Backend port 3001
netstat -ano | findstr :3001

# Nếu chưa chạy
.\start-all.bat
```

### **Bước 2: Mở Browser**
1. Truy cập: http://localhost:3000
2. Đăng nhập với:
   - Email: `sonhotboy82@gmail.com`
   - Password: (your password)

### **Bước 3: Start Camera**
1. Navigate to **Camera Dashboard**
2. Select Model: `MobileNet_custom.onnx`
3. Select Camera: `0`
4. Click **"Bắt đầu"**

### **Bước 4: Quan sát**
Trong terminal Backend, bạn sẽ thấy:
```
[API] Creating face log session in MongoDB...
[API] Face log session created in MongoDB: Camera_0_20251109_123456
```

### **Bước 5: Kiểm tra MongoDB**
Mở MongoDB Compass và check collection `facelogsessions`:
```javascript
{
  "_id": ObjectId("..."),
  "sessionId": "Camera_0_20251109_123456",
  "source": "Camera_0",
  "sourceType": "camera",
  "timestamp": "2025-11-09T05:34:56.000Z",
  "startTime": ISODate("2025-11-09T05:34:56.789Z"),
  "status": "running",
  "faceCount": 0,  // Will update as faces detected
  "faceIds": [],   // Will populate: ["ID0", "ID1", ...]
  "directoryPath": "face_logs\\Camera_0_20251109_123456",
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

### **Bước 6: Phát hiện khuôn mặt**
Khi camera phát hiện khuôn mặt:
- OpenCV window hiển thị bounding box + emotion
- C++ ghi CSV vào `face_logs/Camera_X/IDx/emotions.csv`
- **C++ gọi PATCH API** cập nhật MongoDB:
  ```javascript
  {
    "faceIds": ["ID0", "ID1", "ID2"],
    "faceCount": 3
  }
  ```

### **Bước 7: Dừng Camera**
1. Nhấn **ESC** trong OpenCV window hoặc
2. Click **"Dừng"** trong Dashboard

C++ sẽ gọi API cuối cùng:
```javascript
{
  "status": "completed",
  "endTime": "2025-11-09T05:40:00.000Z",
  "faceIds": [...],
  "faceCount": <final_count>
}
```

### **Bước 8: Xem Reports**
1. Navigate to **Reports** page
2. Bạn sẽ thấy session mới xuất hiện trong danh sách
3. Click vào session → Xem biểu đồ cảm xúc chi tiết

## 🔍 Debug

### Nếu không thấy session trong MongoDB:

**1. Kiểm tra C++ console output**
```powershell
# Trong terminal backend, tìm dòng:
[API] Face log session created in MongoDB: ...
# hoặc
[API] Failed to create face log session. Status: ...
```

**2. Kiểm tra Backend có lỗi không**
```powershell
# Terminal backend sẽ hiển thị:
POST /api/emotions/face-logs/sessions 200 150ms
# hoặc
POST /api/emotions/face-logs/sessions 500 Error: ...
```

**3. Test API trực tiếp**
```powershell
cd Backend
node testFaceLogCreate.js
```

**4. Kiểm tra ENABLE_API_SYNC**
Trong `main.cpp` line 26:
```cpp
const bool ENABLE_API_SYNC = true; // Phải là true
```

**5. Kiểm tra API_PORT**
Trong `main.cpp` line 25:
```cpp
const int API_PORT = 3001; // Phải là 3001
```

### Nếu session tạo nhưng không update faceIds:

Check trong `main.cpp` line 564:
```cpp
if (!faceLogSessionId.empty()) {
    // ... collect faceIds ...
    updateFaceLogSession(faceLogSessionId, currentFaceIds);
}
```

## 📊 Luồng Dữ Liệu Hoàn Chỉnh

```
User clicks "Bắt đầu"
    ↓
Frontend → Backend API: POST /api/camera/start
    ↓
Backend spawns C++ process (main.exe)
    ↓
C++ creates face_logs directory
    ↓
C++ → Backend API: POST /api/emotions/face-logs/sessions
    ↓
MongoDB: FaceLogSession document created
    ↓
C++ detects faces → writes CSV files
    ↓
C++ → Backend API: PATCH /api/emotions/face-logs/sessions/:id
    ↓
MongoDB: faceIds and faceCount updated
    ↓
User clicks "Dừng" or presses ESC
    ↓
C++ → Backend API: PATCH /api/emotions/face-logs/sessions/:id (status: completed)
    ↓
MongoDB: Session marked as completed with endTime
    ↓
Frontend polls: GET /api/camera/logs
    ↓
Frontend displays updated logs in "Nhật Ký Phát Hiện"
    ↓
User navigates to Reports page
    ↓
Frontend: GET /api/emotions/face-logs/sessions
    ↓
Displays all sessions with charts
```

## ✨ Tính Năng Mới

### 1. **Live Logs với Auto-refresh**
- Logs tự động cập nhật mỗi 10 giây khi camera chạy
- Hiển thị gradient tím với animation đẹp
- Sau khi dừng → Tự động load logs cuối cùng

### 2. **MongoDB Integration**
- FaceLogSession tự động tạo khi start camera
- Auto-update faceIds khi phát hiện face mới
- Status tracking: running → completed
- Timestamp đầy đủ: startTime, endTime

### 3. **Reports Page**
- Hiển thị tất cả sessions từ MongoDB
- Filter: Camera/Video
- Search theo tên
- 3 loại biểu đồ: Pie, Bar, Line
- Vietnamese emotion labels

## 🎯 Next Steps

Nếu muốn kiểm tra sâu hơn:

1. **Test với video file**:
   ```powershell
   cd Emotion-statistics
   .\main.exe MobileNet_custom.onnx path\to\video.mp4
   ```

2. **Monitor MongoDB realtime**:
   - Mở MongoDB Compass
   - Refresh collection `facelogsessions` trong khi camera chạy
   - Xem faceIds tăng dần

3. **Check Backend logs**:
   ```powershell
   # Sẽ thấy các API calls:
   POST /api/emotions/face-logs/sessions
   PATCH /api/emotions/face-logs/sessions/:id
   ```

## ⚠️ Lưu Ý

- Main.exe phải được build lại sau mỗi thay đổi trong main.cpp
- Backend phải chạy trước khi start camera
- MongoDB connection string phải đúng trong `.env`
- Port 3001 phải available (không bị process khác chiếm)

---

**Build date**: 2025-11-09 12:31 PM
**API Port**: 3001
**MongoDB**: Atlas cluster 'test' database
