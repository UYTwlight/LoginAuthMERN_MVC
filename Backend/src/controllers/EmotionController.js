import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { EmotionSession, EmotionData, FaceStatistics, FaceLogSession } from '../models/Emotion.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Map để lưu các running processes
const runningProcesses = new Map();

// Cấu hình multer để upload file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Use C:\temp to avoid Vietnamese characters in path
        const uploadDir = 'C:\\temp\\emotion-uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Chỉ chấp nhận ảnh và video
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mov|mkv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, gif) hoặc video (mp4, avi, mov, mkv)'));
    }
};

export const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: fileFilter
});

// Xử lý phân tích cảm xúc từ file upload
export const processEmotionDetection = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Không có file được upload'
            });
        }

        const uploadedFile = req.file.path;
        const emotionStatPath = path.join(__dirname, '../../../Emotion-statistics');
        const exePath = path.join(emotionStatPath, 'main.exe'); // main.exe ở root của Emotion-statistics
        const opencvBinPath = path.join(emotionStatPath, 'opencv', 'build', 'x64', 'vc16', 'bin');
        const faceLogsPath = path.join(emotionStatPath, 'face_logs');

        console.log('=== Emotion Detection Processing ===');
        console.log('Uploaded file:', uploadedFile);
        console.log('Emotion-statistics path:', emotionStatPath);
        console.log('Executable:', exePath);
        
        // Kiểm tra main.exe có tồn tại không
        if (!fs.existsSync(exePath)) {
            return res.status(500).json({
                success: false,
                error: 'main.exe không tồn tại. Vui lòng build lại bằng build_main.bat'
            });
        }

        // Generate unique process ID
        const processId = Date.now().toString();

        // Normalize paths for Windows (convert forward slashes to backslashes)
        const normalizedUploadPath = path.resolve(uploadedFile);
        
        // Chạy main.exe với file upload trong chế độ headless (không hiển thị cửa sổ)
        // Sử dụng quotes kép cho toàn bộ command và escape quotes bên trong
        const command = `cmd /c "cd /d "${emotionStatPath}" && main.exe MobileNet_custom.onnx "${normalizedUploadPath}" --headless"`;
        
        console.log('Executing command:', command);
        console.log('Normalized upload path:', normalizedUploadPath);
        console.log('Working directory:', emotionStatPath);
        console.log('OpenCV bin path:', opencvBinPath);
        console.log('Process ID:', processId);
        
        const childProcess = exec(command, {
            env: {
                ...process.env,
                PATH: `${opencvBinPath};${process.env.PATH}`
            },
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer
            timeout: 300000 // 5 minutes timeout for video processing
        }, (error, stdout, stderr) => {
            // Remove from running processes
            runningProcesses.delete(processId);
            
            console.log('=== Execution Complete ===');
            if (stdout) console.log('STDOUT:', stdout);
            if (stderr) console.log('STDERR:', stderr);
            
            // Xóa file upload sau khi xử lý
            try {
                if (fs.existsSync(uploadedFile)) {
                    fs.unlinkSync(uploadedFile);
                    console.log('Deleted uploaded file');
                }
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError);
            }

            if (error) {
                console.error('Execution error:', error);
                console.error('Error code:', error.code);
                console.error('Error signal:', error.signal);
                return res.status(500).json({
                    success: false,
                    error: 'Lỗi khi xử lý file',
                    details: error.message,
                    stdout: stdout,
                    stderr: stderr
                });
            }

            // Đợi một chút để đảm bảo CSV được ghi xong
            setTimeout(() => {
                // Tìm thư mục session mới nhất trong face_logs
                try {
                    const sessionFolders = fs.readdirSync(faceLogsPath)
                        .filter(f => fs.statSync(path.join(faceLogsPath, f)).isDirectory())
                        .map(f => ({
                            name: f,
                            time: fs.statSync(path.join(faceLogsPath, f)).mtime.getTime()
                        }))
                        .sort((a, b) => b.time - a.time);
                    
                    if (sessionFolders.length === 0) {
                        return res.status(404).json({
                            success: false,
                            error: 'Không tìm thấy session folder. File có thể không chứa khuôn mặt.',
                            stdout: stdout,
                            stderr: stderr
                        });
                    }

                    const latestSession = sessionFolders[0].name;
                    const csvOutputPath = path.join(faceLogsPath, latestSession, 'output.csv');
                    
                    console.log('Latest session folder:', latestSession);
                    console.log('CSV path:', csvOutputPath);
                    
                    // Đọc kết quả từ CSV
                    if (!fs.existsSync(csvOutputPath)) {
                        return res.status(404).json({
                            success: false,
                            error: 'Không tìm thấy kết quả. File có thể không chứa khuôn mặt hoặc có lỗi xử lý.',
                            stdout: stdout,
                            stderr: stderr
                        });
                    }

                    const csvContent = fs.readFileSync(csvOutputPath, 'utf-8');
                    const lines = csvContent.trim().split('\n');
                    
                    if (lines.length < 2) {
                        return res.status(404).json({
                            success: false,
                            error: 'Không phát hiện khuôn mặt trong file'
                        });
                    }

                    // Parse CSV
                    const emotions = [];
                    for (let i = 1; i < lines.length; i++) {
                        const parts = lines[i].split(',');
                        if (parts.length >= 7) {
                            emotions.push({
                                id: parseInt(parts[0]),
                                happy: parseFloat(parts[1]),
                                sad: parseFloat(parts[2]),
                                surprise: parseFloat(parts[3]),
                                angry: parseFloat(parts[4]),
                                disgust: parseFloat(parts[5]),
                                numFrames: parseInt(parts[6])
                            });
                        }
                    }

                    // Xóa CSV sau khi đọc
                    fs.unlinkSync(csvOutputPath);

                    // Xác định loại file
                    const ext = path.extname(req.file.originalname).toLowerCase();
                    const isVideo = ['.mp4', '.avi', '.mov', '.mkv'].includes(ext);

                    res.json({
                        success: true,
                        message: 'Phân tích hoàn tất',
                        data: {
                            totalFaces: emotions.length,
                            isVideo: isVideo,
                            emotions: emotions
                        }
                    });

                } catch (parseError) {
                    console.error('Parse error:', parseError);
                    res.status(500).json({
                        success: false,
                        error: 'Lỗi khi đọc kết quả',
                        details: parseError.message
                    });
                }
            }, 1000); // Đợi 1 giây
        });

        // Store the process
        runningProcesses.set(processId, { childProcess, uploadedFile });
        
        // Send immediate response với processId để frontend có thể cancel
        // Note: Actual results sẽ được gửi trong callback của exec

    } catch (error) {
        console.error('Server error:', error);
        console.error('Error stack:', error.stack);
        
        // Cleanup uploaded file if it exists
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
                console.log('Cleaned up file after error:', req.file.path);
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError);
            }
        }
        
        res.status(500).json({
            success: false,
            error: 'Lỗi server',
            details: error.message,
            stack: error.stack
        });
    }
};

// Khởi động camera realtime
export const startRealtimeDetection = async (req, res) => {
    try {
        const emotionStatPath = path.join(__dirname, '../../../Emotion-statistics');
        const exePath = path.join(emotionStatPath, 'main.exe');
        const opencvBinPath = path.join(emotionStatPath, 'opencv', 'build', 'x64', 'vc16', 'bin');

        // Chạy main.exe với camera (camera ID = 0)
        const command = `"${exePath}" "MobileNet_custom.onnx" "0"`;
        
        exec(command, {
            cwd: emotionStatPath,
            env: {
                ...process.env,
                PATH: `${opencvBinPath};${process.env.PATH}`
            }
        }, (error, stdout, stderr) => {
            if (error) {
                console.error('Camera error:', error);
            }
        });

        // Trả về ngay lập tức
        res.json({
            success: true,
            message: 'Camera đã được khởi động. Kiểm tra cửa sổ OpenCV.'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Lỗi server',
            details: error.message
        });
    }
};

// ============== NEW API ENDPOINTS FOR DATABASE OPERATIONS ==============

// Tạo session mới
export const createSession = async (req, res) => {
    try {
        const { sessionName, sourceType, sourceId } = req.body;
        
        if (!sessionName || !sourceType) {
            return res.status(400).json({
                success: false,
                error: 'sessionName và sourceType là bắt buộc'
            });
        }

        const session = new EmotionSession({
            sessionName,
            sourceType,
            sourceId,
            createdBy: req.user?._id, // Từ middleware auth
            status: 'running',
        });

        await session.save();

        res.status(201).json({
            success: true,
            message: 'Tạo session thành công',
            data: session
        });

    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi tạo session',
            details: error.message
        });
    }
};

// Lưu emotion data (batch insert cho hiệu suất tốt hơn)
export const saveEmotionData = async (req, res) => {
    try {
        const { sessionId, emotionRecords } = req.body;
        
        if (!sessionId || !emotionRecords || !Array.isArray(emotionRecords)) {
            return res.status(400).json({
                success: false,
                error: 'sessionId và emotionRecords (array) là bắt buộc'
            });
        }

        // Kiểm tra session có tồn tại không
        const session = await EmotionSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session không tồn tại'
            });
        }

        // Batch insert
        const emotionDocs = emotionRecords.map(record => ({
            sessionId,
            faceId: record.faceId,
            frameNumber: record.frameNumber,
            emotions: {
                happy: record.emotions.happy || 0,
                sad: record.emotions.sad || 0,
                surprise: record.emotions.surprise || 0,
                angry: record.emotions.angry || 0,
                disgust: record.emotions.disgust || 0,
            },
            dominantEmotion: getDominantEmotion(record.emotions),
            confidence: getMaxConfidence(record.emotions),
        }));

        await EmotionData.insertMany(emotionDocs);

        // Update session stats
        session.totalFrames = (session.totalFrames || 0) + emotionRecords.length;
        const uniqueFaces = new Set(emotionRecords.map(r => r.faceId));
        session.totalFaces = Math.max(session.totalFaces || 0, uniqueFaces.size);
        await session.save();

        res.status(201).json({
            success: true,
            message: `Đã lưu ${emotionDocs.length} emotion records`,
            data: {
                inserted: emotionDocs.length,
                sessionStats: {
                    totalFrames: session.totalFrames,
                    totalFaces: session.totalFaces
                }
            }
        });

    } catch (error) {
        console.error('Save emotion data error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi lưu emotion data',
            details: error.message
        });
    }
};

// Cập nhật trạng thái session
export const updateSessionStatus = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { status, endTime } = req.body;

        const session = await EmotionSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session không tồn tại'
            });
        }

        if (status) session.status = status;
        if (endTime) session.endTime = new Date(endTime);
        else if (status === 'completed' || status === 'stopped') {
            session.endTime = new Date();
        }

        await session.save();

        res.json({
            success: true,
            message: 'Cập nhật session thành công',
            data: session
        });

    } catch (error) {
        console.error('Update session error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi cập nhật session',
            details: error.message
        });
    }
};

// Lấy tất cả sessions
export const getAllSessions = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, sourceType } = req.query;
        
        const query = {};
        if (status) query.status = status;
        if (sourceType) query.sourceType = sourceType;

        const sessions = await EmotionSession.find(query)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await EmotionSession.countDocuments(query);

        res.json({
            success: true,
            data: sessions,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi lấy danh sách sessions',
            details: error.message
        });
    }
};

// Lấy chi tiết một session
export const getSessionById = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await EmotionSession.findById(sessionId)
            .populate('createdBy', 'name email');

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session không tồn tại'
            });
        }

        res.json({
            success: true,
            data: session
        });

    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi lấy thông tin session',
            details: error.message
        });
    }
};

// Lấy emotion data theo session
export const getEmotionsBySession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { faceId, page = 1, limit = 100 } = req.query;

        const query = { sessionId };
        if (faceId) query.faceId = faceId;

        const emotions = await EmotionData.find(query)
            .sort({ frameNumber: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await EmotionData.countDocuments(query);

        res.json({
            success: true,
            data: emotions,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        console.error('Get emotions error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi lấy emotion data',
            details: error.message
        });
    }
};

// Tính toán và lưu statistics cho một face
export const calculateFaceStatistics = async (req, res) => {
    try {
        const { sessionId, faceId } = req.params;

        // Lấy tất cả emotion data của face này
        const emotions = await EmotionData.find({ sessionId, faceId }).sort({ frameNumber: 1 });

        if (emotions.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Không có dữ liệu cho face này'
            });
        }

        // Tính trung bình
        const avgEmotions = {
            happy: 0,
            sad: 0,
            surprise: 0,
            angry: 0,
            disgust: 0,
        };

        emotions.forEach(e => {
            avgEmotions.happy += e.emotions.happy;
            avgEmotions.sad += e.emotions.sad;
            avgEmotions.surprise += e.emotions.surprise;
            avgEmotions.angry += e.emotions.angry;
            avgEmotions.disgust += e.emotions.disgust;
        });

        const totalFrames = emotions.length;
        Object.keys(avgEmotions).forEach(key => {
            avgEmotions[key] /= totalFrames;
        });

        // Tính phân phối (dominant emotion count)
        const emotionCounts = {
            happy: 0,
            sad: 0,
            surprise: 0,
            angry: 0,
            disgust: 0,
        };

        emotions.forEach(e => {
            const dominant = e.dominantEmotion;
            if (dominant && emotionCounts.hasOwnProperty(dominant)) {
                emotionCounts[dominant]++;
            }
        });

        const distribution = {};
        Object.keys(emotionCounts).forEach(key => {
            distribution[key] = (emotionCounts[key] / totalFrames) * 100;
        });

        const dominantEmotion = Object.keys(avgEmotions).reduce((a, b) => 
            avgEmotions[a] > avgEmotions[b] ? a : b
        );

        // Tìm đường dẫn first_frame.jpg
        const emotionStatPath = path.join(__dirname, '../../../Emotion-statistics');
        const session = await EmotionSession.findById(sessionId);
        const sessionFolder = path.join(emotionStatPath, 'face_logs', session.sessionName);
        const firstFramePath = path.join(sessionFolder, faceId, 'first_frame.jpg');
        const relativeFirstFramePath = path.relative(emotionStatPath, firstFramePath);

        // Upsert statistics
        const statistics = await FaceStatistics.findOneAndUpdate(
            { sessionId, faceId },
            {
                sessionId,
                faceId,
                firstFramePath: fs.existsSync(firstFramePath) ? relativeFirstFramePath : null,
                totalFrames,
                averageEmotions: avgEmotions,
                dominantEmotion,
                emotionDistribution: distribution,
            },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            message: 'Tính toán statistics thành công',
            data: statistics
        });

    } catch (error) {
        console.error('Calculate statistics error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi tính toán statistics',
            details: error.message
        });
    }
};

// Lấy statistics của tất cả faces trong session
export const getSessionStatistics = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await EmotionSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session không tồn tại'
            });
        }

        const statistics = await FaceStatistics.find({ sessionId }).sort({ faceId: 1 });

        // Tính overall statistics cho session
        const overallStats = {
            totalFaces: statistics.length,
            totalFrames: session.totalFrames,
            overallEmotionDistribution: {
                happy: 0,
                sad: 0,
                surprise: 0,
                angry: 0,
                disgust: 0,
            }
        };

        if (statistics.length > 0) {
            statistics.forEach(stat => {
                Object.keys(overallStats.overallEmotionDistribution).forEach(emotion => {
                    overallStats.overallEmotionDistribution[emotion] += stat.averageEmotions[emotion];
                });
            });

            Object.keys(overallStats.overallEmotionDistribution).forEach(emotion => {
                overallStats.overallEmotionDistribution[emotion] /= statistics.length;
            });
        }

        res.json({
            success: true,
            data: {
                session,
                faceStatistics: statistics,
                overallStatistics: overallStats
            }
        });

    } catch (error) {
        console.error('Get session statistics error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi lấy statistics',
            details: error.message
        });
    }
};

// Helper functions
function getDominantEmotion(emotions) {
    const emotionKeys = ['happy', 'sad', 'surprise', 'angry', 'disgust'];
    let maxEmotion = emotionKeys[0];
    let maxValue = emotions[maxEmotion] || 0;

    emotionKeys.forEach(key => {
        if ((emotions[key] || 0) > maxValue) {
            maxValue = emotions[key];
            maxEmotion = key;
        }
    });

    return maxEmotion;
}

function getMaxConfidence(emotions) {
    return Math.max(
        emotions.happy || 0,
        emotions.sad || 0,
        emotions.surprise || 0,
        emotions.angry || 0,
        emotions.disgust || 0
    );
}

// Stop emotion analysis (kill running process)
export const stopEmotionAnalysis = async (req, res) => {
    try {
        const { processId } = req.params;
        
        if (!processId) {
            return res.status(400).json({
                success: false,
                error: 'processId là bắt buộc'
            });
        }

        const processInfo = runningProcesses.get(processId);
        
        if (!processInfo) {
            return res.status(404).json({
                success: false,
                error: 'Process không tồn tại hoặc đã kết thúc'
            });
        }

        const { childProcess, uploadedFile } = processInfo;

        // Kill the process
        if (childProcess && !childProcess.killed) {
            // On Windows, need to kill the whole process tree
            try {
                if (process.platform === 'win32') {
                    exec(`taskkill /pid ${childProcess.pid} /T /F`, (error) => {
                        if (error) {
                            console.error('Error killing process:', error);
                        } else {
                            console.log(`Killed process ${childProcess.pid} and its children`);
                        }
                    });
                } else {
                    childProcess.kill('SIGTERM');
                }
            } catch (killError) {
                console.error('Kill error:', killError);
            }
        }

        // Cleanup uploaded file
        if (uploadedFile && fs.existsSync(uploadedFile)) {
            try {
                fs.unlinkSync(uploadedFile);
                console.log('Cleaned up file:', uploadedFile);
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError);
            }
        }

        // Remove from map
        runningProcesses.delete(processId);

        res.json({
            success: true,
            message: 'Đã dừng phân tích'
        });

    } catch (error) {
        console.error('Stop analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi dừng phân tích',
            details: error.message
        });
    }
};

// ==================== FACE LOG FILE ANALYSIS APIs ====================

// API để C++ app tạo session mới trong MongoDB
export const createFaceLogSession = async (req, res) => {
    try {
        const { sessionId, source, sourceType, timestamp, directoryPath } = req.body;

        // Kiểm tra xem session đã tồn tại chưa
        let session = await FaceLogSession.findOne({ sessionId });
        
        if (session) {
            // Nếu đã tồn tại, trả về session hiện tại
            return res.json({
                success: true,
                message: 'Session already exists',
                session: session
            });
        }

        // Tạo session mới
        session = new FaceLogSession({
            sessionId,
            source,
            sourceType: sourceType || 'video',
            timestamp,
            startTime: new Date(),
            status: 'running',
            directoryPath,
            faceCount: 0,
            faceIds: []
        });

        await session.save();

        res.json({
            success: true,
            message: 'Face log session created',
            session: session
        });

    } catch (error) {
        console.error('Create face log session error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi tạo face log session',
            details: error.message
        });
    }
};

// API để C++ app cập nhật session (thêm faceId, cập nhật status, etc.)
export const updateFaceLogSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const updates = req.body;

        const session = await FaceLogSession.findOneAndUpdate(
            { sessionId },
            { 
                ...updates,
                ...(updates.status === 'completed' && { endTime: new Date() })
            },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session không tồn tại'
            });
        }

        res.json({
            success: true,
            message: 'Session updated',
            session: session
        });

    } catch (error) {
        console.error('Update face log session error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi cập nhật session',
            details: error.message
        });
    }
};

// Lấy danh sách tất cả các session từ MongoDB (không đọc file system)
export const getFaceLogSessions = async (req, res) => {
    try {
        console.log('=== getFaceLogSessions called ===');
        console.log('User:', req.user ? req.user.email : 'No user');
        
        // Lấy sessions từ MongoDB
        const sessions = await FaceLogSession.find()
            .sort({ startTime: -1 })
            .limit(100)
            .lean();

        console.log(`Found ${sessions.length} sessions in MongoDB`);
        console.log('First session:', sessions[0]);

        res.json({
            success: true,
            sessions: sessions
        });

    } catch (error) {
        console.error('Get face log sessions error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi lấy danh sách sessions',
            details: error.message
        });
    }
};

// Lấy dữ liệu chi tiết của một session
export const getFaceLogSessionData = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const faceLogsPath = path.join(__dirname, '../../..', 'Emotion-statistics', 'face_logs');
        const sessionPath = path.join(faceLogsPath, sessionId);

        if (!fs.existsSync(sessionPath)) {
            return res.status(404).json({
                success: false,
                error: 'Session không tồn tại'
            });
        }

        // Lấy danh sách face IDs
        const faceIds = fs.readdirSync(sessionPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('ID'))
            .map(dirent => dirent.name)
            .sort((a, b) => {
                const numA = parseInt(a.replace('ID', ''));
                const numB = parseInt(b.replace('ID', ''));
                return numA - numB;
            });

        const sessionData = {
            sessionId: sessionId,
            faces: []
        };

        // Đọc dữ liệu từng face
        for (const faceId of faceIds) {
            const facePath = path.join(sessionPath, faceId);
            const csvPath = path.join(facePath, 'emotions.csv');
            const firstFramePath = path.join(facePath, 'first_frame.jpg');

            if (!fs.existsSync(csvPath)) {
                continue;
            }

            // Đọc CSV file
            const csvContent = fs.readFileSync(csvPath, 'utf-8');
            const lines = csvContent.split('\n').filter(line => line.trim());
            
            if (lines.length <= 1) {
                continue; // Chỉ có header, không có data
            }

            // Parse CSV
            const headers = lines[0].split(',');
            const emotionData = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                if (values.length === headers.length) {
                    const record = {};
                    headers.forEach((header, index) => {
                        record[header.trim()] = values[index].trim();
                    });
                    emotionData.push(record);
                }
            }

            // Tính toán thống kê
            const stats = calculateEmotionStats(emotionData);

            sessionData.faces.push({
                faceId: faceId,
                totalFrames: emotionData.length,
                firstFrameImage: fs.existsSync(firstFramePath) ? `/api/emotions/face-logs/image/${sessionId}/${faceId}/first_frame.jpg` : null,
                emotionData: emotionData,
                statistics: stats
            });
        }

        res.json({
            success: true,
            data: sessionData
        });

    } catch (error) {
        console.error('Get face log session data error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi lấy dữ liệu session',
            details: error.message
        });
    }
};

// Helper function để tính thống kê cảm xúc
function calculateEmotionStats(emotionData) {
    if (!emotionData || emotionData.length === 0) {
        return null;
    }

    const emotions = ['Happy', 'Sad', 'Surprise', 'Angry', 'Disgust'];
    const stats = {
        totalFrames: emotionData.length,
        averageEmotions: {},
        dominantEmotion: null,
        emotionDistribution: {},
        timeline: []
    };

    // Tính average cho mỗi emotion
    emotions.forEach(emotion => {
        const sum = emotionData.reduce((acc, record) => {
            return acc + parseFloat(record[emotion] || 0);
        }, 0);
        stats.averageEmotions[emotion] = (sum / emotionData.length).toFixed(4);
    });

    // Tìm dominant emotion
    let maxAvg = -1;
    emotions.forEach(emotion => {
        if (parseFloat(stats.averageEmotions[emotion]) > maxAvg) {
            maxAvg = parseFloat(stats.averageEmotions[emotion]);
            stats.dominantEmotion = emotion;
        }
    });

    // Tính distribution (số frame có emotion này là dominant)
    emotions.forEach(emotion => {
        stats.emotionDistribution[emotion] = 0;
    });

    emotionData.forEach(record => {
        let maxVal = -1;
        let maxEmotion = null;
        emotions.forEach(emotion => {
            const val = parseFloat(record[emotion] || 0);
            if (val > maxVal) {
                maxVal = val;
                maxEmotion = emotion;
            }
        });
        if (maxEmotion) {
            stats.emotionDistribution[maxEmotion]++;
        }
    });

    // Timeline data (sample every N frames for performance)
    const sampleRate = Math.max(1, Math.floor(emotionData.length / 100));
    for (let i = 0; i < emotionData.length; i += sampleRate) {
        const record = emotionData[i];
        const timelinePoint = {
            frame: parseInt(record.frame || i),
        };
        emotions.forEach(emotion => {
            timelinePoint[emotion] = parseFloat(record[emotion] || 0);
        });
        stats.timeline.push(timelinePoint);
    }

    return stats;
}

// API để lấy ảnh first_frame
export const getFaceLogImage = async (req, res) => {
    try {
        const { sessionId, faceId, imageName } = req.params;
        const faceLogsPath = path.join(__dirname, '../../..', 'Emotion-statistics', 'face_logs');
        const imagePath = path.join(faceLogsPath, sessionId, faceId, imageName);

        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({
                success: false,
                error: 'Image không tồn tại'
            });
        }

        res.sendFile(imagePath);

    } catch (error) {
        console.error('Get face log image error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi lấy image',
            details: error.message
        });
    }
};

// API để admin xóa face log session
export const deleteFaceLogSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        console.log('Deleting face log session:', sessionId);

        // Tìm session trong MongoDB
        const session = await FaceLogSession.findOne({ sessionId });

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session không tồn tại'
            });
        }

        // Xóa thư mục face_logs nếu tồn tại
        if (session.directoryPath) {
            const fullPath = path.join(process.cwd(), '..', 'Emotion-statistics', session.directoryPath);
            
            if (fs.existsSync(fullPath)) {
                console.log('Deleting directory:', fullPath);
                fs.rmSync(fullPath, { recursive: true, force: true });
                console.log('Directory deleted successfully');
            }
        }

        // Xóa document trong MongoDB
        await FaceLogSession.deleteOne({ sessionId });

        console.log('Session deleted from MongoDB:', sessionId);

        res.json({
            success: true,
            message: 'Đã xóa session thành công'
        });

    } catch (error) {
        console.error('Delete face log session error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi xóa session',
            details: error.message
        });
    }
};

