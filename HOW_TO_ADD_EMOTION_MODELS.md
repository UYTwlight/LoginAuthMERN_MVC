# How to Add New Emotion Models

This guide explains how to add new emotion detection models to the system.

## Prerequisites

- New emotion model in ONNX format
- Model input size: 64x64 pixels
- Model output: 5 emotions (Happy, Sad, Surprise, Angry, Disgust)

## Steps

### 1. Add Model File

Place your ONNX model file in the `Emotion-statistics` folder:

```
Emotion-statistics/
├── MobileNet_custom.onnx (default)
├── YourNewModel.onnx (your new model)
└── face_detection_yunet_2023mar_int8.onnx (fixed, don't change)
```

**Important**: The face detection model (`face_detection_yunet_2023mar_int8.onnx`) is fixed and should NOT be changed. Only emotion classification models can be swapped.

### 2. Update Frontend Model List

Edit `Frontend/src/Components/Camera/CameraView.js`:

Find the `availableModels` array (around line 15):

```javascript
const availableModels = [
  { value: 'MobileNet_custom.onnx', label: 'MobileNet Custom (Default)' },
  { value: 'YourNewModel.onnx', label: 'Your New Model Name' }  // Add this line
];
```

### 3. Test Your Model

1. **Rebuild if needed** (if model requires code changes):
   ```powershell
   cd Emotion-statistics
   .\build_main.bat
   ```

2. **Test via command line**:
   ```powershell
   cd Emotion-statistics
   $env:PATH += ";$PWD\opencv\build\x64\vc16\bin"
   .\main.exe YourNewModel.onnx 0
   ```

3. **Test via Web Interface**:
   - Start Backend: `cd Backend && npm start`
   - Start Frontend: `cd Frontend && npm start`
   - Go to Camera page
   - Select your model from dropdown
   - Click "Bắt đầu" (Start)

## Model Requirements

### Input
- **Size**: 64x64x3 (RGB)
- **Format**: ONNX
- **Normalization**: Values divided by 255.0 (0-1 range)
- **Color Space**: BGR (OpenCV default)

### Output
- **Format**: Float array of size 5
- **Classes**: [Happy, Sad, Surprise, Angry, Disgust] (in this order)
- **Values**: Probabilities (0.0 - 1.0)

## Architecture

```
┌─────────────────┐
│   Camera Input  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  YuNet (FIXED)  │  ← Face Detection + Tracking
│  Face Detection │     (This model is hardcoded)
└────────┬────────┘
         │ Crop faces
         ▼
┌─────────────────┐
│ MobileNet Model │  ← Emotion Classification
│  (SWITCHABLE)   │     (You can change this)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Emotion Results │
└─────────────────┘
```

## Command Line Usage

The C++ executable accepts these arguments:

```bash
main.exe [model_path] [camera_id]
```

**Examples**:
```bash
# Use default model and camera
main.exe

# Use custom model
main.exe MyCustomModel.onnx

# Use custom model and camera 1
main.exe MyCustomModel.onnx 1
```

## Troubleshooting

### Model Not Loading
- Check file name and path
- Verify ONNX format is correct
- Test with `main.exe YourModel.onnx` directly

### Wrong Predictions
- Verify input preprocessing (64x64, BGR, /255.0)
- Check output class order matches [Happy, Sad, Surprise, Angry, Disgust]
- Test model independently with sample images

### Performance Issues
- Optimize model size
- Use quantized models (INT8)
- Reduce input resolution if possible

## File Locations

- **Models**: `Emotion-statistics/*.onnx`
- **C++ Source**: `Emotion-statistics/main.cpp`
- **Build Script**: `Emotion-statistics/build_main.bat`
- **Frontend Config**: `Frontend/src/Components/Camera/CameraView.js`
- **Backend Controller**: `Backend/src/controllers/CameraController.js`

## Notes

- Face detection uses YuNet (fixed model, not changeable)
- Only emotion classification model is parameterizable
- Models must output 5 emotion classes
- Input size is fixed at 64x64 pixels
- Color space is BGR (OpenCV default)
