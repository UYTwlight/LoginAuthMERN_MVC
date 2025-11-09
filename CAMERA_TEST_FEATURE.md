# 🧪 Emotion Test - Camera Feature Guide

## ✅ Đã Hoàn Thành

### **Tính năng mới trong Emotion Test:**
1. ✅ **Nút Bật Camera** với JWT authentication
2. ✅ **Nút Dừng Camera** khi đang chạy
3. ✅ **Status indicator** với pulse animation
4. ✅ **Camera info panel** hiển thị thông tin realtime
5. ✅ **UI/UX cải thiện** với gradient buttons và animations

---

## 📋 Thay Đổi Code

### **Frontend: EmotionTest.js**

#### **1. State Management**
```javascript
const [isCameraRunning, setIsCameraRunning] = useState(false);
```

#### **2. Start Camera Function**
```javascript
const handleStartCamera = async () => {
    try {
        setError('');
        setIsCameraRunning(true);
        
        const token = localStorage.getItem('accessToken');
        
        const response = await fetch('http://localhost:3001/api/camera/start', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                modelPath: 'MobileNet_custom.onnx',
                cameraId: '0'
            })
        });

        const data = await response.json();

        if (response.ok && data.status === 'active') {
            alert('✅ Camera đã được khởi động!');
        } else {
            setError(data.message || 'Không thể khởi động camera');
            setIsCameraRunning(false);
        }
    } catch (err) {
        setError('Không thể kết nối đến server: ' + err.message);
        setIsCameraRunning(false);
    }
};
```

#### **3. Stop Camera Function**
```javascript
const handleStopCamera = async () => {
    try {
        setError('');
        
        const token = localStorage.getItem('accessToken');
        
        const response = await fetch('http://localhost:3001/api/camera/stop', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok && data.status === 'stopped') {
            alert('⏹️ Camera đã dừng!');
            setIsCameraRunning(false);
        } else {
            setError(data.message || 'Không thể dừng camera');
        }
    } catch (err) {
        setError('Không thể kết nối đến server: ' + err.message);
    }
};
```

#### **4. UI Components**
```javascript
<div className="camera-controls">
    {!isCameraRunning ? (
        <button 
            className="btn-camera btn-start" 
            onClick={handleStartCamera}
        >
            ▶️ Bật Camera
        </button>
    ) : (
        <div className="camera-running">
            <div className="status-indicator">
                <span className="pulse-dot"></span>
                <span className="status-text">Camera đang chạy...</span>
            </div>
            <button 
                className="btn-camera btn-stop" 
                onClick={handleStopCamera}
            >
                ⏹️ Dừng Camera
            </button>
        </div>
    )}
</div>

{isCameraRunning && (
    <div className="camera-info">
        <p>✅ Cửa sổ OpenCV đang hiển thị video</p>
        <p>📊 Dữ liệu được lưu vào: <code>face_logs/Camera_0</code></p>
        <p>💡 Nhấn ESC trong cửa sổ OpenCV hoặc nút Dừng để tắt</p>
    </div>
)}
```

### **Frontend: EmotionTest.css**

#### **New Styles Added:**
```css
/* Camera Controls */
.camera-controls { }
.btn-start { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
.btn-stop { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }

/* Status Indicator */
.camera-running { display: flex; flex-direction: column; gap: 15px; }
.status-indicator { display: flex; align-items: center; gap: 10px; }
.pulse-dot { animation: pulse 1.5s ease-in-out infinite; }

/* Camera Info */
.camera-info { padding: 15px; background: rgba(255, 255, 255, 0.15); }
```

---

## 🎯 Cách Sử Dụng

### **Bước 1: Đảm bảo hệ thống đang chạy**
```powershell
# Check Backend
netstat -ano | findstr :3001

# Nếu chưa chạy
cd d:\UDTGMT\WEB\LoginAuthMERN_MVC
.\start-all.bat
```

### **Bước 2: Refresh Frontend**
```
Ctrl + F5 trong browser
```

### **Bước 3: Navigate to Emotion Test**
1. Login vào hệ thống
2. Click vào menu **"Emotion Test"** hoặc **"Kiểm Tra"**

### **Bước 4: Bật Camera**
1. Trong card **"📷 Test Realtime với Camera"**
2. Click nút **"▶️ Bật Camera"**
3. Đợi alert: **"✅ Camera đã được khởi động!"**
4. Cửa sổ OpenCV sẽ hiển thị video từ webcam

### **Bước 5: Quan Sát**
Khi camera đang chạy, bạn sẽ thấy:
- 🟢 **Status indicator** với pulse animation: "Camera đang chạy..."
- ⏹️ **Nút Dừng Camera** màu đỏ
- 📋 **Camera info panel**:
  - ✅ Cửa sổ OpenCV đang hiển thị video
  - 📊 Dữ liệu được lưu vào: `face_logs/Camera_0`
  - 💡 Nhấn ESC trong cửa sổ OpenCV hoặc nút Dừng để tắt

### **Bước 6: Dừng Camera**
**Cách 1:** Click nút **"⏹️ Dừng Camera"** trong UI
**Cách 2:** Nhấn **ESC** trong cửa sổ OpenCV

Alert sẽ hiển thị: **"⏹️ Camera đã dừng!"**

---

## 🎨 UI Preview

### **Trước khi bật camera:**
```
┌─────────────────────────────────────────┐
│  📷 Test Realtime với Camera           │
│  Khởi động camera để nhận diện...      │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      ▶️ Bật Camera                │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### **Sau khi bật camera:**
```
┌─────────────────────────────────────────┐
│  📷 Test Realtime với Camera           │
│  Khởi động camera để nhận diện...      │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  🟢 Camera đang chạy...           │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      ⏹️ Dừng Camera               │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ ✅ Cửa sổ OpenCV đang hiển thị   │ │
│  │ 📊 Dữ liệu: face_logs/Camera_0   │ │
│  │ 💡 Nhấn ESC hoặc nút Dừng        │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 🔧 API Endpoints Used

### **1. Start Camera**
```
POST /api/camera/start
Headers: Authorization: Bearer {JWT_TOKEN}
Body: {
  "modelPath": "MobileNet_custom.onnx",
  "cameraId": "0"
}

Response 200:
{
  "message": "Camera started successfully",
  "status": "active",
  "modelPath": "MobileNet_custom.onnx",
  "cameraId": "0"
}
```

### **2. Stop Camera**
```
POST /api/camera/stop
Headers: Authorization: Bearer {JWT_TOKEN}

Response 200:
{
  "message": "Camera stopped successfully",
  "status": "stopped"
}
```

---

## 🐛 Troubleshooting

### **Lỗi: "Không thể khởi động camera"**
**Nguyên nhân:**
- Backend chưa chạy
- JWT token hết hạn
- Camera đang được sử dụng bởi app khác

**Giải pháp:**
```powershell
# 1. Check Backend
netstat -ano | findstr :3001

# 2. Restart Backend
cd Backend
npm start

# 3. Re-login để refresh token

# 4. Đóng các app đang dùng camera (Zoom, Skype, etc.)
```

### **Lỗi: "Không thể kết nối đến server"**
**Nguyên nhân:**
- Backend offline
- Port 3001 bị block

**Giải pháp:**
```powershell
# Check firewall
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Node*"}

# Restart system
.\start-all.bat
```

### **Camera không xuất hiện trong OpenCV window**
**Nguyên nhân:**
- Webcam không kết nối
- Driver camera lỗi

**Giải pháp:**
```powershell
# Test camera trực tiếp
cd Emotion-statistics
.\main.exe

# Check Device Manager
devmgmt.msc
# → Cameras → Check for yellow warning icons
```

---

## ✨ Features Summary

| Feature | Status | Description |
|---------|--------|-------------|
| Start Camera Button | ✅ | Bật camera với JWT auth |
| Stop Camera Button | ✅ | Dừng camera từ UI |
| Status Indicator | ✅ | Pulse dot animation |
| Camera Info Panel | ✅ | Hiển thị thông tin realtime |
| Error Handling | ✅ | Alert và error messages |
| JWT Integration | ✅ | Token trong headers |
| Model Selection | ✅ | MobileNet_custom.onnx |
| Camera ID | ✅ | Default: 0 (webcam) |

---

## 📊 Technical Details

### **Authentication Flow:**
```
1. User clicks "Bật Camera"
   ↓
2. Frontend gets JWT from localStorage
   ↓
3. POST /api/camera/start with Bearer token
   ↓
4. Backend verifies token via verifyToken middleware
   ↓
5. Backend checks isUser role
   ↓
6. Backend spawns C++ process (main.exe)
   ↓
7. OpenCV window appears
   ↓
8. Frontend shows "Camera đang chạy"
```

### **C++ Process Details:**
```
Process: main.exe
Args: ["MobileNet_custom.onnx", "0"]
Cwd: Emotion-statistics/
Env: PATH includes opencv/build/x64/vc16/bin
Output: face_logs/Camera_0_timestamp/
```

### **Data Flow:**
```
Camera → C++ → CSV Files → MongoDB (via API)
                ↓
         face_logs/Camera_0/
                ↓
           ID0/emotions.csv
           ID1/emotions.csv
           ...
```

---

## 🎯 Next Steps

Sau khi test camera thành công, bạn có thể:

1. **View data in Reports:**
   - Navigate to Reports page
   - Xem session Camera_0 với charts

2. **Test with different cameras:**
   - Modify `cameraId` in code
   - Change `'0'` → `'1'` for external webcam

3. **Test with video files:**
   - Use upload feature
   - Select video file
   - Click "Phân Tích"

4. **View MongoDB data:**
   - Open MongoDB Compass
   - Collection: `facelogsessions`
   - See realtime updates

---

**System Ready!** 🚀
Refresh browser (Ctrl+F5) và test ngay!
