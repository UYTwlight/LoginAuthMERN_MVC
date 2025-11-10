import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './CameraView.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const EMOTION_COLORS = {
  Happy: '#4CAF50',
  Sad: '#2196F3',
  Surprise: '#FF9800',
  Angry: '#f44336',
  Disgust: '#9C27B0'
};

const EMOTION_LABELS = {
  happy: 'Vui vẻ',
  sad: 'Buồn',
  surprise: 'Ngạc nhiên',
  angry: 'Tức giận',
  disgust: 'Ghê tởm'
};

const CameraView = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [emotionData, setEmotionData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const intervalRef = useRef(null);
  const logsIntervalRef = useRef(null);

  // Check camera status on mount
  useEffect(() => {
    checkCameraStatus();
    return () => {
      stopPolling();
      stopLogsPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if camera is running
  const checkCameraStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${API_URL}/api/camera/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true
        }
      );

      if (response.data.isRunning) {
        setIsRunning(true);
        startPolling();
      }
    } catch (err) {
      console.error('Error checking camera status:', err);
    }
  };

  // Start camera
  const handleStartCamera = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_URL}/api/camera/start`,
        {
          modelPath: 'MobileNet_custom.onnx',
          cameraId: '0'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true
        }
      );

      if (response.status === 200) {
        setIsRunning(true);
        startPolling();
        startLogsPolling(); // Start logs polling every 10 seconds
      }
    } catch (err) {
      console.error('Error starting camera:', err);
      setError(err.response?.data?.message || 'Không thể khởi động camera');
    } finally {
      setLoading(false);
    }
  };

  // Stop camera
  const handleStopCamera = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      await axios.post(
        `${API_URL}/api/camera/stop`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true
        }
      );

      setIsRunning(false);
      stopPolling();
      stopLogsPolling(); // Stop logs polling
      setEmotionData([]);
      
      // Load final logs after stopping
      setTimeout(() => {
        loadLogs();
      }, 1000);
    } catch (err) {
      console.error('Error stopping camera:', err);
      setError(err.response?.data?.message || 'Không thể dừng camera');
    } finally {
      setLoading(false);
    }
  };

  // Poll for emotion data
  const startPolling = () => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Poll every 1 second
    intervalRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem('accessToken');
        
        // Check camera status first
        const statusResponse = await axios.get(
          `${API_URL}/api/camera/status`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            withCredentials: true
          }
        );

        // If camera stopped externally (e.g., window closed), update UI
        if (!statusResponse.data.isRunning) {
          console.log('Camera stopped externally, updating UI...');
          setIsRunning(prevState => {
            if (prevState) {
              // Only do cleanup if we were running
              stopPolling();
              stopLogsPolling();
              setEmotionData([]);
              // Load final logs
              setTimeout(() => {
                loadLogs();
              }, 1000);
            }
            return false;
          });
          return;
        }

        // Fetch emotion data if camera is running
        const response = await axios.get(
          `${API_URL}/api/camera/emotion-data`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            withCredentials: true
          }
        );

        if (response.data.emotionData && response.data.emotionData.length > 0) {
          setEmotionData(response.data.emotionData);
        }
      } catch (err) {
        console.error('Error fetching emotion data:', err);
        // If error 404 or connection refused, camera might have stopped
        if (err.response?.status === 404 || err.code === 'ECONNREFUSED') {
          setIsRunning(false);
          stopPolling();
          stopLogsPolling();
          setEmotionData([]);
        }
      }
    }, 1000);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Poll for logs every 10 seconds
  const startLogsPolling = () => {
    // Clear existing logs interval
    if (logsIntervalRef.current) {
      clearInterval(logsIntervalRef.current);
    }

    // Load logs immediately first
    loadLogs();

    // Then poll every 10 seconds
    logsIntervalRef.current = setInterval(() => {
      loadLogs();
    }, 10000);
  };

  const stopLogsPolling = () => {
    if (logsIntervalRef.current) {
      clearInterval(logsIntervalRef.current);
      logsIntervalRef.current = null;
    }
  };

  // Load emotion logs
  const loadLogs = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${API_URL}/api/camera/logs`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true
        }
      );

      setLogs(response.data.faces || []);
    } catch (err) {
      console.error('Error loading logs:', err);
    }
  };

  // Get dominant emotion
  const getDominantEmotion = (emotions) => {
    if (!emotions) return { emotion: 'Unknown', value: 0 };
    
    const emotionEntries = Object.entries(emotions).filter(([key]) => 
      ['happy', 'sad', 'surprise', 'angry', 'disgust'].includes(key)
    );
    
    if (emotionEntries.length === 0) return { emotion: 'Unknown', value: 0 };
    
    const [emotion, value] = emotionEntries.reduce((max, entry) => 
      entry[1] > max[1] ? entry : max
    );
    
    return { 
      emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1), 
      value: (value * 100).toFixed(1) 
    };
  };

  // Get emotion color
  const getEmotionColor = (emotion) => {
    const colors = {
      Happy: '#4CAF50',
      Sad: '#2196F3',
      Surprise: '#FF9800',
      Angry: '#f44336',
      Disgust: '#9C27B0',
      Unknown: '#757575'
    };
    return colors[emotion] || '#757575';
  };

  // Calculate average emotions
  const getAverageEmotions = () => {
    if (emotionData.length === 0) return null;

    const emotions = ['happy', 'sad', 'surprise', 'angry', 'disgust'];
    const averages = {};

    emotions.forEach(emotion => {
      const sum = emotionData.reduce((acc, data) => acc + (data[emotion] || 0), 0);
      averages[emotion] = ((sum / emotionData.length) * 100).toFixed(1);
    });

    return averages;
  };

  const averageEmotions = getAverageEmotions();

  // Prepare chart data for realtime visualization
  const getChartData = () => {
    if (emotionData.length === 0) return { lineData: [], barData: [] };

    // Line chart - last 20 data points for performance
    const recentData = emotionData.slice(-20);
    const lineData = recentData.map((data, index) => ({
      time: index + 1,
      'Vui vẻ': (data.happy || 0) * 100,
      'Buồn': (data.sad || 0) * 100,
      'Ngạc nhiên': (data.surprise || 0) * 100,
      'Tức giận': (data.angry || 0) * 100,
      'Ghê tởm': (data.disgust || 0) * 100
    }));

    // Bar chart - average emotions
    const barData = averageEmotions ? Object.entries(averageEmotions).map(([emotion, value]) => ({
      emotion: EMOTION_LABELS[emotion],
      giáTrị: parseFloat(value)
    })) : [];

    return { lineData, barData };
  };

  return (
    <div className="camera-view-container">
      <div className="camera-header">
        <div>
          <h2>Camera 1 - Webcam (Emotion Detection)</h2>
          <div className="camera-controls">
            {!isRunning ? (
              <button 
                onClick={handleStartCamera} 
                disabled={loading}
                className="btn-start"
              >
                {loading ? 'Đang khởi động...' : '▶ Bắt đầu'}
              </button>
            ) : (
              <button 
                onClick={handleStopCamera} 
                disabled={loading}
                className="btn-stop"
              >
                {loading ? 'Đang dừng...' : '⏹ Dừng'}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <div className="camera-info">
        <div className="info-item">
          <span className="info-label">Trạng thái:</span>
          <span className={`info-value ${isRunning ? 'active' : 'inactive'}`}>
            {isRunning ? '🟢 Đang chạy' : '🔴 Dừng'}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Nguồn:</span>
          <span className="info-value">C++ OpenCV (YuNet + MobileNet)</span>
        </div>
        <div className="info-item">
          <span className="info-label">Dữ liệu:</span>
          <span className="info-value">
            {emotionData.length > 0 
              ? `${emotionData.length} điểm` 
              : (isRunning ? '⏳ Đang chờ...' : 'Chưa có dữ liệu')
            }
          </span>
        </div>
      </div>

      <div className="camera-content">
        <div className="video-section">
          <div className="video-placeholder">
            {isRunning ? (
              <>
                <div className="camera-icon">📹</div>
                <p>Camera đang chạy trong C++ process</p>
                <p className="small-text">Xem cửa sổ OpenCV để theo dõi video trực tiếp</p>
              </>
            ) : (
              <>
                <div className="camera-icon">📷</div>
                <p>Camera chưa được khởi động</p>
                <p className="small-text">Nhấn "Bắt đầu" để khởi động emotion detection</p>
              </>
            )}
          </div>
        </div>

        <div className="emotion-section">
          <h3>🎭 Kết quả Cảm xúc Realtime</h3>
          
          {!isRunning && emotionData.length === 0 && (
            <div className="no-data">
              <p>📹 Bật camera để bắt đầu phát hiện cảm xúc realtime</p>
            </div>
          )}

          {isRunning && (
            <>
              {emotionData.length === 0 && (
                <div className="no-data pulse-waiting">
                  <div className="waiting-icon">🔍</div>
                  <p>⏳ Camera đã khởi động - Đang chờ phát hiện khuôn mặt...</p>
                  <p className="small-hint">Hướng camera về phía khuôn mặt để bắt đầu phân tích</p>
                </div>
              )}
              
              {emotionData.length > 0 && (
                <>
                  <div className="emotion-overview">
                    <div className="overview-header">
                      <h4>📊 Tổng quan Cảm xúc Hiện tại</h4>
                      <span className="data-count">
                        {emotionData.length} mẫu dữ liệu
                      </span>
                    </div>
                    
                    {averageEmotions && (
                      <div className="emotion-stats-main">
                        <div className="stats-grid-main">
                          {Object.entries(averageEmotions).map(([emotion, value]) => {
                            const emotionName = emotion.charAt(0).toUpperCase() + emotion.slice(1);
                            const emotionLabel = EMOTION_LABELS[emotion] || emotionName;
                            return (
                              <div key={emotion} className="stat-card">
                                <div className="stat-card-header">
                                  <span className="stat-emoji">
                                    {emotion === 'happy' ? '😊' : 
                                     emotion === 'sad' ? '😢' : 
                                     emotion === 'surprise' ? '😲' : 
                                     emotion === 'angry' ? '😠' : '🤢'}
                                  </span>
                                  <span className="stat-name">{emotionLabel}</span>
                                </div>
                                <div className="stat-card-body">
                                  <div className="stat-bar-large">
                                    <div 
                                      className="stat-bar-fill-large"
                                      style={{ 
                                        width: `${value}%`,
                                        backgroundColor: EMOTION_COLORS[emotionName]
                                      }}
                                    />
                                  </div>
                                  <span className="stat-value-large">{value}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="emotion-list">
                    <h4>� Phát hiện gần đây (5 mẫu cuối):</h4>
                    {emotionData.slice(-5).reverse().map((data, index) => {
                      const dominant = getDominantEmotion(data);
                      return (
                        <div key={index} className="emotion-item">
                          <div className="emotion-info">
                            <span 
                              className="emotion-label"
                              style={{ color: getEmotionColor(dominant.emotion) }}
                            >
                              {EMOTION_LABELS[dominant.emotion.toLowerCase()] || dominant.emotion}
                            </span>
                            <span className="emotion-confidence">
                              {dominant.value}%
                            </span>
                          </div>
                          <div className="emotion-bar">
                            <div 
                              className="emotion-bar-fill"
                              style={{ 
                                width: `${dominant.value}%`,
                                backgroundColor: getEmotionColor(dominant.emotion)
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* Live Logs - Show when camera is running */}
          {isRunning && (
            <div className="logs-section live-logs">
              <div className="logs-header">
                <h4>📋 Nhật Ký Phát Hiện Trực Tiếp</h4>
                <span className="log-count">
                  {logs.length > 0 ? `${logs.length} khuôn mặt` : 'Đang chờ...'}
                </span>
              </div>
              {logs.length > 0 ? (
                <div className="logs-list">
                  {logs.map((log, index) => (
                    <div key={index} className="log-item">
                      <div className="log-icon">👤</div>
                      <div className="log-details">
                        <strong>{log.faceId}</strong>
                        <span className="log-frames">{log.totalFrames} frames đã ghi</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="logs-empty">
                  <p>⏳ Chưa phát hiện khuôn mặt nào</p>
                  <p className="small-text">Logs sẽ tự động cập nhật mỗi 10 giây</p>
                </div>
              )}
            </div>
          )}

          {/* Historical Logs - Show when stopped */}
          {!isRunning && logs.length > 0 && (
            <div className="logs-section">
              <div className="logs-header">
                <h4>📋 Lịch Sử Phát Hiện</h4>
                <span className="log-count">{logs.length} khuôn mặt</span>
              </div>
              <div className="logs-list">
                {logs.map((log, index) => (
                  <div key={index} className="log-item">
                    <strong>{log.faceId}</strong>
                    <span>{log.totalFrames} frames</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="instructions">
        <h4>📝 Hướng dẫn:</h4>
        <ol>
          <li>Nhấn <strong>"Bắt đầu"</strong> để khởi động C++ emotion detection process</li>
          <li>Một cửa sổ OpenCV sẽ hiện ra hiển thị video từ webcam</li>
          <li>Kết quả cảm xúc và biểu đồ realtime sẽ tự động cập nhật mỗi giây</li>
          <li>Nhật ký phát hiện khuôn mặt sẽ tự động cập nhật mỗi 10 giây</li>
          <li>Nhấn <strong>ESC</strong> trong cửa sổ OpenCV hoặc <strong>"Dừng"</strong> để tắt</li>
          <li>Sau khi dừng, lịch sử cuối cùng sẽ được hiển thị tự động</li>
          <li>Dữ liệu được lưu trong thư mục <code>Emotion-statistics/face_logs/</code></li>
        </ol>
      </div>
    </div>
  );
};

export default CameraView;
