import express from 'express';
import { 
  startCamera, 
  stopCamera, 
  getCameraStatus, 
  getEmotionData,
  getEmotionLogs
} from '../controllers/CameraController.js';
import { verifyToken, isUser } from '../middleware/auth.js';

const router = express.Router();

// Camera control routes - require authentication
router.post('/start', verifyToken, isUser, startCamera);
router.post('/stop', verifyToken, isUser, stopCamera);
router.get('/status', verifyToken, isUser, getCameraStatus);
router.get('/emotion-data', verifyToken, isUser, getEmotionData);
router.get('/logs', verifyToken, isUser, getEmotionLogs);

export default router;
