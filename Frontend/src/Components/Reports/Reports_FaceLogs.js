import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Reports.css';
import { 
    PieChart, Pie, Cell, 
    BarChart, Bar, 
    LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const COLORS = {
    Happy: '#4CAF50',
    Sad: '#2196F3', 
    Surprise: '#FF9800',
    Angry: '#F44336',
    Disgust: '#9C27B0'
};

const EMOTION_LABELS = {
    Happy: 'Vui vẻ',
    Sad: 'Buồn',
    Surprise: 'Ngạc nhiên',
    Angry: 'Tức giận',
    Disgust: 'Ghê tởm'
};

// Get API URL from environment variable
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Reports = () => {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessionData, setSessionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedFace, setSelectedFace] = useState(null);

    // Lấy danh sách sessions từ face_logs
    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            
            if (!token) {
                console.error('No token found in localStorage');
                setError('Vui lòng đăng nhập để xem báo cáo');
                setLoading(false);
                return;
            }
            
            console.log('Fetching sessions with token:', token ? 'Token exists' : 'No token');
            console.log('API URL:', `${API_URL}/api/emotions/face-logs/sessions`);
            
            const response = await axios.get(`${API_URL}/api/emotions/face-logs/sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('Response received:', response.data);
            
            if (response.data.success) {
                console.log('Sessions data:', response.data.sessions);
                setSessions(response.data.sessions);
                if (response.data.sessions.length > 0) {
                    // Auto-select first session
                    setSelectedSession(response.data.sessions[0].sessionId);
                    console.log('Selected first session:', response.data.sessions[0].sessionId);
                } else {
                    console.warn('No sessions found in response');
                    setError('Không có sessions nào. Hãy chạy C++ app để tạo dữ liệu mới.');
                }
            } else {
                console.error('Response success is false:', response.data);
                setError('API trả về lỗi: ' + (response.data.message || 'Unknown error'));
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching sessions:', err);
            console.error('Error response:', err.response?.data);
            console.error('Error status:', err.response?.status);
            if (err.response && err.response.status === 403) {
                setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                // Optionally redirect to login
                setTimeout(() => {
                    localStorage.removeItem('accessToken');
                    window.location.href = '/login';
                }, 2000);
            } else {
                setError('Không thể tải danh sách sessions: ' + (err.response?.data?.message || err.message));
            }
            setLoading(false);
        }
    };

    // Lấy dữ liệu chi tiết của session được chọn
    useEffect(() => {
        if (selectedSession) {
            fetchSessionData(selectedSession);
        }
    }, [selectedSession]);

    const fetchSessionData = async (sessionId) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            
            if (!token) {
                setError('Vui lòng đăng nhập để xem chi tiết');
                setLoading(false);
                return;
            }
            
            const response = await axios.get(`${API_URL}/api/emotions/face-logs/sessions/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setSessionData(response.data.data);
                if (response.data.data.faces.length > 0) {
                    setSelectedFace(response.data.data.faces[0].faceId);
                }
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching session data:', err);
            if (err.response && err.response.status === 403) {
                setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            } else {
                setError('Không thể tải dữ liệu session: ' + (err.response?.data?.message || err.message));
            }
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    };

    const formatTimestamp = (timestamp) => {
        // Format: 20250109_095348 -> 09/01/2025 09:53:48
        const year = timestamp.substring(0, 4);
        const month = timestamp.substring(4, 6);
        const day = timestamp.substring(6, 8);
        const hour = timestamp.substring(9, 11);
        const minute = timestamp.substring(11, 13);
        const second = timestamp.substring(13, 15);
        return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
    };

    // Chuẩn bị dữ liệu cho Pie Chart (emotion distribution của face được chọn)
    const preparePieChartData = () => {
        if (!sessionData || !selectedFace) return [];
        
        const face = sessionData.faces.find(f => f.faceId === selectedFace);
        if (!face || !face.statistics) return [];

        const dist = face.statistics.emotionDistribution;
        return Object.keys(dist).map(emotion => ({
            name: EMOTION_LABELS[emotion],
            value: dist[emotion],
            color: COLORS[emotion]
        }));
    };

    // Chuẩn bị dữ liệu cho Bar Chart (so sánh emotion trung bình giữa các faces)
    const prepareBarChartData = () => {
        if (!sessionData) return [];

        return sessionData.faces.map(face => {
            const data = { name: face.faceId };
            Object.keys(face.statistics.averageEmotions).forEach(emotion => {
                data[emotion] = parseFloat(face.statistics.averageEmotions[emotion]);
            });
            return data;
        });
    };

    // Chuẩn bị dữ liệu cho Line Chart (emotion timeline của face được chọn)
    const prepareLineChartData = () => {
        if (!sessionData || !selectedFace) return [];
        
        const face = sessionData.faces.find(f => f.faceId === selectedFace);
        if (!face || !face.statistics) return [];

        return face.statistics.timeline;
    };

    // Tính toán tổng quan của session
    const getSessionOverview = () => {
        if (!sessionData) return null;

        const totalFaces = sessionData.faces.length;
        const totalFrames = sessionData.faces.reduce((sum, face) => sum + face.totalFrames, 0);
        
        // Tính emotion distribution tổng của session
        const overallDist = {};
        Object.keys(COLORS).forEach(emotion => {
            overallDist[emotion] = sessionData.faces.reduce((sum, face) => {
                return sum + (face.statistics.emotionDistribution[emotion] || 0);
            }, 0);
        });

        // Tìm dominant emotion của session
        let maxCount = -1;
        let dominantEmotion = null;
        Object.keys(overallDist).forEach(emotion => {
            if (overallDist[emotion] > maxCount) {
                maxCount = overallDist[emotion];
                dominantEmotion = emotion;
            }
        });

        return {
            totalFaces,
            totalFrames,
            dominantEmotion,
            overallDist
        };
    };

    if (loading && !sessionData) {
        return (
            <div className="reports-container">
                <div style={{textAlign: 'center', padding: '50px'}}>
                    <p>Đang tải...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="reports-container">
                <div style={{textAlign: 'center', padding: '50px'}}>
                    <h2 style={{color: '#e74c3c'}}>❌ Lỗi</h2>
                    <p className="error-message">{error}</p>
                    {error.includes('đăng nhập') && (
                        <button 
                            onClick={() => window.location.href = '/login'}
                            style={{
                                marginTop: '20px',
                                padding: '10px 20px',
                                backgroundColor: '#3498db',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            Đến trang đăng nhập
                        </button>
                    )}
                </div>
            </div>
        );
    }

    const overview = getSessionOverview();
    const selectedSessionInfo = sessions.find(s => s.sessionId === selectedSession);

    return (
        <div className="reports-container">
            <h1>Báo Cáo Phân Tích Cảm Xúc</h1>

            {/* Session List */}
            <div className="section">
                <h2>Danh Sách Sessions</h2>
                <div className="sessions-grid">
                    {sessions.map(session => (
                        <div 
                            key={session.sessionId}
                            className={`session-card ${selectedSession === session.sessionId ? 'selected' : ''}`}
                            onClick={() => setSelectedSession(session.sessionId)}
                        >
                            <h3>{session.source}</h3>
                            <p><strong>Thời gian:</strong> {formatTimestamp(session.timestamp)}</p>
                            <p><strong>Số khuôn mặt:</strong> {session.faceCount}</p>
                            <p><strong>Tạo lúc:</strong> {formatDate(session.createdAt)}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Session Overview */}
            {sessionData && overview && (
                <>
                    <div className="section">
                        <h2>Tổng Quan Session: {selectedSessionInfo?.source}</h2>
                        <div className="overview-stats">
                            <div className="stat-card">
                                <h3>{overview.totalFaces}</h3>
                                <p>Số khuôn mặt</p>
                            </div>
                            <div className="stat-card">
                                <h3>{overview.totalFrames}</h3>
                                <p>Tổng số frames</p>
                            </div>
                            <div className="stat-card">
                                <h3>{EMOTION_LABELS[overview.dominantEmotion]}</h3>
                                <p>Cảm xúc chủ đạo</p>
                            </div>
                        </div>
                    </div>

                    {/* Face Selection */}
                    <div className="section">
                        <h2>Chọn Khuôn Mặt</h2>
                        <div className="face-selector">
                            {sessionData.faces.map(face => (
                                <button
                                    key={face.faceId}
                                    className={`face-btn ${selectedFace === face.faceId ? 'selected' : ''}`}
                                    onClick={() => setSelectedFace(face.faceId)}
                                >
                                    {face.faceId}
                                    <span className="frame-count">({face.totalFrames} frames)</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Selected Face Details */}
                    {selectedFace && sessionData.faces.find(f => f.faceId === selectedFace) && (
                        <div className="section">
                            <h2>Chi Tiết {selectedFace}</h2>
                            <div className="face-details">
                                {/* First Frame Image */}
                                {sessionData.faces.find(f => f.faceId === selectedFace).firstFrameImage && (
                                    <div className="first-frame">
                                        <h3>Frame đầu tiên</h3>
                                        <img 
                                            src={`${API_URL}${sessionData.faces.find(f => f.faceId === selectedFace).firstFrameImage}`}
                                            alt={`${selectedFace} first frame`}
                                        />
                                    </div>
                                )}

                                {/* Statistics */}
                                <div className="face-stats">
                                    <h3>Thống kê</h3>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Cảm xúc</th>
                                                <th>Giá trị TB</th>
                                                <th>Số frames</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.keys(COLORS).map(emotion => {
                                                const stats = sessionData.faces.find(f => f.faceId === selectedFace).statistics;
                                                return (
                                                    <tr key={emotion}>
                                                        <td style={{color: COLORS[emotion]}}><strong>{EMOTION_LABELS[emotion]}</strong></td>
                                                        <td>{stats.averageEmotions[emotion]}</td>
                                                        <td>{stats.emotionDistribution[emotion]}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    <p><strong>Cảm xúc chủ đạo:</strong> <span style={{color: COLORS[sessionData.faces.find(f => f.faceId === selectedFace).statistics.dominantEmotion]}}>{EMOTION_LABELS[sessionData.faces.find(f => f.faceId === selectedFace).statistics.dominantEmotion]}</span></p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Charts */}
                    <div className="charts-container">
                        {/* Pie Chart - Emotion Distribution */}
                        <div className="chart-section">
                            <h3>Phân Bố Cảm Xúc ({selectedFace})</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={preparePieChartData()}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {preparePieChartData().map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Bar Chart - Compare faces */}
                        <div className="chart-section full-width">
                            <h3>So Sánh Cảm Xúc Trung Bình Giữa Các Khuôn Mặt</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={prepareBarChartData()}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    {Object.keys(COLORS).map(emotion => (
                                        <Bar key={emotion} dataKey={emotion} fill={COLORS[emotion]} name={EMOTION_LABELS[emotion]} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Line Chart - Emotion Timeline */}
                        <div className="chart-section full-width">
                            <h3>Biến Động Cảm Xúc Theo Thời Gian ({selectedFace})</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={prepareLineChartData()}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="frame" label={{ value: 'Frame', position: 'insideBottom', offset: -5 }} />
                                    <YAxis label={{ value: 'Giá trị', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip />
                                    <Legend />
                                    {Object.keys(COLORS).map(emotion => (
                                        <Line 
                                            key={emotion} 
                                            type="monotone" 
                                            dataKey={emotion} 
                                            stroke={COLORS[emotion]} 
                                            name={EMOTION_LABELS[emotion]}
                                            strokeWidth={2}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Reports;
