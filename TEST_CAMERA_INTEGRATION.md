# Test Camera Integration - Hướng dẫn kiểm tra tích hợp

## ✅ Checklist trước khi test

### 1. Kiểm tra các file cần thiết

```powershell
# Check Backend files
cd Backend
ls src/controllers/CameraController.js
ls src/routes/CameraRoutes.js

# Check Frontend files  
cd ../Frontend
ls src/Components/Camera/CameraView.js

# Check C++ executable
cd ../Emotion-statistics
ls main.exe
ls MobileNet_custom.onnx
ls face_detection_yunet_2023mar_int8.onnx
```

### 2. Kiểm tra dependencies

```powershell
# Backend dependencies
cd Backend
npm list express mongoose jsonwebtoken cors

# Frontend dependencies
cd ../Frontend
npm list react react-router-dom axios
```

## 🚀 Test từng phần

### Test 1: C++ Standalone (Không cần Backend/Frontend)

```powershell
cd Emotion-statistics
$env:PATH += ";$PWD\opencv\build\x64\vc16\bin"
.\main.exe
```

**Expected**: 
- Cửa sổ OpenCV hiện ra
- Camera mở
- Faces được detect (box màu xanh)
- Emotions hiển thị
- Press ESC để thoát

**Status**: ✅ / ❌

---

### Test 2: Backend API (Không cần Frontend)

#### 2.1. Start Backend

Terminal 1:
```powershell
cd Backend
node src/app.js
```

**Expected Output**:
```
Server is running on http://localhost:3001
Connected to MongoDB
```

**Status**: ✅ / ❌

#### 2.2. Test với curl/Postman

**Get Status** (No auth required for testing):
```powershell
# Method 1: Using curl
curl http://localhost:3001/api/camera/status

# Method 2: Using PowerShell
Invoke-WebRequest -Uri "http://localhost:3001/api/camera/status" -Method GET
```

**Expected Response**:
```json
{
  "status": "inactive",
  "isRunning": false,
  "message": "Camera is stopped"
}
```

**Start Camera** (Needs authentication token):

First, get a token by logging in. For testing, you can modify the route temporarily or use an existing token.

**Status**: ✅ / ❌

---

### Test 3: Full Integration (Backend + Frontend)

#### 3.1. Start Backend

Terminal 1:
```powershell
cd Backend
node src/app.js
```

#### 3.2. Start Frontend

Terminal 2:
```powershell
cd Frontend
npm start
```

**Expected**: Browser opens at http://localhost:3000

**Status**: ✅ / ❌

#### 3.3. Login

1. Go to http://localhost:3000
2. Click "Login"
3. Enter credentials:
   - Email: (your registered email)
   - Password: (your password)
4. Should redirect to Dashboard/Home

**Status**: ✅ / ❌

#### 3.4. Test Camera Page

1. Navigate to Camera page (in sidebar/menu)
2. Should see:
   - Title: "Camera 1 - Webcam (Emotion Detection)"
   - Model selector: "MobileNet Custom (Default)"
   - Camera selector: "Camera 0 (Default)"
   - Button: "▶ Bắt đầu"

**Status**: ✅ / ❌

#### 3.5. Start Camera Detection

1. Click "▶ Bắt đầu" button
2. Should see:
   - Button changes to "⏹ Dừng"
   - Status changes to "🟢 Đang chạy"
   - **OpenCV window opens showing camera feed**
   - Faces detected with bounding boxes
   - Emotions displayed on each face
3. Wait 5-10 seconds for data to accumulate

**Status**: ✅ / ❌

#### 3.6. Check Emotion Data

1. Web page should update with emotion statistics
2. Should see cards showing emotion percentages
3. Average emotions displayed

**Status**: ✅ / ❌

#### 3.7. Stop Camera

1. Click "⏹ Dừng" button
2. OpenCV window should close
3. Status changes to "🔴 Dừng"

**Status**: ✅ / ❌

#### 3.8. Check Logs

1. Click "📊 Xem Logs" button
2. Should see list of detected faces (ID0, ID1, etc.)
3. Each face shows:
   - Face ID
   - Number of frames
   - Emotion data

**Status**: ✅ / ❌

---

## 🐛 Troubleshooting

### Issue: "Port 3001 already in use"

**Solution**:
```powershell
# Find and kill the process
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or restart Backend
```

### Issue: "Cannot connect to MongoDB"

**Check**:
- MongoDB connection string in `.env`
- Internet connection
- MongoDB cluster is running

**Solution**:
```powershell
# Test connection
cd Backend
node -e "import('./src/config/db.js').then(m => m.default())"
```

### Issue: "main.exe not found"

**Solution**:
```powershell
cd Emotion-statistics
.\build_main.bat
```

### Issue: "Camera won't open"

**Check**:
- Camera not in use by another app
- Try different camera ID (0, 1, 2)
- Check Windows camera permissions

**Solution**:
```powershell
# Test directly
cd Emotion-statistics
$env:PATH += ";$PWD\opencv\build\x64\vc16\bin"
.\main.exe MobileNet_custom.onnx 1  # Try camera 1
```

### Issue: "OpenCV window doesn't appear"

**Check**:
- Backend console for errors
- Terminal output for C++ process
- Check if process is running:
```powershell
Get-Process | Where-Object {$_.ProcessName -eq "main"}
```

### Issue: "No emotion data showing"

**Check**:
- Wait 5-10 seconds for data
- Check if faces detected (need faces in camera view)
- Check CSV files:
```powershell
cd Emotion-statistics/face_logs
ls
cat output.csv
```

### Issue: "Authentication failed"

**Check**:
- Logged in correctly
- Token in localStorage: Check browser DevTools > Application > Local Storage
- Token should be under key `accessToken`

---

## 📊 Success Criteria

All these should work:

- [x] Backend starts without errors (port 3001)
- [x] Frontend starts without errors (port 3000)
- [x] Login successful
- [x] Camera page loads
- [x] Model selector shows options
- [x] Camera selector shows options
- [x] "Bắt đầu" button works
- [x] OpenCV window opens
- [x] Faces detected in OpenCV window
- [x] Emotions displayed in OpenCV window
- [x] Emotion data appears on web page
- [x] "Dừng" button works
- [x] OpenCV window closes
- [x] Logs button works and shows data
- [x] CSV files created in face_logs/

---

## 🎯 Complete Test Flow

```
1. Start Backend (port 3001) ✓
2. Start Frontend (port 3000) ✓
3. Login to web app ✓
4. Go to Camera page ✓
5. Select model: MobileNet Custom ✓
6. Select camera: Camera 0 ✓
7. Click "Bắt đầu" ✓
8. OpenCV window appears ✓
9. Face detection working ✓
10. Emotions displayed ✓
11. Web page shows statistics ✓
12. Click "Dừng" ✓
13. OpenCV window closes ✓
14. Check logs ✓
15. Verify CSV files ✓
```

---

## 📝 Notes

- **YuNet model**: Fixed, không thay đổi (face detection)
- **MobileNet model**: Có thể thay đổi (emotion classification)
- **Default camera**: Camera 0
- **Data location**: `Emotion-statistics/face_logs/`
- **OpenCV window**: Shows live detection (press ESC to close manually)
- **Web interface**: Shows aggregated statistics

---

## 🔧 Quick Commands Reference

```powershell
# Start everything
# Terminal 1
cd Backend && node src/app.js

# Terminal 2  
cd Frontend && npm start

# Test C++ directly
cd Emotion-statistics
$env:PATH += ";$PWD\opencv\build\x64\vc16\bin"
.\main.exe

# Rebuild C++
cd Emotion-statistics
.\build_main.bat

# Check logs
cd Emotion-statistics/face_logs
cat output.csv

# Kill processes
taskkill /IM node.exe /F
taskkill /IM main.exe /F
```

---

**Last Updated**: November 7, 2025
**Status**: Ready for testing 🧪
