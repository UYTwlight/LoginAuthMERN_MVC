#include <iostream>
#include <vector>
#include <string>
#include <map>
#include <fstream>
#include <filesystem>
#include <chrono>
#include <ctime>
#include <sstream>
#include <opencv2/opencv.hpp>
#include <opencv2/dnn.hpp>
#include <opencv2/video/tracking.hpp>
#include <vector>
#include "include/httplib.h"

using namespace cv;
using namespace cv::dnn;

#define DETECT_INTERVAL 10 // Cứ 10 frame thì chạy detect lại
#define IOU_THRESHOLD 0.4  // Ngưỡng IoU để gán detection cho tracker
#define EMO_W 64           // Chiều rộng input cho MobileNet
#define EMO_H 64           // Chiều cao input cho MobileNet
const std::string LOG_ROOT = "face_logs"; // Thư mục gốc để lưu trữ
const std::string API_HOST = "localhost";
const int API_PORT = 3001; // Backend port
const bool ENABLE_API_SYNC = true; // Set false để tắt đồng bộ API

double calculateIoU(const Rect2d& rect1, const Rect2d& rect2) {
    Rect intersection = rect1 & rect2;
    double area_i = intersection.area();
    double area_u = rect1.area() + rect2.area() - area_i;
    if (area_u > 0) return area_i / area_u;
    return 0.0;
}

// ============== API Helper Functions ==============
std::string createSession(const std::string& sessionName, const std::string& sourceType, const std::string& sourceId) {
    if (!ENABLE_API_SYNC) return "";
    
    try {
        httplib::Client cli(API_HOST, API_PORT);
        cli.set_connection_timeout(0, 300000); // 300ms
        cli.set_read_timeout(5, 0); // 5 seconds
        
        std::string jsonBody = "{\"sessionName\":\"" + sessionName + 
                               "\",\"sourceType\":\"" + sourceType + 
                               "\",\"sourceId\":\"" + sourceId + "\"}";
        
        auto res = cli.Post("/api/emotions/sessions", jsonBody, "application/json");
        
        if (res && res->status == 201) {
            // Parse response để lấy sessionId
            std::string body = res->body;
            size_t idPos = body.find("\"_id\":\"");
            if (idPos != std::string::npos) {
                size_t start = idPos + 7;
                size_t end = body.find("\"", start);
                if (end != std::string::npos) {
                    std::string sessionId = body.substr(start, end - start);
                    std::cout << "[API] Session created: " << sessionId << std::endl;
                    return sessionId;
                }
            }
        } else {
            std::cerr << "[API] Failed to create session. Status: " << (res ? res->status : 0) << std::endl;
        }
    } catch (const std::exception& e) {
        std::cerr << "[API] Error creating session: " << e.what() << std::endl;
    }
    return "";
}

void sendEmotionBatch(const std::string& sessionId, const std::vector<std::map<std::string, std::string>>& records) {
    if (!ENABLE_API_SYNC || sessionId.empty() || records.empty()) return;
    
    try {
        httplib::Client cli(API_HOST, API_PORT);
        cli.set_connection_timeout(0, 300000);
        cli.set_read_timeout(10, 0);
        
        // Build JSON array
        std::stringstream ss;
        ss << "{\"sessionId\":\"" << sessionId << "\",\"emotionRecords\":[";
        
        for (size_t i = 0; i < records.size(); i++) {
            if (i > 0) ss << ",";
            const auto& rec = records[i];
            ss << "{\"faceId\":\"" << rec.at("faceId") << "\","
               << "\"frameNumber\":" << rec.at("frameNumber") << ","
               << "\"emotions\":{"
               << "\"happy\":" << rec.at("happy") << ","
               << "\"sad\":" << rec.at("sad") << ","
               << "\"surprise\":" << rec.at("surprise") << ","
               << "\"angry\":" << rec.at("angry") << ","
               << "\"disgust\":" << rec.at("disgust")
               << "}}";
        }
        ss << "]}";
        
        auto res = cli.Post("/api/emotions/emotions", ss.str(), "application/json");
        
        if (res && res->status == 201) {
            std::cout << "[API] Sent " << records.size() << " emotion records" << std::endl;
        } else {
            std::cerr << "[API] Failed to send emotions. Status: " << (res ? res->status : 0) << std::endl;
        }
    } catch (const std::exception& e) {
        std::cerr << "[API] Error sending emotions: " << e.what() << std::endl;
    }
}

void updateSessionStatus(const std::string& sessionId, const std::string& status) {
    if (!ENABLE_API_SYNC || sessionId.empty()) return;
    
    try {
        httplib::Client cli(API_HOST, API_PORT);
        cli.set_connection_timeout(0, 300000);
        cli.set_read_timeout(5, 0);
        
        std::string jsonBody = "{\"status\":\"" + status + "\"}";
        std::string path = "/api/emotions/sessions/" + sessionId + "/status";
        
        auto res = cli.Patch(path.c_str(), jsonBody, "application/json");
        
        if (res && res->status == 200) {
            std::cout << "[API] Session status updated to: " << status << std::endl;
        }
    } catch (const std::exception& e) {
        std::cerr << "[API] Error updating session: " << e.what() << std::endl;
    }
}

void calculateStatistics(const std::string& sessionId, const std::string& faceId) {
    if (!ENABLE_API_SYNC || sessionId.empty()) return;
    
    try {
        httplib::Client cli(API_HOST, API_PORT);
        cli.set_connection_timeout(0, 300000);
        cli.set_read_timeout(10, 0);
        
        std::string path = "/api/emotions/statistics/" + sessionId + "/" + faceId + "/calculate";
        
        auto res = cli.Post(path.c_str(), "", "application/json");
        
        if (res && res->status == 200) {
            std::cout << "[API] Statistics calculated for " << faceId << std::endl;
        }
    } catch (const std::exception& e) {
        std::cerr << "[API] Error calculating statistics: " << e.what() << std::endl;
    }
}

// Tạo face log session trong MongoDB
std::string createFaceLogSession(const std::string& sessionId, const std::string& source, 
                                  const std::string& sourceType, const std::string& timestamp,
                                  const std::string& directoryPath) {
    if (!ENABLE_API_SYNC) return "";
    
    try {
        httplib::Client cli(API_HOST, API_PORT);
        cli.set_connection_timeout(0, 300000);
        cli.set_read_timeout(5, 0);
        
        std::ostringstream ss;
        ss << "{"
           << "\"sessionId\":\"" << sessionId << "\","
           << "\"source\":\"" << source << "\","
           << "\"sourceType\":\"" << sourceType << "\","
           << "\"timestamp\":\"" << timestamp << "\","
           << "\"directoryPath\":\"" << directoryPath << "\""
           << "}";
        
        auto res = cli.Post("/api/emotions/face-logs/sessions", ss.str(), "application/json");
        
        if (res && (res->status == 200 || res->status == 201)) {
            std::cout << "[API] Face log session created in MongoDB: " << sessionId << std::endl;
            return sessionId;
        } else {
            std::cerr << "[API] Failed to create face log session. Status: " << (res ? res->status : 0) << std::endl;
        }
    } catch (const std::exception& e) {
        std::cerr << "[API] Error creating face log session: " << e.what() << std::endl;
    }
    return "";
}

// Cập nhật face log session (thêm faceId, cập nhật status, faceCount)
void updateFaceLogSession(const std::string& sessionId, const std::vector<std::string>& faceIds,
                          const std::string& status = "") {
    if (!ENABLE_API_SYNC || sessionId.empty()) return;
    
    try {
        httplib::Client cli(API_HOST, API_PORT);
        cli.set_connection_timeout(0, 300000);
        cli.set_read_timeout(5, 0);
        
        std::ostringstream ss;
        ss << "{";
        
        if (!faceIds.empty()) {
            ss << "\"faceIds\":[";
            for (size_t i = 0; i < faceIds.size(); i++) {
                ss << "\"" << faceIds[i] << "\"";
                if (i < faceIds.size() - 1) ss << ",";
            }
            ss << "],";
            ss << "\"faceCount\":" << faceIds.size();
        }
        
        if (!status.empty()) {
            if (!faceIds.empty()) ss << ",";
            ss << "\"status\":\"" << status << "\"";
        }
        
        ss << "}";
        
        std::string path = "/api/emotions/face-logs/sessions/" + sessionId;
        auto res = cli.Patch(path.c_str(), ss.str(), "application/json");
        
        if (res && res->status == 200) {
            std::cout << "[API] Face log session updated" << std::endl;
        }
    } catch (const std::exception& e) {
        std::cerr << "[API] Error updating face log session: " << e.what() << std::endl;
    }
}

int main(int argc, char** argv) {
    try {
        std::cout << "==========================================" << std::endl;
        std::cout << "  Emotion Detection System" << std::endl;
        std::cout << "==========================================" << std::endl;
        
        // Parse command line arguments
        std::string emotionModelPath = "MobileNet_custom.onnx"; // Default
        std::string videoSource = "0"; // Default: webcam 0
        bool headless = false; // Run without display window
        
        if (argc > 1) {
            emotionModelPath = argv[1];
        }
        if (argc > 2) {
            videoSource = argv[2];
        }
        if (argc > 3 && std::string(argv[3]) == "--headless") {
            headless = true;
            std::cout << "Running in HEADLESS mode (no display window)" << std::endl;
        }
        
        std::cout << "Emotion Model: " << emotionModelPath << std::endl;
        std::cout << "Video Source: " << videoSource << std::endl;
        std::cout << "==========================================" << std::endl;
        
        // 0. Khởi tạo thư mục gốc
        std::cout << "Creating log directory..." << std::endl;
        if (!std::filesystem::exists(LOG_ROOT)) {
            if (std::filesystem::create_directories(LOG_ROOT)) {
                std::cout << "Created root log folder: " << LOG_ROOT << std::endl;
            } else {
                std::cerr << "Can't create root folder " << LOG_ROOT << std::endl;
                return -1;
            }
        } else {
            std::cout << "Root log folder exists: " << LOG_ROOT << std::endl;
        }
        
        // Tạo thư mục con cho video/camera này
        std::string videoName;
        try {
            int cameraId = std::stoi(videoSource);
            videoName = "Camera_" + std::to_string(cameraId);
        } catch (...) {
            // Nếu là file video, lấy tên file (không có extension)
            std::filesystem::path videoPath(videoSource);
            videoName = videoPath.stem().string();
            // Thay thế các ký tự không hợp lệ trong tên thư mục
            for (char& c : videoName) {
                if (c == ' ' || c == '/' || c == '\\' || c == ':') c = '_';
            }
        }
        
        // Thêm timestamp để phân biệt các lần chạy khác nhau
        auto now = std::chrono::system_clock::now();
        auto time_t_now = std::chrono::system_clock::to_time_t(now);
        std::tm tm_now;
        localtime_s(&tm_now, &time_t_now);
        char timestamp[64];
        std::strftime(timestamp, sizeof(timestamp), "%Y%m%d_%H%M%S", &tm_now);
        
        std::string LOG_DIR = LOG_ROOT + "/" + videoName + "_" + timestamp;
        
        if (std::filesystem::create_directories(LOG_DIR)) {
            std::cout << "Created session folder: " << LOG_DIR << std::endl;
        } else {
            std::cerr << "Can't create session folder " << LOG_DIR << std::endl;
            return -1;
        }

        // Xác định source type và source id
        std::string sessionName = videoName + "_" + timestamp;
        std::string sessionId = sessionName; // sessionId = tên thư mục
        std::string sourceType;
        std::string sourceId;
        
        try {
            int cameraId = std::stoi(videoSource);
            sourceType = "camera";
            sourceId = std::to_string(cameraId);
        } catch (...) {
            sourceType = "video";
            sourceId = videoSource;
        }
        
        // Tạo face log session trong MongoDB
        std::string faceLogSessionId = "";
        if (ENABLE_API_SYNC) {
            std::cout << "Creating face log session in MongoDB..." << std::endl;
            faceLogSessionId = createFaceLogSession(
                sessionId,          // sessionId (tên thư mục)
                videoName,          // source (Camera_0, video_name, etc.)
                sourceType,         // camera hoặc video
                std::string(timestamp), // timestamp string
                LOG_DIR             // đường dẫn tuyệt đối
            );
        }

        // Tạo session trong database (old API - giữ lại để tương thích)
        std::string dbSessionId = createSession(sessionName, sourceType, sourceId);
        if (!dbSessionId.empty()) {
            std::cout << "Database session ID: " << dbSessionId << std::endl;
        }
        
        // Buffer để lưu emotion records trước khi gửi batch lên API
        std::vector<std::map<std::string, std::string>> emotionBatchBuffer;
        const int BATCH_SIZE = 50; // Gửi mỗi 50 records


        // 1. Cấu hình YuNet
        const int inputW = 640;
        const int inputH = 480;
        
        std::cout << "Loading YuNet model..." << std::endl;
        Ptr<cv::FaceDetectorYN> detector;
        try {
            detector = cv::FaceDetectorYN::create(
                "face_detection_yunet_2023mar_int8.onnx", "",
                Size(inputW, inputH), 0.78f, 0.3f, 50
                // 0.78f: ngưỡng tin cậy, chỉ lấy những dự đoán có điểm tin cậy > ngưỡng
                // 0.3f: ngưỡng IoU dùng trong lọc NMS
                // 50: chỉ lấy tối đa 50 dự đoán sau 2 bước lọc trên
            );
        } catch (const std::exception& e) {
            std::cerr << "Exception while creating FaceDetectorYN: " << e.what() << std::endl;
            return -1;
        }
        
        if (!detector) {
            std::cerr << "Can't create FaceDetectorYN. Check ONNX model directory." << std::endl;
            return -1;
        }
        std::cout << "YuNet model loaded successfully!" << std::endl;

        // 2. Cấu hình MobileNet Emotion Model
        std::cout << "Loading MobileNet emotion model..." << std::endl;
        Net emotionNet;
        bool emotionModelLoaded = false;
        try {
            emotionNet = readNetFromONNX(emotionModelPath);
            if (!emotionNet.empty()) {
                emotionModelLoaded = true;
                std::cout << "MobileNet emotion model loaded successfully!" << std::endl;
            } else {
                std::cerr << "WARNING: MobileNet model is empty. Continuing without emotion recognition." << std::endl;
            }
        } catch (const std::exception& e) {
            std::cerr << "WARNING: Failed to load emotion model: " << e.what() << std::endl;
            std::cerr << "NOTE: MobileNet_custom.onnx requires 'backbone.onnx' and 'neckhead.onnx' files in the same directory." << std::endl;
            std::cerr << "Please place required files next to MobileNet_custom.onnx" << std::endl;
            std::cerr << "Continuing with face detection only..." << std::endl;
        }
    std::vector<std::string> emotion_labels = { "Happy", "Sad", "Surprise", "Angry", "Disgust" };
    int num_frame = emotion_labels.size();

    // 3. Mở video source (camera hoặc file)
    VideoCapture cap;
    
    // Kiểm tra xem videoSource là số (camera ID) hay đường dẫn file
    bool isCamera = true;
    try {
        int cameraId = std::stoi(videoSource);
        std::cout << "Opening camera ID: " << cameraId << std::endl;
        cap.open(cameraId);
    } catch (...) {
        // Nếu không phải số, coi là đường dẫn file
        std::cout << "Opening video file: " << videoSource << std::endl;
        cap.open(videoSource);
        isCamera = false;
    }
    
    if (!cap.isOpened()) {
        std::cerr << "ERROR: Can't open video source: " << videoSource << std::endl;
        return -1;
    }
    
    std::cout << "Video source opened successfully!" << std::endl;
    
    // Set camera properties (chỉ cho camera, không dùng cho file)
    if (isCamera) {
        cap.set(CAP_PROP_FRAME_WIDTH, inputW);
        cap.set(CAP_PROP_FRAME_HEIGHT, inputH);
    }
    
    std::cout << "Video properties:" << std::endl;
    std::cout << "- Frame width: " << cap.get(CAP_PROP_FRAME_WIDTH) << std::endl;
    std::cout << "- Frame height: " << cap.get(CAP_PROP_FRAME_HEIGHT) << std::endl;
    std::cout << "- FPS: " << cap.get(CAP_PROP_FPS) << std::endl;
    std::cout << "- Total frames: " << cap.get(CAP_PROP_FRAME_COUNT) << " (0 for camera)" << std::endl;
    std::cout << "==========================================" << std::endl;
    
    Mat frame, img;
    int frame_count = 0;
    long next_face_id = 0;
    std::map<long, std::pair<Ptr<Tracker>, Rect2d>> active_trackers;

    std::map<long, std::ofstream> emotion_logs; // Map để giữ các luồng file CSV đang mở
    // Vector 2D để lưu cảm xúc trung bình của mỗi người (mỗi ID), định dạng: [[Happy, ..., Disgust, Num_frame],...]
    std::vector<std::vector<float>> average;
    
    // Tạo cửa sổ hiển thị (chỉ khi không ở chế độ headless)
    std::string windowName = "YuNet Detection + Tracking Nano + MobileNet classification";
    if (!headless) {
        namedWindow(windowName, WINDOW_AUTOSIZE);
        std::cout << "Created display window: " << windowName << std::endl;
        std::cout << "Press ESC to exit." << std::endl;
    } else {
        std::cout << "Running without display window (headless mode)" << std::endl;
        std::cout << "Processing video..." << std::endl;
    }
    
    std::cout << "Start YuNet Detection and Tracking." << std::endl;

    while (true) {
        bool ret = cap.read(frame);
        if (!ret || frame.empty()) {
            std::cerr << "Failed to read frame from camera!" << std::endl;
            break;
        }
        
        std::cout << "Original frame size: " << frame.size() << std::endl;
        
        // Always ensure we have a display frame (copy of original)
        Mat displayFrame = frame.clone();
        
        try {
            // Resize both frame and displayFrame để coordinates match
            resize(frame, frame, Size(inputW, inputH), 0, 0, INTER_AREA);
            resize(displayFrame, displayFrame, Size(inputW, inputH), 0, 0, INTER_AREA);
            std::cout << "Frame resized to: " << frame.size() << std::endl;

            // 4. Phát hiện khuôn mặt bằng YuNet định kỳ
            if (frame_count % DETECT_INTERVAL == 0 || active_trackers.empty()) {
                std::cout << "Running face detection..." << std::endl;
                Mat faces;
                detector->detect(frame, faces);
                std::cout << "Face detection completed. Found " << faces.rows << " faces." << std::endl;
            std::vector<Rect2d> current_detections;
            if (!faces.empty()) {
                for (int i = 0; i < faces.rows; i++) {
                    float x = faces.at<float>(i, 0);
                    float y = faces.at<float>(i, 1);
                    float w = faces.at<float>(i, 2);
                    float h = faces.at<float>(i, 3);
                    current_detections.emplace_back(x, y, w, h);
                    
                    // Draw detection rectangles on displayFrame for immediate feedback
                    rectangle(displayFrame, Rect(x, y, w, h), Scalar(255, 0, 0), 2);
                    putText(displayFrame, "Detected", Point(x, y - 10), FONT_HERSHEY_SIMPLEX, 0.5, Scalar(255, 0, 0), 2);
                }
            }

            // A. Xóa các tracker cũ không trùng với phát hiện mới (Giữ nguyên)
            std::vector<long> trackers_to_remove;
            for (auto const& pair_item : active_trackers) {
                long id = pair_item.first;
                const auto& tracker_data = pair_item.second;
                bool found_overlap = false;
                for (const auto& det_rect : current_detections) {
                    if (calculateIoU(tracker_data.second, det_rect) > IOU_THRESHOLD) {
                        found_overlap = true;
                        break;
                    }
                }
                if (!found_overlap) {
                    trackers_to_remove.push_back(id);
                }
            }
            for (long id : trackers_to_remove) {
                // Đóng luồng file khi tracker bị xóa
                if (emotion_logs.count(id)) {
                    emotion_logs[id].close();
                    emotion_logs.erase(id);
                }
                active_trackers.erase(id);
            }

            // B. Cập nhật hoặc thêm mới các tracker
            for (const auto& new_face_box : current_detections) {
                // Draw newly detected faces on displayFrame with BLUE color
                rectangle(displayFrame, new_face_box, Scalar(255, 0, 0), 2);
                putText(displayFrame, "NEW DETECTION", Point(new_face_box.x, new_face_box.y - 10),
                    FONT_HERSHEY_SIMPLEX, 0.7, Scalar(255, 0, 0), 2);
                
                bool found_existing_tracker = false;
                for (auto& pair_item : active_trackers) {
                    auto& tracker_data = pair_item.second;

                    if (calculateIoU(tracker_data.second, new_face_box) > IOU_THRESHOLD) {
                        tracker_data.second = new_face_box;
                        tracker_data.first->init(frame, tracker_data.second);
                        found_existing_tracker = true;
                        break;
                    }
                }

                if (!found_existing_tracker) {
                    Ptr<Tracker> new_tracker = TrackerNano::create();
                    if (new_tracker) {
                        new_tracker->init(frame, new_face_box);

                        // Xử lý lưu trữ cho ID mới
                        long new_id = next_face_id;
                        std::string id_str = "ID" + std::to_string(new_id);
                        std::string face_dir_path = LOG_DIR + "/" + id_str;

                        // 1. Tạo thư mục ID
                        if (std::filesystem::create_directories(face_dir_path)) {
                            std::cout << "Created folder for " << id_str << std::endl;
                        }

                        // 2. Lưu frame đầu tiên với bounding box
                        Mat first_frame_copy = frame.clone();
                        // Vẽ box và ID lên frame copy
                        rectangle(first_frame_copy, new_face_box, Scalar(0, 0, 255), 2);
                        putText(first_frame_copy, id_str, Point(new_face_box.x, new_face_box.y-10),
                            FONT_HERSHEY_SIMPLEX, 0.7, Scalar(0, 0, 255), 2);
                        imwrite(face_dir_path + "/first_frame.jpg", first_frame_copy); // Lưu file ảnh

                        // 3. Tạo và mở file CSV
                        std::ofstream csv_file(face_dir_path + "/emotions.csv");
                        if (csv_file.is_open()) {
                            csv_file << "frame,Happy,Sad,Surprise,Angry,Disgust\n"; // Ghi header
                            emotion_logs[new_id] = std::move(csv_file); // Lưu luồng file vào map
                        }
                        else std::cerr << "Can't create file CSV for " << id_str << std::endl;

                        active_trackers[next_face_id++] = { new_tracker, new_face_box };
                        
                        // Cập nhật face log session trong MongoDB với faceId mới
                        if (!faceLogSessionId.empty()) {
                            std::vector<std::string> currentFaceIds;
                            for (const auto& pair : active_trackers) {
                                currentFaceIds.push_back("ID" + std::to_string(pair.first));
                            }
                            updateFaceLogSession(faceLogSessionId, currentFaceIds);
                        }
                    }
                    else std::cerr << "Can't create new Tracker Nano!" << std::endl;
                }
            }
        }

        // 5. Cập nhật tất cả các tracker đang hoạt động
        std::vector<long> failed_trackers;
        for (auto& pair_item : active_trackers) {
            long id = pair_item.first;
            auto& tracker_data = pair_item.second;
            Rect current_roi = tracker_data.second;
            bool ok = tracker_data.first->update(frame, current_roi);

            if (ok) {
                tracker_data.second = current_roi;
                
                // Draw BRIGHT bounding boxes on DISPLAY frame with thicker lines
                rectangle(displayFrame, current_roi, Scalar(0, 255, 0), 3, 1); // Bright green, thickness 3
                putText(displayFrame, "ID: " + std::to_string(id), Point(current_roi.x, current_roi.y - 10),
                    FONT_HERSHEY_SIMPLEX, 0.9, Scalar(0, 255, 255), 2); // Yellow text, larger size

                // Đảm bảo current_roi nằm trong biên ảnh
                current_roi.x = std::max(0, current_roi.x);
                current_roi.y = std::max(0, current_roi.y);
                current_roi.width = std::min(current_roi.width, frame.cols - current_roi.x);
                current_roi.height = std::min(current_roi.height, frame.rows - current_roi.y);

                // Kiểm tra tránh ROI rỗng
                if (current_roi.width <= 0 || current_roi.height <= 0) continue;

                // 6. Phân loại cảm xúc bằng MobileNet (only if model is loaded)
                if (emotionModelLoaded) {
                try {
                    Mat face = frame(current_roi);
                    Mat resized;
                    resize(face, resized, Size(EMO_W, EMO_H));
                    Mat blob = dnn::blobFromImage(resized, 1.0/255.0, Size(EMO_W, EMO_H), Scalar(), true);
                    emotionNet.setInput(blob);
                    Mat prob = emotionNet.forward();

                    Point classIdPoint;
                    double confidence;
                    minMaxLoc(prob, nullptr, &confidence, nullptr, &classIdPoint);
                    int label_id = classIdPoint.x;

                    // Ghi thông tin frame và emotion vào file csv (kiểm tra ID tồn tại)
                    if (emotion_logs.find(id) != emotion_logs.end() && emotion_logs[id].is_open()) {
                        emotion_logs[id] << frame_count;
                        for (int i = 0; i < prob.cols; i++) {
                            float val = prob.at<float>(0, i);
                            emotion_logs[id] << "," << std::fixed << std::setprecision(2) << val;
                        }
                        emotion_logs[id] << "\n";
                        
                        // FLUSH dữ liệu ra disk để backend có thể đọc ngay
                        emotion_logs[id].flush();
                        
                        // ========== REALTIME BATCH SYNC DISABLED ==========
                        // Chỉ lưu vào CSV file, KHÔNG gửi lên MongoDB khi đang chạy
                        // Dữ liệu sẽ được gửi lên MongoDB CHỈ KHI DỪNG CAMERA
                        
                        /*
                        // Gửi dữ liệu lên API (batch processing) - DISABLED
                        if (!dbSessionId.empty()) {
                            std::map<std::string, std::string> emotionRecord;
                            emotionRecord["faceId"] = "ID" + std::to_string(id);
                            emotionRecord["frameNumber"] = std::to_string(frame_count);
                            
                            // prob.cols = 5 emotions: Happy, Sad, Surprise, Angry, Disgust
                            std::vector<std::string> emotionNames = {"happy", "sad", "surprise", "angry", "disgust"};
                            for (int i = 0; i < prob.cols && i < emotionNames.size(); i++) {
                                std::ostringstream oss;
                                oss << std::fixed << std::setprecision(4) << prob.at<float>(0, i);
                                emotionRecord[emotionNames[i]] = oss.str();
                            }
                            
                            emotionBatchBuffer.push_back(emotionRecord);
                            
                            // Gửi batch khi đủ BATCH_SIZE
                            if (emotionBatchBuffer.size() >= BATCH_SIZE) {
                                sendEmotionBatch(dbSessionId, emotionBatchBuffer);
                                emotionBatchBuffer.clear();
                            }
                        }
                        */
                    }

                    // Đảm bảo vector đủ lớn cho ID này
                    while (average.size() <= id) {
                        average.push_back(std::vector<float>());
                    }

                    if (average[id].empty()) { // Nếu chưa có dữ liệu cho ID này
                        // Chuyển Mat sang vector<float>
                        for (int i = 0; i < prob.cols; i++) {
                            average[id].push_back(prob.at<float>(0, i));
                        }
                        average[id].push_back(1); // Số frame
                    }
                    else { // Nếu đã có ID này thì cập nhật cảm xúc trung bình
                        for (int i = 0; i < num_frame; i++) {
                            average[id][i] = (average[id][i] * average[id][num_frame] + prob.at<float>(0, i)) / (average[id][num_frame] + 1);
                        }
                        average[id][num_frame] += 1;
                    }

                    // --- Hiển thị emotion trên displayFrame ---
                    std::string label = emotion_labels[label_id] + format(" (%.2f)", confidence);
                    putText(displayFrame, label, Point(current_roi.x, current_roi.y + 25),
                        FONT_HERSHEY_SIMPLEX, 0.6, Scalar(0, 255, 255), 2);
                } catch (const std::exception& e) {
                    // If emotion recognition fails, just show "Emotion Error"
                    std::cerr << "Emotion recognition error for ID " << id << ": " << e.what() << std::endl;
                    putText(displayFrame, "Emotion Error", Point(current_roi.x, current_roi.y + 25),
                        FONT_HERSHEY_SIMPLEX, 0.6, Scalar(255, 255, 0), 2);
                }
                } else {
                    // Emotion model not loaded - show "No Emotion Model"
                    putText(displayFrame, "Face ID: " + std::to_string(id), Point(current_roi.x, current_roi.y + 25),
                        FONT_HERSHEY_SIMPLEX, 0.6, Scalar(255, 255, 255), 2);
                }
            }
            else failed_trackers.push_back(id);
        }

        for (long id : failed_trackers) {
            // Đóng luồng file khi tracker bị xóa
            if (emotion_logs.count(id)) {
                emotion_logs[id].close();
                emotion_logs.erase(id);
            }
            active_trackers.erase(id);
        }

        } catch (const std::exception& e) {
            std::cerr << "Exception in processing loop: " << e.what() << std::endl;
            std::cerr << "Continuing to next frame..." << std::endl;
        }

        // Display frame only if not in headless mode
        if (!headless) {
            // Add frame counter to display frame
            putText(displayFrame, "Frame: " + std::to_string(frame_count) + " | Trackers: " + std::to_string(active_trackers.size()),
                Point(10, displayFrame.rows - 10), FONT_HERSHEY_SIMPLEX, 0.5, Scalar(0, 255, 0), 2);
                
            // Show the frame
            if(!displayFrame.empty()) {
                imshow(windowName, displayFrame);
            } else {
                std::cerr << "Cannot show empty frame" << std::endl;
            }
            
            if (waitKey(1) == 27) break; // ESC to exit
            
            // Check if window was closed by user (clicking X button)
            if (cv::getWindowProperty(windowName, cv::WND_PROP_VISIBLE) < 1) {
                std::cout << "Window closed by user, exiting..." << std::endl;
                break;
            }
        } else {
            // In headless mode, just show progress every 30 frames
            if (frame_count % 30 == 0) {
                std::cout << "Processing frame " << frame_count << " | Active trackers: " << active_trackers.size() << std::endl;
            }
        }
        
        frame_count++;
    }

    // Đóng tất cả các luồng file đang mở
    for (auto& pair_item : emotion_logs) {
        if (pair_item.second.is_open()) {
            pair_item.second.close();
        }
    }
    std::cout << "Closed all log file." << std::endl;

    // ========== GỬI DỮ LIỆU LÊN MONGODB KHI DỪNG CAMERA ==========
    // Đọc tất cả dữ liệu từ CSV files và gửi lên MongoDB
    if (!dbSessionId.empty()) {
        std::cout << "\n========================================" << std::endl;
        std::cout << "Uploading emotion data to MongoDB..." << std::endl;
        std::cout << "========================================" << std::endl;
        
        std::vector<std::map<std::string, std::string>> allEmotionRecords;
        
        // Đọc từng file CSV của mỗi face
        for (size_t faceIdx = 0; faceIdx < average.size(); faceIdx++) {
            if (average[faceIdx].empty()) continue;
            
            std::string faceId = "ID" + std::to_string(faceIdx);
            std::string csvPath = LOG_DIR + "/" + faceId + "/emotions.csv";
            
            std::ifstream csvFile(csvPath);
            if (!csvFile.is_open()) {
                std::cerr << "Cannot open CSV file: " << csvPath << std::endl;
                continue;
            }
            
            std::string line;
            std::getline(csvFile, line); // Skip header
            
            int recordCount = 0;
            while (std::getline(csvFile, line)) {
                std::stringstream ss(line);
                std::string token;
                std::vector<std::string> row;
                
                while (std::getline(ss, token, ',')) {
                    row.push_back(token);
                }
                
                if (row.size() >= 6) { // frame, Happy, Sad, Surprise, Angry, Disgust
                    std::map<std::string, std::string> emotionRecord;
                    emotionRecord["faceId"] = faceId;
                    emotionRecord["frameNumber"] = row[0];
                    emotionRecord["happy"] = row[1];
                    emotionRecord["sad"] = row[2];
                    emotionRecord["surprise"] = row[3];
                    emotionRecord["angry"] = row[4];
                    emotionRecord["disgust"] = row[5];
                    
                    allEmotionRecords.push_back(emotionRecord);
                    recordCount++;
                }
            }
            
            csvFile.close();
            std::cout << "Read " << recordCount << " records from " << faceId << std::endl;
        }
        
        // Gửi tất cả dữ liệu lên MongoDB (batch lớn)
        if (!allEmotionRecords.empty()) {
            std::cout << "\nSending " << allEmotionRecords.size() << " total emotion records to MongoDB..." << std::endl;
            
            // Chia nhỏ thành các batch 100 records để tránh timeout
            const int FINAL_BATCH_SIZE = 100;
            for (size_t i = 0; i < allEmotionRecords.size(); i += FINAL_BATCH_SIZE) {
                size_t end = std::min(i + FINAL_BATCH_SIZE, allEmotionRecords.size());
                std::vector<std::map<std::string, std::string>> batch(
                    allEmotionRecords.begin() + i,
                    allEmotionRecords.begin() + end
                );
                
                std::cout << "Sending batch " << (i / FINAL_BATCH_SIZE + 1) 
                         << ": " << batch.size() << " records..." << std::endl;
                sendEmotionBatch(dbSessionId, batch);
            }
            
            std::cout << "✅ All emotion data uploaded to MongoDB successfully!" << std::endl;
        } else {
            std::cout << "⚠️  No emotion records to upload" << std::endl;
        }
    }
    
    // Tính toán statistics cho tất cả faces
    if (!dbSessionId.empty()) {
        std::cout << "Calculating statistics for all faces..." << std::endl;
        for (size_t i = 0; i < average.size(); i++) {
            if (!average[i].empty()) {
                std::string faceId = "ID" + std::to_string(i);
                calculateStatistics(dbSessionId, faceId);
            }
        }
        
        // Cập nhật session status thành completed
        updateSessionStatus(dbSessionId, "completed");
    }
    
    // Cập nhật face log session thành completed
    if (!faceLogSessionId.empty()) {
        std::cout << "Updating face log session status to completed..." << std::endl;
        std::vector<std::string> finalFaceIds;
        for (size_t i = 0; i < average.size(); i++) {
            if (!average[i].empty()) {
                finalFaceIds.push_back("ID" + std::to_string(i));
            }
        }
        updateFaceLogSession(faceLogSessionId, finalFaceIds, "completed");
    }

    // Ghi cảm xúc trung bình của mỗi người ra màn hình
    for (int i = 0; i < average.size(); i++) {
        for (int j = 0; j < average[i].size(); j++) {
            std::cout << average[i][j] << " ";
        }
        std::cout << "\n";
    }
    cap.release();
    destroyAllWindows();

    // Ghi file csv lưu kết quả tổng (cảm xúc trung bình)
    std::string filename = LOG_DIR + "/" + "output.csv";
    std::ofstream csv_file(filename);
    if (csv_file.is_open()) csv_file << "ID,Happy,Sad,Surprise,Angry,Disgust,Num_frame\n"; // Ghi header
    else std::cerr << "Can't create file CSV for " << filename << "\n";

    int id_temp = 0;
    for (const auto& row : average) {
        csv_file << id_temp << ",";
        for (int i = 0; i < row.size(); i++) {
            csv_file << row[i];
            if (i != row.size() - 1)
                csv_file << ",";
        }
        csv_file << "\n";
        id_temp++;
    }
    
    csv_file.close();
    std::cout << "Writed data to " << filename << " completed." << std::endl;
    return 0;
    
    } catch (const std::exception& e) {
        std::cerr << "Fatal exception: " << e.what() << std::endl;
        return -1;
    } catch (...) {
        std::cerr << "Unknown fatal exception occurred!" << std::endl;
        return -2;
    }
}