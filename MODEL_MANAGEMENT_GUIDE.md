# 🧠 Hướng Dẫn Quản Lý Mô Hình AI

## Tổng Quan

Hệ thống quản lý mô hình AI cho phép Admin:
- Upload các mô hình emotion recognition mới (.onnx)
- Xem danh sách tất cả các mô hình đã upload
- Chọn mô hình để sử dụng cho camera detection
- Xóa các mô hình không cần thiết

## Cấu Trúc Hệ Thống

### Backend API Endpoints

#### 1. GET /api/models
- **Mô tả**: Lấy danh sách tất cả các mô hình
- **Quyền**: Admin/Manager
- **Response**:
```json
{
  "success": true,
  "models": [
    {
      "filename": "MobileNet_custom.onnx",
      "size": 12345678,
      "lastModified": "2025-11-09T12:00:00.000Z",
      "isActive": true
    }
  ],
  "activeModel": "MobileNet_custom.onnx"
}
```

#### 2. POST /api/models/upload
- **Mô tả**: Upload mô hình mới
- **Quyền**: Admin/Manager
- **Body**: FormData với file .onnx
- **Response**:
```json
{
  "success": true,
  "message": "Model uploaded successfully",
  "filename": "new_model.onnx",
  "size": 12345678
}
```

#### 3. POST /api/models/active
- **Mô tả**: Đặt mô hình làm active
- **Quyền**: Admin/Manager
- **Body**:
```json
{
  "modelName": "MobileNet_custom.onnx"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Active model updated successfully",
  "activeModel": "MobileNet_custom.onnx"
}
```

#### 4. DELETE /api/models/:modelName
- **Mô tả**: Xóa mô hình
- **Quyền**: Admin/Manager
- **Response**:
```json
{
  "success": true,
  "message": "Model deleted successfully"
}
```

### File Storage

- **Location**: `Emotion-statistics/` folder
- **Config File**: `Emotion-statistics/model_config.json`
- **Format**:
```json
{
  "activeModel": "MobileNet_custom.onnx",
  "lastUpdated": "2025-11-09T12:00:00.000Z"
}
```

### Frontend Components

- **Page**: `ModelManagement.js`
- **Route**: `/model`
- **Access**: Manager/Admin only

## Quy Trình Sử Dụng

### 1. Truy Cập Trang Quản Lý Mô Hình

1. Đăng nhập với tài khoản Manager/Admin
2. Click vào "Cấu hình mô hình" trong Navbar
3. Hệ thống hiển thị:
   - Mô hình đang sử dụng
   - Danh sách tất cả các mô hình
   - Form upload mô hình mới

### 2. Upload Mô Hình Mới

1. Click nút "📁 Chọn file .onnx"
2. Chọn file mô hình (.onnx) từ máy tính
3. Hệ thống hiển thị thông tin file: tên, kích thước
4. Click "✅ Upload Model"
5. File được upload và lưu vào `Emotion-statistics/`
6. Model xuất hiện trong danh sách

**Lưu ý:**
- Chỉ chấp nhận file .onnx
- Không được trùng tên với model đã tồn tại
- Giới hạn kích thước: 100MB

### 3. Thay Đổi Mô Hình Sử Dụng

1. Trong danh sách mô hình, click "⚡ Kích hoạt" trên model muốn dùng
2. Hệ thống hiển thị modal xác nhận:
   ```
   ⚠️ Xác nhận thay đổi model
   Bạn có chắc muốn chuyển sang sử dụng model: [tên_model]
   💡 Camera cần được khởi động lại để sử dụng model mới
   ```
3. Click "✅ Xác nhận"
4. Hệ thống:
   - Cập nhật `model_config.json`
   - Đánh dấu model mới là "ACTIVE"
   - Hiển thị thông báo thành công

5. **BẮT BUỘC**: Khởi động lại camera để áp dụng model mới
   - Vào trang "Dashboard Camera" hoặc "Kiểm tra mô hình"
   - Click "Dừng Camera" (nếu đang chạy)
   - Click "Bật Camera" để khởi động với model mới

### 4. Xóa Mô Hình

1. Trong danh sách mô hình, click "🗑️ Xóa" trên model muốn xóa
2. Xác nhận trong dialog
3. Mô hình bị xóa khỏi thư mục `Emotion-statistics/`

**Hạn chế:**
- Không thể xóa model đang được sử dụng
- Phải chọn model khác trước khi xóa model active

## Tích Hợp Với Camera

### Cách Camera Chọn Model

1. **Khi khởi động camera**:
   ```javascript
   // Frontend gửi request
   POST /api/camera/start
   {
     "modelPath": "optional - nếu không có thì đọc từ config",
     "cameraId": "0"
   }
   ```

2. **Backend đọc model**:
   ```javascript
   // Nếu modelPath không được chỉ định
   let modelPath = req.body.modelPath;
   if (!modelPath) {
     const config = readConfigFile('model_config.json');
     modelPath = config.activeModel || 'MobileNet_custom.onnx';
   }
   ```

3. **C++ sử dụng model**:
   ```bash
   main.exe [modelPath] [cameraId]
   # Ví dụ: main.exe MobileNet_custom.onnx 0
   ```

### Restart Camera Khi Đổi Model

**Cách 1: Manual (Recommended)**
1. Dừng camera hiện tại
2. Chọn model mới trong trang "Cấu hình mô hình"
3. Bật camera lại

**Cách 2: Tự động (Future Enhancement)**
- Backend có thể tự động restart camera process
- Cần implement WebSocket để thông báo realtime

## Xử Lý Lỗi

### Lỗi Upload

**"Model with this name already exists"**
- **Nguyên nhân**: File trùng tên
- **Giải pháp**: Đổi tên file hoặc xóa file cũ

**"Only .onnx files are allowed"**
- **Nguyên nhân**: Sai định dạng file
- **Giải pháp**: Chỉ upload file .onnx

**"File too large"**
- **Nguyên nhân**: File > 100MB
- **Giải pháp**: Nén model hoặc tăng limit trong server

### Lỗi Kích Hoạt Model

**"Model file not found"**
- **Nguyên nhân**: File không tồn tại
- **Giải pháp**: Upload lại model

**"Cannot delete active model"**
- **Nguyên nhân**: Đang cố xóa model đang dùng
- **Giải pháp**: Chọn model khác trước

### Lỗi Camera

**"Failed to load emotion model"**
- **Nguyên nhân**: Model file bị lỗi hoặc không tương thích
- **Giải pháp**: 
  1. Kiểm tra file .onnx hợp lệ
  2. Đảm bảo model tương thích với OpenCV DNN
  3. Kiểm tra dependencies (backbone.onnx, neckhead.onnx nếu cần)

## Testing

### Test Upload Model

```bash
# Using curl
curl -X POST http://localhost:3001/api/models/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "model=@path/to/your_model.onnx"
```

### Test Set Active Model

```bash
curl -X POST http://localhost:3001/api/models/active \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"modelName":"your_model.onnx"}'
```

### Test Get Models List

```bash
curl -X GET http://localhost:3001/api/models \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Best Practices

### 1. Naming Convention
- Sử dụng tên mô tả: `MobileNet_v2_emotion.onnx`
- Tránh ký tự đặc biệt, dấu cách
- Nên có version: `model_v1.0.onnx`

### 2. Backup
- Backup model_config.json định kỳ
- Lưu trữ models ở nơi an toàn
- Document thông tin về mỗi model

### 3. Testing
- Test model trên EmotionTest trước khi deploy
- Kiểm tra accuracy và performance
- Verify dependencies (backbone, neckhead)

### 4. Security
- Chỉ cho phép Admin/Manager upload
- Validate file type và size
- Scan virus trước khi lưu
- Rate limiting cho upload API

## Troubleshooting

### Model không hoạt động sau khi upload

1. **Kiểm tra file integrity**:
   ```bash
   # Check file size
   ls -lh Emotion-statistics/*.onnx
   
   # Verify ONNX format
   python -c "import onnx; model=onnx.load('your_model.onnx'); print('Valid!')"
   ```

2. **Kiểm tra permissions**:
   ```bash
   # Windows
   icacls Emotion-statistics\your_model.onnx
   ```

3. **Kiểm tra C++ có đọc được không**:
   ```bash
   cd Emotion-statistics
   .\main.exe your_model.onnx 0
   ```

### Config file bị lỗi

1. **Reset config**:
   ```json
   {
     "activeModel": "MobileNet_custom.onnx",
     "lastUpdated": "2025-11-09T00:00:00.000Z"
   }
   ```

2. **Restart backend**:
   ```bash
   cd Backend
   npm restart
   ```

## Future Enhancements

### Planned Features

1. **Model Versioning**
   - Lưu trữ nhiều phiên bản của cùng 1 model
   - Rollback về phiên bản trước

2. **Model Metrics**
   - Hiển thị accuracy, precision, recall
   - Benchmark performance

3. **Auto-restart Camera**
   - WebSocket notification
   - Graceful camera restart

4. **Model Comparison**
   - So sánh 2 models side-by-side
   - A/B testing

5. **Cloud Storage**
   - Upload models lên S3/Azure
   - Download on-demand

6. **Model Training**
   - Interface để train models mới
   - Dataset management

## Support

Nếu gặp vấn đề:
1. Kiểm tra logs: `Backend/logs/`
2. Xem C++ console output
3. Check network requests trong DevTools
4. Liên hệ: admin@example.com
