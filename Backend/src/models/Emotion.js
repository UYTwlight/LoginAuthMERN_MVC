import mongoose from "mongoose";

// Schema mới cho Face Log Sessions (lưu metadata của các session từ face_logs/)
const faceLogSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    // Tên thư mục: "Camera_0_20251109_101419" hoặc "file-xxx_20251109_101248"
  },
  source: {
    type: String,
    required: true,
    // Camera_0, file-1762657968436-578383331, video_name, etc.
  },
  sourceType: {
    type: String,
    enum: ['camera', 'video', 'image'],
    required: true,
  },
  timestamp: {
    type: String,
    required: true,
    // Format: "20251109_101419"
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['running', 'completed', 'stopped', 'error'],
    default: 'running',
  },
  faceCount: {
    type: Number,
    default: 0,
  },
  faceIds: [{
    type: String,
    // ["ID0", "ID1", "ID2", ...]
  }],
  directoryPath: {
    type: String,
    required: true,
    // Đường dẫn tuyệt đối đến thư mục session
  },
  notes: {
    type: String,
  },
}, { timestamps: true });

// Index để query nhanh
faceLogSessionSchema.index({ startTime: -1 });
faceLogSessionSchema.index({ sourceType: 1 });

// Schema cho mỗi session phân tích cảm xúc (giữ lại để tương thích)
const emotionSessionSchema = new mongoose.Schema({
  sessionName: {
    type: String,
    required: true,
    // Ví dụ: "Camera_0_20251108_143022" hoặc "video_name_20251108_152130"
  },
  sourceType: {
    type: String,
    enum: ['camera', 'video'],
    required: true,
  },
  sourceId: {
    type: String,
    // Camera ID (0, 1, 2...) hoặc tên file video
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['running', 'completed', 'stopped', 'error'],
    default: 'running',
  },
  totalFrames: {
    type: Number,
    default: 0,
  },
  totalFaces: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserData',
  },
}, { timestamps: true });

// Schema cho dữ liệu cảm xúc của mỗi khuôn mặt được phát hiện
const emotionDataSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmotionSession',
    required: true,
    index: true, // Index để query nhanh
  },
  faceId: {
    type: String,
    required: true,
    // Ví dụ: "ID0", "ID1", "ID2"...
  },
  frameNumber: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  emotions: {
    happy: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    sad: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    surprise: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    angry: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    disgust: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
  },
  dominantEmotion: {
    type: String,
    enum: ['happy', 'sad', 'surprise', 'angry', 'disgust'],
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
  },
}, { timestamps: true });

// Index compound để query theo session và faceId
emotionDataSchema.index({ sessionId: 1, faceId: 1 });

// Schema cho thống kê tổng hợp của mỗi khuôn mặt trong session
const faceStatisticsSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmotionSession',
    required: true,
    index: true,
  },
  faceId: {
    type: String,
    required: true,
  },
  firstFramePath: {
    type: String,
    // Đường dẫn đến ảnh first_frame.jpg
  },
  totalFrames: {
    type: Number,
    default: 0,
  },
  averageEmotions: {
    happy: { type: Number, default: 0 },
    sad: { type: Number, default: 0 },
    surprise: { type: Number, default: 0 },
    angry: { type: Number, default: 0 },
    disgust: { type: Number, default: 0 },
  },
  dominantEmotion: {
    type: String,
    enum: ['happy', 'sad', 'surprise', 'angry', 'disgust'],
  },
  emotionDistribution: {
    // Phần trăm mỗi cảm xúc
    happy: { type: Number, default: 0 },
    sad: { type: Number, default: 0 },
    surprise: { type: Number, default: 0 },
    angry: { type: Number, default: 0 },
    disgust: { type: Number, default: 0 },
  },
}, { timestamps: true });

// Index compound để query nhanh
faceStatisticsSchema.index({ sessionId: 1, faceId: 1 }, { unique: true });

export const FaceLogSession = mongoose.model("FaceLogSession", faceLogSessionSchema);
export const EmotionSession = mongoose.model("EmotionSession", emotionSessionSchema);
export const EmotionData = mongoose.model("EmotionData", emotionDataSchema);
export const FaceStatistics = mongoose.model("FaceStatistics", faceStatisticsSchema);
