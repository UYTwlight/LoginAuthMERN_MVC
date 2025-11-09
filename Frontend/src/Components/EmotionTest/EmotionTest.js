import React, { useState } from 'react';
import './EmotionTest.css';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const EmotionTest = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [abortController, setAbortController] = useState(null); // For canceling requests
    const [isCameraRunning, setIsCameraRunning] = useState(false); // Camera status

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setError('');
            setResults(null);

            // Tạo preview cho ảnh
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreview(reader.result);
                };
                reader.readAsDataURL(file);
            } else {
                setPreview(null);
            }
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Vui lòng chọn file để upload');
            return;
        }

        setLoading(true);
        setError('');

        // Create AbortController for cancellation
        const controller = new AbortController();
        setAbortController(controller);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            // Get the JWT token from localStorage
            const token = localStorage.getItem('accessToken');
            
            const response = await fetch('http://localhost:3001/api/emotions/analyze', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
                signal: controller.signal // Add abort signal
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setResults(data.data);
            } else {
                // Show more detailed error information
                let errorMsg = data.error || 'Có lỗi xảy ra khi xử lý file';
                if (data.details) {
                    errorMsg += '\n\nChi tiết: ' + data.details;
                }
                if (data.stdout) {
                    errorMsg += '\n\nOutput: ' + data.stdout;
                }
                if (data.stderr) {
                    errorMsg += '\n\nError output: ' + data.stderr;
                }
                setError(errorMsg);
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                setError('Phân tích đã bị hủy');
            } else {
                setError('Không thể kết nối đến server: ' + err.message);
            }
        } finally {
            setLoading(false);
            setAbortController(null);
        }
    };

    const handleStopAnalysis = () => {
        if (abortController) {
            abortController.abort();
            setLoading(false);
            setAbortController(null);
            setError('Đã dừng phân tích');
        }
    };

    const handleStartCamera = async () => {
        try {
            setError('');
            setIsCameraRunning(true);
            
            const token = localStorage.getItem('accessToken');
            
            const response = await fetch('http://localhost:3001/api/camera/start', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    modelPath: 'MobileNet_custom.onnx',
                    cameraId: '0'
                })
            });

            const data = await response.json();

            if (response.ok && data.status === 'active') {
                alert('✅ Camera đã được khởi động! Kiểm tra cửa sổ OpenCV.');
            } else {
                setError(data.message || 'Không thể khởi động camera');
                setIsCameraRunning(false);
            }
        } catch (err) {
            setError('Không thể kết nối đến server: ' + err.message);
            setIsCameraRunning(false);
        }
    };

    const handleStopCamera = async () => {
        try {
            setError('');
            
            const token = localStorage.getItem('accessToken');
            
            const response = await fetch('http://localhost:3001/api/camera/stop', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok && data.status === 'stopped') {
                alert('⏹️ Camera đã dừng!');
                setIsCameraRunning(false);
            } else {
                setError(data.message || 'Không thể dừng camera');
            }
        } catch (err) {
            setError('Không thể kết nối đến server: ' + err.message);
        }
    };

    // Tạo dữ liệu cho biểu đồ
    const getChartData = (emotionData) => {
        if (!emotionData || emotionData.length === 0) return null;

        const emotions = ['Happy', 'Sad', 'Surprise', 'Angry', 'Disgust'];
        const colors = ['#FFD700', '#4169E1', '#FF69B4', '#FF4500', '#8B4513'];

        // Nếu có nhiều người, lấy trung bình
        const avgEmotions = emotions.map((_, idx) => {
            const sum = emotionData.reduce((acc, person) => {
                const values = [person.happy, person.sad, person.surprise, person.angry, person.disgust];
                return acc + values[idx];
            }, 0);
            return (sum / emotionData.length * 100).toFixed(2);
        });

        return {
            labels: emotions,
            datasets: [{
                data: avgEmotions,
                backgroundColor: colors,
                borderColor: colors.map(c => c + '80'),
                borderWidth: 2
            }]
        };
    };

    return (
        <div className="emotion-test-container">
            <h2>🧪 Kiểm Tra Mô Hình Nhận Diện Cảm Xúc</h2>

            <div className="test-options">
                <div className="option-card">
                    <h3>📷 Test Realtime với Camera</h3>
                    <p>Khởi động camera để nhận diện cảm xúc realtime</p>
                    
                    <div className="camera-controls">
                        {!isCameraRunning ? (
                            <button 
                                className="btn-camera btn-start" 
                                onClick={handleStartCamera}
                            >
                                ▶️ Bật Camera
                            </button>
                        ) : (
                            <div className="camera-running">
                                <div className="status-indicator">
                                    <span className="pulse-dot"></span>
                                    <span className="status-text">Camera đang chạy...</span>
                                </div>
                                <button 
                                    className="btn-camera btn-stop" 
                                    onClick={handleStopCamera}
                                >
                                    ⏹️ Dừng Camera
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {isCameraRunning && (
                        <div className="camera-info">
                            <p>✅ Cửa sổ OpenCV đang hiển thị video</p>
                            <p>📊 Dữ liệu được lưu vào: <code>face_logs/Camera_0</code></p>
                            <p>💡 Nhấn ESC trong cửa sổ OpenCV hoặc nút Dừng để tắt</p>
                        </div>
                    )}
                </div>

                <div className="option-card">
                    <h3>📁 Test với Ảnh/Video</h3>
                    <p>Upload ảnh hoặc video để phân tích cảm xúc</p>
                    
                    <div className="upload-section">
                        <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                            id="file-upload"
                            className="file-input"
                        />
                        <label htmlFor="file-upload" className="file-label">
                            {selectedFile ? selectedFile.name : 'Chọn file...'}
                        </label>

                        {preview && (
                            <div className="preview">
                                <img src={preview} alt="Preview" />
                            </div>
                        )}

                        <div className="button-group">
                            <button
                                className="btn-upload"
                                onClick={handleUpload}
                                disabled={!selectedFile || loading}
                            >
                                {loading ? '⏳ Đang xử lý...' : '🔍 Phân Tích'}
                            </button>
                            
                            {loading && (
                                <button
                                    className="btn-stop"
                                    onClick={handleStopAnalysis}
                                >
                                    ⏹ Dừng
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    ❌ {error}
                </div>
            )}

            {results && (
                <div className="results-section">
                    <h3>📊 Kết Quả Phân Tích</h3>
                    <div className="results-summary">
                        <p>👤 Tổng số khuôn mặt phát hiện: <strong>{results.totalFaces}</strong></p>
                        <p>🎬 Loại file: <strong>{results.isVideo ? 'Video' : 'Ảnh'}</strong></p>
                    </div>

                    <div className="charts-container">
                        {getChartData(results.emotions) && (
                            <>
                                <div className="chart-box">
                                    <h4>Biểu Đồ Tròn - Tỷ Lệ Cảm Xúc</h4>
                                    <Pie data={getChartData(results.emotions)} />
                                </div>
                                <div className="chart-box">
                                    <h4>Biểu Đồ Cột - Phân Bố Cảm Xúc</h4>
                                    <Bar 
                                        data={getChartData(results.emotions)}
                                        options={{
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    max: 100,
                                                    ticks: {
                                                        callback: function(value) {
                                                            return value + '%';
                                                        }
                                                    }
                                                }
                                            },
                                            plugins: {
                                                legend: {
                                                    display: false
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="emotion-details">
                        <h4>Chi Tiết Từng Khuôn Mặt</h4>
                        {results.emotions.map((person, idx) => (
                            <div key={idx} className="person-card">
                                <h5>👤 Người #{person.id}</h5>
                                <div className="emotion-bars">
                                    <div className="emotion-bar">
                                        <span className="label">😊 Happy</span>
                                        <div className="bar-container">
                                            <div className="bar happy" style={{width: `${person.happy * 100}%`}}></div>
                                            <span className="percentage">{(person.happy * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                    <div className="emotion-bar">
                                        <span className="label">😢 Sad</span>
                                        <div className="bar-container">
                                            <div className="bar sad" style={{width: `${person.sad * 100}%`}}></div>
                                            <span className="percentage">{(person.sad * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                    <div className="emotion-bar">
                                        <span className="label">😮 Surprise</span>
                                        <div className="bar-container">
                                            <div className="bar surprise" style={{width: `${person.surprise * 100}%`}}></div>
                                            <span className="percentage">{(person.surprise * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                    <div className="emotion-bar">
                                        <span className="label">😠 Angry</span>
                                        <div className="bar-container">
                                            <div className="bar angry" style={{width: `${person.angry * 100}%`}}></div>
                                            <span className="percentage">{(person.angry * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                    <div className="emotion-bar">
                                        <span className="label">🤢 Disgust</span>
                                        <div className="bar-container">
                                            <div className="bar disgust" style={{width: `${person.disgust * 100}%`}}></div>
                                            <span className="percentage">{(person.disgust * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="frame-count">📹 Số frame phân tích: <strong>{person.numFrames}</strong></p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmotionTest;
