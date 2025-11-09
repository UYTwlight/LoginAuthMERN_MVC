# 🧪 Hướng Dẫn Tính Năng Kiểm Tra Mô Hình

## 📌 Tổng Quan
Tính năng cho phép Admin/Manager upload ảnh hoặc video để kiểm tra mô hình nhận diện cảm xúc mà không cần camera thật.

## 🚀 Cách Sử Dụng

### 1. Đăng Nhập
- Đăng nhập với tài khoản **Admin** hoặc **Manager**
- Chỉ các role này mới có quyền truy cập

### 2. Truy Cập Trang Kiểm Tra
- Click vào **"Kiểm tra mô hình"** trên thanh Navbar
- Hoặc truy cập: `http://localhost:3000/emotion-test`

### 3. Chọn Phương Thức Test

#### Option 1: Test với Camera Realtime 📷
1. Click nút **"Bật Camera"**
2. Cửa sổ OpenCV sẽ hiện lên
3. Nhận diện cảm xúc realtime
4. Nhấn ESC để thoát

#### Option 2: Upload File 📁
1. Click **"Chọn file..."**
2. Chọn ảnh hoặc video từ máy tính
   - **Ảnh**: .jpg, .jpeg, .png, .gif
   - **Video**: .mp4, .avi, .mov, .mkv
   - **Kích thước tối đa**: 100MB
3. Xem preview (nếu là ảnh)
4. Click **"Phân Tích"**
5. Đợi hệ thống xử lý (thời gian tùy thuộc kích thước file)

### 4. Xem Kết Quả

Sau khi xử lý xong, bạn sẽ thấy:

#### 📊 Tóm Tắt
- Tổng số khuôn mặt phát hiện
- Loại file (Ảnh/Video)

#### 📈 Biểu Đồ
- **Biểu đồ tròn**: Tỷ lệ % các cảm xúc
- **Biểu đồ cột**: So sánh phân bố cảm xúc

#### 👤 Chi Tiết Từng Khuôn Mặt
- ID người được phát hiện
- 5 cảm xúc với tỷ lệ %:
  - 😊 Happy (Vui vẻ)
  - 😢 Sad (Buồn)
  - 😮 Surprise (Ngạc nhiên)
  - 😠 Angry (Tức giận)
  - 🤢 Disgust (Ghê tởm)
- Số frame đã phân tích

## 🔧 Xử Lý Lỗi

### "Không tìm thấy kết quả"
- File không chứa khuôn mặt rõ ràng
- Thử với ảnh/video khác có khuôn mặt rõ hơn

### "main.exe không tồn tại"
- Chạy `build_main.bat` trong thư mục `Emotion-statistics`
- Đảm bảo build thành công

### "Lỗi khi xử lý file"
- Kiểm tra định dạng file có đúng không
- Đảm bảo file không bị lỗi
- Thử với file nhỏ hơn

### "Không thể kết nối đến server"
- Kiểm tra Backend đang chạy ở port 3001
- Restart Backend nếu cần

## 🎯 Tips
- **Ảnh tốt nhất**: Khuôn mặt rõ ràng, ánh sáng đủ, góc chụp thẳng
- **Video**: Độ phân giải cao hơn sẽ cho kết quả tốt hơn
- **Thời gian xử lý**: Video dài sẽ mất nhiều thời gian hơn
- **Nhiều khuôn mặt**: Hệ thống sẽ phân tích tất cả khuôn mặt trong frame

## 🎨 Cảm Xúc Được Nhận Diện
1. **Happy** - Vui vẻ, hạnh phúc
2. **Sad** - Buồn bã, không vui
3. **Surprise** - Ngạc nhiên, kinh ngạc
4. **Angry** - Tức giận, bực bội
5. **Disgust** - Ghê tởm, khó chịu

## 📂 Cấu Trúc Backend API

### POST `/api/emotion/analyze`
- Upload file và phân tích
- Yêu cầu: Token admin/manager
- Response: JSON với emotion data

### POST `/api/emotion/camera/start`
- Khởi động camera realtime
- Yêu cầu: Token admin/manager

## 🔐 Bảo Mật
- Chỉ Admin và Manager có quyền truy cập
- File upload tự động xóa sau khi xử lý
- CSV kết quả tự động xóa sau khi đọc
- Timeout 2 phút cho mỗi request

---

**Phát triển bởi**: Camera Analytics Team  
**Phiên bản**: 1.0.0
