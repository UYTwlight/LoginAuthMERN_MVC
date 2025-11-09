import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store C++ executable process
let emotionDetectionProcess = null;

// Get emotion statistics path
const getEmotionStatPath = () => {
  return path.join(__dirname, '../../../Emotion-statistics');
};

// Start camera and emotion detection
export const startCamera = async (req, res) => {
  try {
    // Check if already running
    if (emotionDetectionProcess && !emotionDetectionProcess.killed) {
      return res.status(400).json({
        message: "Camera is already running",
        status: "active"
      });
    }

    // Get model path and camera ID from request (optional)
    const modelPath = req.body.modelPath || 'MobileNet_custom.onnx';
    const cameraId = req.body.cameraId || '0';

    const emotionStatPath = getEmotionStatPath();
    const exePath = path.join(emotionStatPath, 'main.exe');
    const opencvBinPath = path.join(emotionStatPath, 'opencv', 'build', 'x64', 'vc16', 'bin');

    console.log(`Starting Emotion Detection: Model=${modelPath}, Camera=${cameraId}`);

    // Spawn C++ executable with arguments
    emotionDetectionProcess = spawn(exePath, [modelPath, cameraId], {
      cwd: emotionStatPath,
      env: { 
        ...process.env,
        PATH: `${opencvBinPath};${process.env.PATH}`
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    emotionDetectionProcess.stdout.on('data', (data) => {
      console.log('Emotion Detection:', data.toString());
    });

    emotionDetectionProcess.stderr.on('data', (data) => {
      console.error('Emotion Detection Error:', data.toString());
    });

    emotionDetectionProcess.on('close', (code) => {
      console.log(`Emotion Detection process exited with code ${code}`);
      emotionDetectionProcess = null;
    });

    // Wait a moment for initialization
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.status(200).json({
      message: "Camera started successfully",
      status: "active",
      modelPath: modelPath,
      cameraId: cameraId
    });

  } catch (error) {
    console.error('Error starting camera:', error.message);
    res.status(500).json({ 
      message: "Failed to start camera. Make sure main.exe is compiled.", 
      error: error.message 
    });
  }
};

// Stop camera
export const stopCamera = async (req, res) => {
  try {
    if (!emotionDetectionProcess || emotionDetectionProcess.killed) {
      return res.status(400).json({
        message: "Camera is not running",
        status: "inactive"
      });
    }

    // Kill the process
    emotionDetectionProcess.kill('SIGTERM');
    
    // Wait for process to exit
    await new Promise(resolve => setTimeout(resolve, 500));

    res.status(200).json({
      message: "Camera stopped successfully",
      status: "stopped"
    });

  } catch (error) {
    console.error('Error stopping camera:', error);
    res.status(500).json({ 
      message: "Failed to stop camera", 
      error: error.message 
    });
  }
};

// Get camera status
export const getCameraStatus = async (req, res) => {
  try {
    const isRunning = emotionDetectionProcess && !emotionDetectionProcess.killed;

    res.status(200).json({
      status: isRunning ? "active" : "inactive",
      isRunning: isRunning,
      message: isRunning ? "Camera is running" : "Camera is stopped"
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      isRunning: false,
      message: error.message
    });
  }
};

// Get latest emotion data from CSV files
export const getEmotionData = async (req, res) => {
  try {
    const emotionStatPath = getEmotionStatPath();
    const logsPath = path.join(emotionStatPath, 'face_logs');
    
    const fs = await import('fs');
    
    // Check if logs directory exists
    if (!fs.existsSync(logsPath)) {
      return res.status(200).json({ 
        timestamp: new Date(),
        emotionData: [],
        isRunning: emotionDetectionProcess && !emotionDetectionProcess.killed,
        totalDataPoints: 0,
        message: "No logs directory found"
      });
    }

    // Find the LATEST session directory (newest by modification time)
    const sessionDirs = fs.readdirSync(logsPath)
      .filter(file => {
        const fullPath = path.join(logsPath, file);
        return fs.statSync(fullPath).isDirectory();
      })
      .map(dir => ({
        name: dir,
        time: fs.statSync(path.join(logsPath, dir)).mtime
      }))
      .sort((a, b) => b.time - a.time); // Sort by newest first

    if (sessionDirs.length === 0) {
      return res.status(200).json({ 
        timestamp: new Date(),
        emotionData: [],
        isRunning: emotionDetectionProcess && !emotionDetectionProcess.killed,
        totalDataPoints: 0,
        message: "No session directories found"
      });
    }

    // Get only the LATEST session directory
    const latestSessionPath = path.join(logsPath, sessionDirs[0].name);
    
    // Collect all emotion data from all face directories in the LATEST session
    const allEmotionData = [];
    const faceDirectories = fs.readdirSync(latestSessionPath).filter(file => {
      const fullPath = path.join(latestSessionPath, file);
      return fs.statSync(fullPath).isDirectory();
    });
    
    for (const faceDir of faceDirectories) {
      const emotionsCsvPath = path.join(latestSessionPath, faceDir, 'emotions.csv');
      
      if (fs.existsSync(emotionsCsvPath)) {
        try {
          const csvContent = fs.readFileSync(emotionsCsvPath, 'utf-8');
          const lines = csvContent.split('\n').filter(line => line.trim());
          
          if (lines.length > 1) {
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            
            // Parse each line of emotion data
            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].split(',');
              const obj = {
                faceId: faceDir
              };
              
              headers.forEach((header, index) => {
                if (values[index]) {
                  const value = values[index].trim();
                  obj[header] = isNaN(value) ? value : parseFloat(value);
                }
              });
              
              allEmotionData.push(obj);
            }
          }
        } catch (err) {
          console.error(`Error reading ${emotionsCsvPath}:`, err.message);
        }
      }
    }

    res.status(200).json({
      timestamp: new Date(),
      emotionData: allEmotionData,
      isRunning: emotionDetectionProcess && !emotionDetectionProcess.killed,
      totalDataPoints: allEmotionData.length,
      totalFaces: faceDirectories.length
    });

  } catch (error) {
    console.error('Error getting emotion data:', error);
    res.status(200).json({ 
      timestamp: new Date(),
      emotionData: [],
      isRunning: false,
      totalDataPoints: 0,
      error: error.message
    });
  }
};

// Get emotion logs from files
export const getEmotionLogs = async (req, res) => {
  try {
    const emotionStatPath = getEmotionStatPath();
    const logsPath = path.join(emotionStatPath, 'face_logs');
    
    const fs = await import('fs');
    
    if (!fs.existsSync(logsPath)) {
      return res.status(404).json({ 
        message: "No emotion logs found" 
      });
    }

    // Find the LATEST session directory (newest by modification time)
    const sessionDirs = fs.readdirSync(logsPath)
      .filter(file => {
        const fullPath = path.join(logsPath, file);
        return fs.statSync(fullPath).isDirectory();
      })
      .map(dir => ({
        name: dir,
        time: fs.statSync(path.join(logsPath, dir)).mtime
      }))
      .sort((a, b) => b.time - a.time); // Sort by newest first

    if (sessionDirs.length === 0) {
      return res.status(404).json({ 
        message: "No session directories found" 
      });
    }

    // Get only the LATEST session directory
    const latestSessionPath = path.join(logsPath, sessionDirs[0].name);

    const faces = [];
    const faceDirectories = fs.readdirSync(latestSessionPath).filter(file => {
      const fullPath = path.join(latestSessionPath, file);
      return fs.statSync(fullPath).isDirectory();
    });
    
    for (const faceDir of faceDirectories) {
      const facePath = path.join(latestSessionPath, faceDir);
      const csvPath = path.join(facePath, 'emotions.csv'); // Use emotions.csv
      
      if (fs.existsSync(csvPath)) {
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        
        if (lines.length > 1) {
          const headers = lines[0].split(',');
          const data = lines.slice(1).map(line => {
            const values = line.split(',');
            const obj = {};
            headers.forEach((header, index) => {
              obj[header.trim()] = values[index] ? parseFloat(values[index]) || values[index] : null;
            });
            return obj;
          });
          
          faces.push({
            faceId: faceDir,
            data: data,
            totalFrames: data.length
          });
        }
      }
    }

    res.status(200).json({
      totalFaces: faces.length,
      faces: faces
    });

  } catch (error) {
    console.error('Error getting emotion logs:', error);
    res.status(500).json({ 
      message: "Failed to get emotion logs", 
      error: error.message 
    });
  }
};
