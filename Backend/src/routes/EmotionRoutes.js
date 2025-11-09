import express from 'express';
import { 
    upload, 
    processEmotionDetection, 
    startRealtimeDetection,
    stopEmotionAnalysis,
    createSession,
    saveEmotionData,
    updateSessionStatus,
    getAllSessions,
    getSessionById,
    getEmotionsBySession,
    calculateFaceStatistics,
    getSessionStatistics,
    createFaceLogSession,
    updateFaceLogSession,
    getFaceLogSessions,
    getFaceLogSessionData,
    getFaceLogImage,
    deleteFaceLogSession
} from '../controllers/EmotionController.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// ========== Existing routes ==========
// Upload và phân tích file (chỉ admin)
router.post('/analyze', verifyToken, isAdmin, upload.single('file'), processEmotionDetection);

// Khởi động camera realtime (chỉ admin)
router.post('/camera/start', verifyToken, isAdmin, startRealtimeDetection);

// Stop emotion analysis (chỉ admin)
router.post('/analyze/stop/:processId', verifyToken, isAdmin, stopEmotionAnalysis);

// ========== New Database API routes ==========
// Session management
router.post('/sessions', createSession); // Public để C++ app có thể tạo session
router.get('/sessions', verifyToken, getAllSessions); // Get all sessions
router.get('/sessions/:sessionId', verifyToken, getSessionById); // Get session details
router.patch('/sessions/:sessionId/status', updateSessionStatus); // Update session status

// Emotion data
router.post('/emotions', saveEmotionData); // Public để C++ app có thể gửi data
router.get('/emotions/:sessionId', verifyToken, getEmotionsBySession); // Get emotions by session

// Statistics
router.post('/statistics/:sessionId/:faceId/calculate', calculateFaceStatistics); // Calculate stats for a face
router.get('/statistics/:sessionId', verifyToken, getSessionStatistics); // Get all statistics for session

// ========== Face Log File Analysis routes ==========
// C++ app gọi để tạo session mới trong MongoDB
router.post('/face-logs/sessions', createFaceLogSession);

// C++ app gọi để cập nhật session (thêm faceId, cập nhật status)
router.patch('/face-logs/sessions/:sessionId', updateFaceLogSession);

// Lấy danh sách tất cả sessions từ MongoDB
router.get('/face-logs/sessions', verifyToken, getFaceLogSessions);

// Lấy dữ liệu chi tiết của một session (đọc CSV từ file system)
router.get('/face-logs/sessions/:sessionId', verifyToken, getFaceLogSessionData);

// Lấy ảnh first_frame
router.get('/face-logs/image/:sessionId/:faceId/:imageName', getFaceLogImage);

// Xóa session (chỉ admin)
router.delete('/face-logs/sessions/:sessionId', verifyToken, isAdmin, deleteFaceLogSession);

export default router;

