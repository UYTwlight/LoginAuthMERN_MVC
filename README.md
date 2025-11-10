# LoginAuthMERN_MVC - Camera Emotion Detection System

Hệ thống phát hiện và phân tích cảm xúc từ camera sử dụng MERN Stack (MongoDB, Express, React, Node.js) và C++ OpenCV.

## 📋 Yêu Cầu Hệ Thống

- **Node.js**: >= 16.x
- **npm**: >= 8.x
- **MongoDB**: >= 5.x (hoặc MongoDB Atlas)
- **Visual Studio 2019 hoặc 2022**: Community/Professional/Enterprise
- **OpenCV**: 4.10.0 (đã có sẵn trong `Emotion-statistics/opencv/`)
- **Windows**: 10/11 (64-bit)

---

## 🛠️ Cài Đặt Visual Studio

### Bước 1: Tải Visual Studio
1. Truy cập: https://visualstudio.microsoft.com/downloads/
2. Tải **Visual Studio 2022 Community** (miễn phí) hoặc phiên bản cao hơn

### Bước 2: Cài Đặt Workloads
Trong quá trình cài đặt, chọn các workload sau:

✅ **Desktop development with C++**
   - MSVC v142 hoặc v143 (C++ build tools)
   - Windows 10 SDK hoặc Windows 11 SDK
   - C++ CMake tools for Windows
   - C++ ATL for latest build tools

### Bước 3: Kiểm Tra Cài Đặt
Sau khi cài đặt xong:
```powershell
# Kiểm tra cl.exe (C++ compiler) đã có trong PATH
cl.exe
# Nếu không có, build_main.bat sẽ tự động tìm Visual Studio
```

### Bước 4: Build C++ Emotion Detection
```powershell
cd Emotion-statistics
.\build_main.bat
```

**Script sẽ tự động:**
- Tìm Visual Studio bằng `vswhere.exe`
- Load Developer Command Prompt
- Compile `main.cpp` với OpenCV
- Tạo `main.exe`

---

## ⚙️ Cấu Hình Environment Variables

### Backend `.env`

Tạo file `.env` trong thư mục `Backend/`:

```env
# Database Configuration
MONGO_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority"

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000

# JWT Secrets (Tạo chuỗi ngẫu nhiên phức tạp)
ACCESS_SECRET=<your-access-secret-key-here>
REFRESH_SECRET=<your-refresh-secret-key-here>

# API Configuration
API_HOST=localhost
API_PORT=3001
```

**Hướng dẫn:**
1. **MONGO_URL**: 
   - Nếu dùng MongoDB Atlas: Lấy connection string từ Atlas Dashboard
   - Nếu dùng MongoDB local: `mongodb://localhost:27017/emotion-detection`
   
2. **JWT Secrets**: 
   - Tạo chuỗi ngẫu nhiên mạnh (ít nhất 32 ký tự)
   - Có thể dùng: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

3. **PORT**: Cổng Backend (mặc định 3001)

4. **FRONTEND_URL**: URL của Frontend để cấu hình CORS

### Frontend `.env`

Tạo file `.env` trong thư mục `Frontend/`:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3001
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

**Hướng dẫn:**
- `REACT_APP_API_URL`: URL đầy đủ của Backend server
- `REACT_APP_API_BASE_URL`: Base URL cho các API endpoints

**Lưu ý**: Mọi biến môi trường trong React phải bắt đầu với `REACT_APP_`

---

## 📦 Cài Đặt Dependencies

### 1. Cài Đặt Root Dependencies
```powershell
# Từ thư mục gốc
npm install
```

### 2. Cài Đặt Backend Dependencies
```powershell
cd Backend
npm install
```

**Các package chính:**
- `express`: Web framework
- `mongoose`: MongoDB ODM
- `jsonwebtoken`: JWT authentication
- `bcryptjs`: Password hashing
- `cors`: CORS middleware
- `multer`: File upload
- `dotenv`: Environment variables

### 3. Cài Đặt Frontend Dependencies
```powershell
cd Frontend
npm install
```

**Các package chính:**
- `react`: UI library
- `react-router-dom`: Routing
- `axios`: HTTP client
- `recharts`: Data visualization
- `react-hook-form`: Form handling

### 4. Quay Về Thư Mục Gốc
```powershell
cd ..
```

---

## 🚀 Chạy Ứng Dụng

### Phương Án 1: Chạy Tất Cả Cùng Lúc (Khuyến Nghị)

```powershell
# Từ thư mục gốc
.\start-all.bat
```

**Script sẽ tự động:**
1. Khởi động Backend server (port 3001)
2. Khởi động Frontend development server (port 3000)
3. Mở 2 cửa sổ terminal riêng biệt

**Truy cập ứng dụng:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

### Phương Án 2: Chạy Từng Service

**Terminal 1 - Backend:**
```powershell
cd Backend
npm start
# Hoặc: npm run dev (nodemon - auto restart)
```

**Terminal 2 - Frontend:**
```powershell
cd Frontend
npm start
```

### Dừng Ứng Dụng

```powershell
# Từ thư mục gốc
.\stop-all.bat
```

Hoặc:
- Nhấn `Ctrl + C` trong mỗi terminal
- Đóng các cửa sổ terminal

---

## 📁 Cấu Trúc Thư Mục

```
LoginAuthMERN_MVC/
├── Backend/
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation
│   │   ├── config/         # Database config
│   │   └── app.js          # Express app
│   ├── .env                # Backend environment variables
│   └── package.json
│
├── Frontend/
│   ├── src/
│   │   ├── Components/     # React components
│   │   │   ├── Auth/       # Login, Register
│   │   │   ├── Dashboard/  # Main dashboard
│   │   │   ├── Camera/     # Camera view
│   │   │   ├── Reports/    # Analytics reports
│   │   │   └── UserManagement/
│   │   ├── utils/          # API utilities
│   │   └── App.js
│   ├── .env                # Frontend environment variables
│   └── package.json
│
├── Emotion-statistics/
│   ├── main.cpp            # C++ emotion detection
│   ├── build_main.bat      # Build script
│   ├── run_main.bat        # Run script
│   ├── *.onnx              # AI models
│   ├── opencv/             # OpenCV library
│   └── face_logs/          # Detection results
│
├── start-all.bat           # Start all services
├── stop-all.bat            # Stop all services
└── package.json
```

---

## 🎯 Workflow Sử Dụng

### 1. Đăng Nhập
- Truy cập: http://localhost:3000
- Đăng nhập với tài khoản:
  - **Admin**: Quản lý toàn bộ hệ thống
  - **User**: Chỉ xem reports của chính mình

### 2. Chạy Camera Detection
1. Vào **Dashboard Camera**
2. Chọn camera hoặc upload file
3. Nhấn **Start** để bắt đầu phát hiện
4. C++ app sẽ:
   - Phát hiện khuôn mặt
   - Phân tích cảm xúc real-time
   - Lưu dữ liệu vào MongoDB
   - Lưu logs vào `Emotion-statistics/face_logs/`

### 3. Xem Báo Cáo
1. Vào **Báo cáo tổng quan**
2. Chọn session muốn xem
3. Phân tích:
   - Biểu đồ tròn: Phân bố cảm xúc
   - Biểu đồ cột: So sánh khuôn mặt
   - Biểu đồ đường: Timeline cảm xúc theo frame

---

## 🔐 Phân Quyền

### Admin
- ✅ Xem tất cả reports (mọi user)
- ✅ Quản lý users
- ✅ Quản lý models
- ✅ Upload file phân tích
- ✅ Session không giới hạn thời gian

### User
- ✅ Xem reports của chính mình
- ✅ Chạy camera detection
- ❌ Không xem được reports của users khác
- ⏱️ Session timeout: 30 phút không hoạt động

---

## 🐛 Troubleshooting

### Lỗi Build C++
```
Error: Cannot find Visual Studio
```
**Giải pháp:**
- Cài đặt Visual Studio 2019/2022 với C++ workload
- Script sẽ tự động tìm VS qua `vswhere.exe`

### Lỗi MongoDB Connection
```
MongoServerError: Authentication failed
```
**Giải pháp:**
- Kiểm tra `MONGO_URL` trong `Backend/.env`
- Đảm bảo username/password đúng
- Nếu dùng Atlas: Whitelist IP address

### Lỗi Port Already In Use
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Giải pháp:**
```powershell
# Tìm process đang dùng port
netstat -ano | findstr :3001

# Kill process (thay <PID> bằng Process ID)
taskkill /PID <PID> /F
```

### Frontend Không Kết Nối Backend
```
Network Error
```
**Giải pháp:**
- Kiểm tra Backend đang chạy: http://localhost:3001/api
- Kiểm tra `REACT_APP_API_URL` trong `Frontend/.env`
- Xóa cache: `npm start` lại Frontend

### C++ App Không Gửi Data Lên API
**Giải pháp:**
- Kiểm tra Backend đang chạy
- Xem console log của C++ app
- Kiểm tra `API_HOST` và `API_PORT` trong main.cpp

---

## 📝 Scripts Có Sẵn

### Root Level
- `npm start`: Chạy cả Backend và Frontend
- `.\start-all.bat`: Chạy tất cả services (Windows)
- `.\stop-all.bat`: Dừng tất cả services (Windows)

### Backend
- `npm start`: Chạy production mode
- `npm run dev`: Chạy development mode (nodemon)

### Frontend
- `npm start`: Chạy development server
- `npm run build`: Build production
- `npm test`: Chạy tests

### Emotion-statistics
- `.\build_main.bat`: Build C++ app
- `.\run_main.bat`: Chạy C++ app với model mặc định

---

## 🔄 Git Workflow

### Clone Repository
```bash
git clone https://github.com/UYTwlight/LoginAuthMERN_MVC.git
cd LoginAuthMERN_MVC
```

### Tạo Branch Mới
```bash
git checkout -b feature/your-feature-name
```

### Commit Changes
```bash
git add .
git commit -m "Description of changes"
git push origin feature/your-feature-name
```

---

## 📞 Support

Nếu gặp vấn đề, hãy:
1. Kiểm tra phần **Troubleshooting** ở trên
2. Xem logs trong console (Backend/Frontend/C++)
3. Tạo issue trên GitHub repository

---


---

## 👥 Contributors

- **UYTwlight** - Initial work and maintenance
- **KienHCMUS** - Train model
- **ldhv-04** - run C++ code

---

**Cập nhật lần cuối:** November 10, 2025
