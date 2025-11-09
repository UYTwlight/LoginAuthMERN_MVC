import express from 'express';
import multer from 'multer';
import path from 'path';
import { getModels, setActiveModel, uploadModel, deleteModel } from '../controllers/ModelController.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/models/'); // Temporary upload directory
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// All routes require authentication and admin role
router.use(verifyToken);
router.use(verifyAdmin);

// GET /api/models - Get list of all models
router.get('/', getModels);

// POST /api/models/active - Set active model
router.post('/active', setActiveModel);

// POST /api/models/upload - Upload new model
router.post('/upload', upload.single('model'), uploadModel);

// DELETE /api/models/:modelName - Delete a model
router.delete('/:modelName', deleteModel);

export default router;
