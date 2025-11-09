import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to Emotion-statistics folder (where models are stored)
const getEmotionStatPath = () => {
  return path.resolve(__dirname, '../../../Emotion-statistics');
};

// System models that should not be displayed or deleted
const SYSTEM_MODELS = [
  'face_detection_yunet_2023mar_int8.onnx',
  'backbone.onnx',
  'neckhead.onnx'
];

// Get list of available emotion models
export const getModels = async (req, res) => {
  try {
    const emotionStatPath = getEmotionStatPath();
    
    // Read all .onnx files in the directory, excluding system models
    const files = fs.readdirSync(emotionStatPath);
    const modelFiles = files.filter(file => 
      file.endsWith('.onnx') && !SYSTEM_MODELS.includes(file)
    );
    
    // Read current active model from config file
    const configPath = path.join(emotionStatPath, 'model_config.json');
    let activeModel = 'MobileNet_custom.onnx'; // Default
    
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      activeModel = config.activeModel || activeModel;
    }
    
    // Get file info for each model
    const models = modelFiles.map(filename => {
      const filePath = path.join(emotionStatPath, filename);
      const stats = fs.statSync(filePath);
      
      return {
        filename,
        size: stats.size,
        lastModified: stats.mtime,
        isActive: filename === activeModel
      };
    });
    
    res.status(200).json({
      success: true,
      models,
      activeModel
    });
    
  } catch (error) {
    console.error('Error getting models:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get models',
      error: error.message
    });
  }
};

// Set active model
export const setActiveModel = async (req, res) => {
  try {
    const { modelName } = req.body;
    
    if (!modelName) {
      return res.status(400).json({
        success: false,
        message: 'Model name is required'
      });
    }
    
    const emotionStatPath = getEmotionStatPath();
    const modelPath = path.join(emotionStatPath, modelName);
    
    // Check if model file exists
    if (!fs.existsSync(modelPath)) {
      return res.status(404).json({
        success: false,
        message: 'Model file not found'
      });
    }
    
    // Save to config file
    const configPath = path.join(emotionStatPath, 'model_config.json');
    const config = {
      activeModel: modelName,
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    // Auto-rebuild main.exe with new model
    console.log('[BUILD] Starting auto-rebuild of main.exe...');
    
    const buildScriptPath = path.join(emotionStatPath, 'build_main.bat');
    
    if (!fs.existsSync(buildScriptPath)) {
      console.warn('[BUILD] build_main.bat not found, skipping rebuild');
      return res.status(200).json({
        success: true,
        message: 'Active model updated successfully (rebuild skipped - build script not found)',
        activeModel: modelName,
        rebuilt: false
      });
    }
    
    // Execute build script asynchronously
    const buildProcess = spawn('cmd.exe', ['/c', 'build_main.bat'], {
      cwd: emotionStatPath,
      stdio: 'pipe'
    });
    
    let buildOutput = '';
    let buildError = '';
    
    buildProcess.stdout.on('data', (data) => {
      buildOutput += data.toString();
      console.log('[BUILD]', data.toString().trim());
    });
    
    buildProcess.stderr.on('data', (data) => {
      buildError += data.toString();
      console.error('[BUILD ERROR]', data.toString().trim());
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('[BUILD] ✅ Rebuild completed successfully');
        console.log('[BUILD] ℹ️  Model is ready to use. Please restart camera if running.');
      } else {
        console.error('[BUILD] ❌ Rebuild failed with code:', code);
      }
    });
    
    // Don't wait for build to complete, return immediately
    res.status(200).json({
      success: true,
      message: 'Active model updated successfully. Rebuilding main.exe in background...',
      activeModel: modelName,
      rebuilt: true,
      rebuildInProgress: true
    });
    
  } catch (error) {
    console.error('Error setting active model:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set active model',
      error: error.message
    });
  }
};

// Upload new model
export const uploadModel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const uploadedFile = req.file;
    
    // Validate file extension
    if (!uploadedFile.originalname.endsWith('.onnx')) {
      // Delete uploaded file
      fs.unlinkSync(uploadedFile.path);
      
      return res.status(400).json({
        success: false,
        message: 'Only .onnx files are allowed'
      });
    }
    
    const emotionStatPath = getEmotionStatPath();
    const targetPath = path.join(emotionStatPath, uploadedFile.originalname);
    
    // Check if file already exists
    if (fs.existsSync(targetPath)) {
      // Delete uploaded file
      fs.unlinkSync(uploadedFile.path);
      
      return res.status(409).json({
        success: false,
        message: 'Model with this name already exists'
      });
    }
    
    // Move file to Emotion-statistics folder
    fs.renameSync(uploadedFile.path, targetPath);
    
    res.status(201).json({
      success: true,
      message: 'Model uploaded successfully',
      filename: uploadedFile.originalname,
      size: uploadedFile.size
    });
    
  } catch (error) {
    console.error('Error uploading model:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload model',
      error: error.message
    });
  }
};

// Delete model
export const deleteModel = async (req, res) => {
  try {
    const { modelName } = req.params;
    
    if (!modelName) {
      return res.status(400).json({
        success: false,
        message: 'Model name is required'
      });
    }
    
    // Prevent deletion of system models
    if (SYSTEM_MODELS.includes(modelName)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete system model. This model is required for the system to function.'
      });
    }
    
    const emotionStatPath = getEmotionStatPath();
    const modelPath = path.join(emotionStatPath, modelName);
    
    // Check if model file exists
    if (!fs.existsSync(modelPath)) {
      return res.status(404).json({
        success: false,
        message: 'Model file not found'
      });
    }
    
    // Check if this is the active model
    const configPath = path.join(emotionStatPath, 'model_config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.activeModel === modelName) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete active model. Please select another model first.'
        });
      }
    }
    
    // Delete the file
    fs.unlinkSync(modelPath);
    
    res.status(200).json({
      success: true,
      message: 'Model deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting model:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete model',
      error: error.message
    });
  }
};
