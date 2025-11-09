# Hướng dẫn Biên dịch và Chạy Emotion Detection

## Yêu cầu

1. **OpenCV 4.x** với module DNN
2. **C++ Compiler** (Visual Studio 2019/2022 hoặc MinGW-w64)
3. **CMake** (optional)
4. **Node.js** và **npm**
5. **MongoDB**

## Bước 1: Biên dịch C++ Emotion Detection

### Option A: Sử dụng Visual Studio (Khuyến nghị cho Windows)

1. Mở Developer Command Prompt for VS
2. Di chuyển đến thư mục Emotion-statistics:
```cmd
cd "C:\Users\Admin\OneDrive - VNU-HCMUS\Desktop\Ứng dụng thị giác máy tính\WEB\LoginAuthMERN_MVC\Emotion-statistics"
```

3. Biên dịch với cl:
```cmd
cl /EHsc /I"C:\opencv\build\include" main.cpp /link /LIBPATH:"C:\opencv\build\x64\vc16\lib" opencv_world4100.lib /OUT:main.exe
```

*Lưu ý: Thay đổi đường dẫn OpenCV phù hợp với hệ thống của bạn*

### Option B: Sử dụng g++ (MinGW)

```cmd
g++ -std=c++17 main.cpp -o main.exe `pkg-config --cflags --libs opencv4`
```

### Option C: Sử dụng CMake

1. Tạo file `CMakeLists.txt`:
```cmake
cmake_minimum_required(VERSION 3.10)
project(EmotionDetection)

set(CMAKE_CXX_STANDARD 17)

find_package(OpenCV REQUIRED)

add_executable(main main.cpp)

target_link_libraries(main ${OpenCV_LIBS})
```

2. Build:
```cmd
mkdir build
cd build
cmake ..
cmake --build . --config Release
```

## Bước 2: Kiểm tra File ONNX

Đảm bảo các file model có trong thư mục Emotion-statistics:
- ✅ `face_detection_yunet_2023mar_int8.onnx`
- ✅ `MobileNet_custom.onnx`

## Bước 3: Test C++ Application

Chạy trực tiếp:
```cmd
cd Emotion-statistics
main.exe
```

Bạn sẽ thấy:
- Cửa sổ OpenCV hiển thị webcam
- Face detection và emotion recognition realtime
- Log files được tạo trong thư mục `face_logs/`

Nhấn **ESC** để thoát.

## Bước 4: Cài đặt Backend Dependencies

```cmd
cd Backend
npm install
```

## Bước 5: Cài đặt Frontend Dependencies

```cmd
cd Frontend
npm install
```

## Bước 6: Chạy Hệ thống

### Terminal 1 - MongoDB
```cmd
mongod
```

### Terminal 2 - Backend
```cmd
cd Backend
npm run dev
```
hoặc
```cmd
node src/app.js
```

### Terminal 3 - Frontend
```cmd
cd Frontend
npm start
```

## Bước 7: Sử dụng

1. Mở browser: `http://localhost:3000`
2. Đăng nhập/Đăng ký
3. Vào Dashboard
4. Chọn **Camera 1 - Webcam - Emotion Detection**
5. Nhấn **"Bắt đầu"**
6. Cửa sổ OpenCV sẽ mở và hiển thị webcam
7. Kết quả emotion sẽ được cập nhật realtime trên web interface

## Cấu trúc Hoạt động

```
┌─────────────┐
│   Frontend  │ (React - Port 3000)
│  Dashboard  │
└──────┬──────┘
       │ HTTP Requests
       ↓
┌─────────────┐
│   Backend   │ (Node.js - Port 3001)
│  Express API│
└──────┬──────┘
       │ spawn()
       ↓
┌─────────────┐
│   C++ EXE   │ (OpenCV)
│  main.exe   │ → Webcam
│  YuNet + MN │ → Face Detection
│             │ → Emotion Recognition
└─────────────┘
       ↓
┌─────────────┐
│  face_logs/ │ (CSV Files)
│  ID0.csv    │
│  ID1.csv    │
└─────────────┘
```

## Troubleshooting

### Problem 1: OpenCV not found
**Solution:** Thêm OpenCV vào PATH hoặc copy `opencv_world4xx.dll` vào thư mục Emotion-statistics

### Problem 2: Cannot open webcam
**Solution:** 
- Kiểm tra webcam có hoạt động không
- Thay đổi `VideoCapture(0)` thành `VideoCapture(1)` trong main.cpp

### Problem 3: ONNX model not found
**Solution:** Đảm bảo file .onnx ở cùng thư mục với main.exe

### Problem 4: Backend cannot spawn process
**Solution:** 
- Kiểm tra đường dẫn đến main.exe
- Đảm bảo main.exe đã được biên dịch thành công
- Check permissions

## API Endpoints

### Camera Control
- `POST /api/camera/start` - Khởi động camera
- `POST /api/camera/stop` - Dừng camera
- `GET /api/camera/status` - Kiểm tra trạng thái
- `GET /api/camera/emotion-data` - Lấy dữ liệu emotion realtime
- `GET /api/camera/logs` - Lấy lịch sử emotion logs

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/getUserDetails` - Thông tin user

## Notes

- C++ process chạy độc lập, có cửa sổ riêng
- Frontend chỉ hiển thị kết quả, không stream video (để tránh overhead)
- Video stream hiển thị trong cửa sổ OpenCV native (hiệu suất tốt hơn)
- Dữ liệu emotion được polling từ backend mỗi giây
- Logs được lưu tự động trong `face_logs/` directory

## Tối ưu hóa

Để cải thiện hiệu suất:
1. Biên dịch với Release mode
2. Sử dụng GPU nếu có (CUDA)
3. Điều chỉnh `DETECT_INTERVAL` trong main.cpp
4. Giảm resolution nếu cần
