import React, { useState, useEffect, useRef } from 'react';
import './EmotionTest.css';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const EmotionTest = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [abortController, setAbortController] = useState(null); // For canceling requests
    const [isCameraRunning, setIsCameraRunning] = useState(false); // Camera status
    const [realtimeData, setRealtimeData] = useState([]); // Realtime emotion data from camera
    const [realtimeAnalysis, setRealtimeAnalysis] = useState(null); // Analysis of realtime data
    const intervalRef = useRef(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

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
            
            const response = await fetch(`${API_URL}/api/emotions/analyze`, {
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
                console.log('📊 Emotion data received:', data.data);
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
            
            const response = await fetch(`${API_URL}/api/camera/start`, {
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
                startRealtimePolling(); // Start polling for realtime data
            } else {
                setError(data.message || 'Không thể khởi động camera');
                setIsCameraRunning(false);
            }
        } catch (err) {
            setError('Không thể kết nối đến server: ' + err.message);
            setIsCameraRunning(false);
        }
    };

    // Realtime polling functions
    const startRealtimePolling = () => {
        // Clear existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        // Poll immediately
        fetchRealtimeData();

        // Then poll every second
        intervalRef.current = setInterval(() => {
            fetchRealtimeData();
        }, 1000);
    };

    const stopRealtimePolling = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const fetchRealtimeData = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_URL}/api/camera/emotion-data`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.data) {
                    setRealtimeData(prevData => {
                        const newData = [...prevData, data.data];
                        // Keep only last 50 data points for performance
                        return newData.slice(-50);
                    });
                    
                    // Update analysis
                    analyzeRealtimeData([...realtimeData, data.data].slice(-50));
                }
            }
        } catch (err) {
            console.error('Error fetching realtime data:', err);
        }
    };

    const analyzeRealtimeData = (data) => {
        if (!data || data.length === 0) {
            setRealtimeAnalysis(null);
            return;
        }

        const emotions = ['happy', 'sad', 'surprise', 'angry', 'disgust'];
        const analysis = {
            total: data.length,
            averages: {},
            dominant: null,
            trend: null,
            stability: null
        };

        // Calculate averages
        emotions.forEach(emotion => {
            const sum = data.reduce((acc, d) => acc + (d[emotion] || 0), 0);
            analysis.averages[emotion] = ((sum / data.length) * 100).toFixed(1);
        });

        // Find dominant emotion
        const maxEmotion = Object.entries(analysis.averages)
            .reduce((max, [emotion, value]) => 
                parseFloat(value) > parseFloat(max.value) ? { emotion, value } : max
            , { emotion: 'unknown', value: 0 });
        analysis.dominant = maxEmotion;

        // Calculate trend (last 10 vs first 10)
        if (data.length >= 20) {
            const first10 = data.slice(0, 10);
            const last10 = data.slice(-10);
            
            const firstAvg = first10.reduce((acc, d) => acc + (d[maxEmotion.emotion] || 0), 0) / 10;
            const lastAvg = last10.reduce((acc, d) => acc + (d[maxEmotion.emotion] || 0), 0) / 10;
            
            const change = ((lastAvg - firstAvg) / firstAvg * 100).toFixed(1);
            analysis.trend = {
                emotion: maxEmotion.emotion,
                change: change,
                direction: change > 5 ? 'tăng' : change < -5 ? 'giảm' : 'ổn định'
            };
        }

        // Calculate stability (variance)
        const values = data.map(d => d[maxEmotion.emotion] || 0);
        const mean = values.reduce((a, b) => a + b) / values.length;
        const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        analysis.stability = stdDev < 0.1 ? 'ổn định' : stdDev < 0.2 ? 'khá ổn định' : 'dao động';

        setRealtimeAnalysis(analysis);
    };

    const handleStopCamera = async () => {
        try {
            setError('');
            stopRealtimePolling(); // Stop polling
            
            const token = localStorage.getItem('accessToken');
            
            console.log('🛑 Stopping camera...');
            const response = await fetch(`${API_URL}/api/camera/stop`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log('📡 Response from backend:', data);

            if (response.ok && data.status === 'stopped') {
                setIsCameraRunning(false);
                
                // Display results from database
                if (data.sessionData && data.sessionData.emotions && data.sessionData.emotions.length > 0) {
                    console.log('✅ Setting results with', data.sessionData.totalFaces, 'faces');
                    setResults(data.sessionData);
                    alert(`⏹️ Camera đã dừng! Đã phát hiện ${data.sessionData.totalFaces} khuôn mặt và lưu vào database.`);
                } else {
                    console.warn('⚠️ No faces detected');
                    alert('⏹️ Camera đã dừng! Không phát hiện khuôn mặt nào.');
                }
                
                // Keep realtime analysis visible
            } else {
                setError(data.message || 'Không thể dừng camera');
            }
        } catch (err) {
            console.error('❌ Error stopping camera:', err);
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

                    {/* Realtime Analysis Section - Show when camera is running OR after stopped if data exists */}
                    {realtimeAnalysis && (realtimeData.length > 0) && (
                        <div className="realtime-analysis-section">
                            <h4>
                                {isCameraRunning ? '📈 Phân Tích Realtime (Không lưu vào báo cáo)' : '📊 Kết Quả Phân Tích Camera'}
                            </h4>
                            
                            <div className="analysis-summary">
                                <div className="analysis-card">
                                    <span className="analysis-label">📊 Mẫu dữ liệu</span>
                                    <span className="analysis-value">{realtimeAnalysis.total}</span>
                                </div>
                                
                                <div className="analysis-card highlight">
                                    <span className="analysis-label">🎯 Cảm xúc chi phối</span>
                                    <span className="analysis-value">
                                        {realtimeAnalysis.dominant.emotion === 'happy' ? '😊 Vui vẻ' :
                                         realtimeAnalysis.dominant.emotion === 'sad' ? '😢 Buồn' :
                                         realtimeAnalysis.dominant.emotion === 'surprise' ? '😲 Ngạc nhiên' :
                                         realtimeAnalysis.dominant.emotion === 'angry' ? '😠 Tức giận' : '🤢 Ghê tởm'}
                                        ({realtimeAnalysis.dominant.value}%)
                                    </span>
                                </div>
                                
                                {realtimeAnalysis.trend && (
                                    <div className="analysis-card">
                                        <span className="analysis-label">📉 Xu hướng</span>
                                        <span className="analysis-value">
                                            {realtimeAnalysis.trend.direction === 'tăng' ? '📈' :
                                             realtimeAnalysis.trend.direction === 'giảm' ? '📉' : '➡️'}
                                            {' '}{realtimeAnalysis.trend.direction} ({realtimeAnalysis.trend.change}%)
                                        </span>
                                    </div>
                                )}
                                
                                <div className="analysis-card">
                                    <span className="analysis-label">⚖️ Độ ổn định</span>
                                    <span className="analysis-value">{realtimeAnalysis.stability}</span>
                                </div>
                            </div>

                            <div className="emotion-breakdown">
                                <h5>Chi tiết cảm xúc:</h5>
                                <div className="emotion-bars">
                                    {Object.entries(realtimeAnalysis.averages).map(([emotion, value]) => {
                                        const emotionName = emotion === 'happy' ? 'Vui vẻ' :
                                                          emotion === 'sad' ? 'Buồn' :
                                                          emotion === 'surprise' ? 'Ngạc nhiên' :
                                                          emotion === 'angry' ? 'Tức giận' : 'Ghê tởm';
                                        const emoji = emotion === 'happy' ? '😊' :
                                                     emotion === 'sad' ? '😢' :
                                                     emotion === 'surprise' ? '😲' :
                                                     emotion === 'angry' ? '😠' : '🤢';
                                        
                                        return (
                                            <div key={emotion} className="emotion-bar-item">
                                                <span className="emotion-name">{emoji} {emotionName}</span>
                                                <div className="emotion-bar-container">
                                                    <div 
                                                        className="emotion-bar-fill" 
                                                        style={{ width: `${value}%` }}
                                                    />
                                                </div>
                                                <span className="emotion-percent">{value}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {isCameraRunning && (
                                <p className="analysis-note">
                                    ⚠️ Lưu ý: Phân tích này chỉ hiển thị realtime và không được lưu vào báo cáo phân tích.
                                </p>
                            )}
                            
                            {!isCameraRunning && (
                                <div className="analysis-actions">
                                    <button 
                                        className="btn-clear-analysis"
                                        onClick={() => {
                                            setRealtimeData([]);
                                            setRealtimeAnalysis(null);
                                        }}
                                    >
                                        🗑️ Xóa kết quả
                                    </button>
                                </div>
                            )}
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
                    <div className="results-header">
                        <h3>📊 Kết Quả Phân Tích</h3>
                        <div className="results-meta">
                            <span className="meta-badge">
                                <span className="meta-icon">👤</span>
                                <span className="meta-label">Số khuôn mặt:</span>
                                <span className="meta-value">{results.totalFaces}</span>
                            </span>
                            <span className="meta-badge">
                                <span className="meta-icon">🎬</span>
                                <span className="meta-label">Loại file:</span>
                                <span className="meta-value">{results.isVideo ? 'Video' : 'Ảnh'}</span>
                            </span>
                        </div>
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

                    <div className="people-grid-section">
                        <div className="section-header">
                            <h4>👥 Kết Quả Nhận Diện</h4>
                            <p className="section-subtitle">{results.totalFaces} khuôn mặt được phát hiện</p>
                        </div>
                        
                        <div className="people-grid">
                            {results.emotions.map((person, idx) => {
                                // Tìm cảm xúc chi phối
                                const emotions = [
                                    { name: 'Vui vẻ', value: person.happy, emoji: '😊', color: '#FFD700' },
                                    { name: 'Buồn', value: person.sad, emoji: '😢', color: '#4169E1' },
                                    { name: 'Ngạc nhiên', value: person.surprise, emoji: '😮', color: '#FF69B4' },
                                    { name: 'Tức giận', value: person.angry, emoji: '😠', color: '#FF4500' },
                                    { name: 'Ghê tởm', value: person.disgust, emoji: '🤢', color: '#8B4513' }
                                ];
                                const dominant = emotions.reduce((max, e) => e.value > max.value ? e : max);

                                return (
                                    <div key={idx} className="person-grid-card">
                                        <div className="card-header">
                                            {person.faceImage ? (
                                                <img 
                                                    src={`${API_URL}${person.faceImage}`} 
                                                    alt={`Face ${person.id}`}
                                                    className="person-avatar"
                                                />
                                            ) : (
                                                <div className="person-avatar-placeholder">
                                                    <span>�</span>
                                                </div>
                                            )}
                                            <div className="card-title">
                                                <h5>Người #{person.id}</h5>
                                                <span className="person-badge">{person.faceId}</span>
                                            </div>
                                        </div>

                                        <div className="dominant-emotion">
                                            <span className="dominant-emoji">{dominant.emoji}</span>
                                            <div className="dominant-info">
                                                <span className="dominant-label">Cảm xúc chi phối</span>
                                                <span className="dominant-name">{dominant.name}</span>
                                                <span className="dominant-value">{(dominant.value * 100).toFixed(1)}%</span>
                                            </div>
                                        </div>

                                        <div className="emotions-compact">
                                            {emotions.map(emotion => (
                                                <div key={emotion.name} className="emotion-compact-item">
                                                    <span className="compact-emoji">{emotion.emoji}</span>
                                                    <div className="compact-bar-bg">
                                                        <div 
                                                            className="compact-bar-fill" 
                                                            style={{
                                                                width: `${emotion.value * 100}%`,
                                                                background: emotion.color
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className="compact-value">{(emotion.value * 100).toFixed(0)}%</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="card-footer">
                                            <span className="footer-icon"></span>
                                            <span className="footer-text">{person.numFrames} frames</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmotionTest;
