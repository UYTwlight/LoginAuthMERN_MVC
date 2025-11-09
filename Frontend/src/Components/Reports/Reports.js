import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Reports_New.css';
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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Reports = () => {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessionData, setSessionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedFace, setSelectedFace] = useState(null);
    const [filterType, setFilterType] = useState('all'); // all, camera, video
    const [searchQuery, setSearchQuery] = useState('');
    const [userRole, setUserRole] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // sessionId to delete

    useEffect(() => {
        fetchSessions();
        fetchUserRole();
    }, []);

    useEffect(() => {
        if (selectedSession) {
            fetchSessionData(selectedSession);
        }
    }, [selectedSession]);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            
            if (!token) {
                setError('Vui lòng đăng nhập để xem báo cáo');
                setLoading(false);
                return;
            }

            const response = await axios.get(`${API_URL}/api/emotions/face-logs/sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success && response.data.sessions) {
                setSessions(response.data.sessions);
                if (response.data.sessions.length > 0) {
                    setSelectedSession(response.data.sessions[0].sessionId);
                }
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching sessions:', err);
            setError('Không thể tải danh sách sessions');
            setLoading(false);
        }
    };

    const fetchSessionData = async (sessionId) => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get(`${API_URL}/api/emotions/face-logs/sessions/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Session data response:', response.data);
            console.log('Faces:', response.data.data?.faces);
            if (response.data.data?.faces?.length > 0) {
                console.log('First face:', response.data.data.faces[0]);
            }

            if (response.data.success) {
                setSessionData(response.data.data);
                if (response.data.data.faces && response.data.data.faces.length > 0) {
                    setSelectedFace(response.data.data.faces[0].faceId);
                }
            }
        } catch (err) {
            console.error('Error fetching session data:', err);
        }
    };

    const fetchUserRole = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            // Decode JWT to get user role
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUserRole(payload.role);
        } catch (err) {
            console.error('Error fetching user role:', err);
        }
    };

    const handleDeleteSession = async (sessionId) => {
        try {
            const token = localStorage.getItem('accessToken');
            
            const response = await axios.delete(
                `${API_URL}/api/emotions/face-logs/sessions/${sessionId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                // Remove from list
                setSessions(sessions.filter(s => s.sessionId !== sessionId));
                
                // If deleted session was selected, clear selection
                if (selectedSession === sessionId) {
                    setSelectedSession(sessions[0]?.sessionId || null);
                    setSessionData(null);
                }
                
                setDeleteConfirm(null);
                alert('✅ Đã xóa session thành công!');
            }
        } catch (err) {
            console.error('Error deleting session:', err);
            alert('❌ Lỗi khi xóa session: ' + (err.response?.data?.error || err.message));
        }
    };

    // Filter sessions
    const filteredSessions = sessions.filter(session => {
        const matchesType = filterType === 'all' || session.sourceType === filterType;
        const matchesSearch = session.sessionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             session.source.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    // Calculate summary statistics
    const totalSessions = sessions.length;
    const totalFaces = sessions.reduce((sum, s) => sum + (s.faceCount || 0), 0);
    const cameraSessions = sessions.filter(s => s.sourceType === 'camera').length;
    const videoSessions = sessions.filter(s => s.sourceType === 'video').length;

    // Prepare chart data for selected face
    const getChartData = () => {
        if (!sessionData || !selectedFace) {
            console.log('getChartData: No session data or selected face');
            return null;
        }
        
        console.log('getChartData: sessionData.faces', sessionData.faces);
        
        const faceData = sessionData.faces.find(f => f.faceId === selectedFace);
        if (!faceData) {
            console.log('getChartData: Face not found', selectedFace);
            return null;
        }
        
        console.log('getChartData: faceData', faceData);
        
        if (!faceData.emotionData || faceData.emotionData.length === 0) {
            console.log('getChartData: No emotion data');
            return null;
        }

        // Calculate average emotions from emotionData
        // CSV columns use capitalized names: Happy, Sad, Surprise, Angry, Disgust
        const avgEmotions = {
            happy: 0,
            sad: 0,
            surprise: 0,
            angry: 0,
            disgust: 0
        };

        faceData.emotionData.forEach(data => {
            avgEmotions.happy += parseFloat(data.Happy || 0);
            avgEmotions.sad += parseFloat(data.Sad || 0);
            avgEmotions.surprise += parseFloat(data.Surprise || 0);
            avgEmotions.angry += parseFloat(data.Angry || 0);
            avgEmotions.disgust += parseFloat(data.Disgust || 0);
        });

        Object.keys(avgEmotions).forEach(emotion => {
            avgEmotions[emotion] /= faceData.emotionData.length;
        });

        // Find dominant emotion
        let dominantEmotion = 'happy';
        let maxValue = 0;
        Object.keys(avgEmotions).forEach(emotion => {
            if (avgEmotions[emotion] > maxValue) {
                maxValue = avgEmotions[emotion];
                dominantEmotion = emotion;
            }
        });

        const pieData = Object.keys(EMOTION_LABELS).map(emotion => ({
            name: EMOTION_LABELS[emotion],
            value: avgEmotions[emotion.toLowerCase()] || 0
        }));

        const barData = Object.keys(EMOTION_LABELS).map(emotion => ({
            emotion: EMOTION_LABELS[emotion],
            giáTrị: avgEmotions[emotion.toLowerCase()] || 0
        }));

        const lineData = faceData.emotionData.map((data, index) => ({
            frame: parseInt(data.frame || index + 1),
            'Vui vẻ': parseFloat(data.Happy || 0),
            'Buồn': parseFloat(data.Sad || 0),
            'Ngạc nhiên': parseFloat(data.Surprise || 0),
            'Tức giận': parseFloat(data.Angry || 0),
            'Ghê tởm': parseFloat(data.Disgust || 0)
        }));

        console.log('getChartData: Success', { pieData, barData, avgEmotions });

        return { 
            pieData, 
            barData, 
            lineData, 
            faceData: {
                ...faceData,
                averageEmotions: avgEmotions,
                dominantEmotion: dominantEmotion.charAt(0).toUpperCase() + dominantEmotion.slice(1)
            }
        };
    };

    const chartData = getChartData();

    if (loading) {
        return (
            <div className="reports-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="reports-container">
                <div className="error-message">
                    <i className="error-icon">⚠️</i>
                    <h3>{error}</h3>
                </div>
            </div>
        );
    }

    return (
        <div className="reports-container-new">
            {/* Header Section */}
            <header className="reports-header">
                <div className="header-content">
                    <h1 className="reports-title">📊 Báo Cáo Phân Tích Cảm Xúc</h1>
                    <p className="reports-subtitle">Theo dõi và phân tích cảm xúc từ camera và video</p>
                </div>

                {/* Summary Cards */}
                <div className="summary-cards">
                    <div className="summary-card">
                        <div className="card-icon">📹</div>
                        <div className="card-content">
                            <h3>{totalSessions}</h3>
                            <p>Tổng Sessions</p>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="card-icon">👤</div>
                        <div className="card-content">
                            <h3>{totalFaces}</h3>
                            <p>Khuôn Mặt Phát Hiện</p>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="card-icon">📷</div>
                        <div className="card-content">
                            <h3>{cameraSessions}</h3>
                            <p>Camera Sessions</p>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="card-icon">🎬</div>
                        <div className="card-content">
                            <h3>{videoSessions}</h3>
                            <p>Video Sessions</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="reports-main">
                {/* Left Panel - Sessions List */}
                <aside className="sessions-panel">
                    <div className="panel-header">
                        <h2>Danh Sách Sessions</h2>
                        
                        {/* Search Bar */}
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="🔍 Tìm kiếm session..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Filter Buttons */}
                        <div className="filter-buttons">
                            <button 
                                className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                                onClick={() => setFilterType('all')}
                            >
                                Tất cả ({totalSessions})
                            </button>
                            <button 
                                className={`filter-btn ${filterType === 'camera' ? 'active' : ''}`}
                                onClick={() => setFilterType('camera')}
                            >
                                📷 Camera ({cameraSessions})
                            </button>
                            <button 
                                className={`filter-btn ${filterType === 'video' ? 'active' : ''}`}
                                onClick={() => setFilterType('video')}
                            >
                                🎬 Video ({videoSessions})
                            </button>
                        </div>
                    </div>

                    {/* Sessions List */}
                    <div className="sessions-list">
                        {filteredSessions.length === 0 ? (
                            <div className="no-sessions">
                                <p>Không tìm thấy session nào</p>
                            </div>
                        ) : (
                            filteredSessions.map(session => (
                                <div
                                    key={session.sessionId}
                                    className={`session-card ${selectedSession === session.sessionId ? 'active' : ''}`}
                                >
                                    <div 
                                        className="session-clickable"
                                        onClick={() => setSelectedSession(session.sessionId)}
                                    >
                                        <div className="session-icon">
                                            {session.sourceType === 'camera' ? '📷' : '🎬'}
                                        </div>
                                        <div className="session-info">
                                            <h3 className="session-name">{session.source}</h3>
                                            <p className="session-time">
                                                {new Date(session.startTime).toLocaleString('vi-VN')}
                                            </p>
                                            <div className="session-meta">
                                                <span className="face-count">
                                                    👤 {session.faceCount} khuôn mặt
                                                </span>
                                                <span className={`status-badge ${session.status}`}>
                                                    {session.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Delete Button - Only for Admin */}
                                    {userRole === 'admin' && (
                                        <button
                                            className="delete-session-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteConfirm(session.sessionId);
                                            }}
                                            title="Xóa session"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                {/* Right Panel - Detail View */}
                <main className="details-panel">
                    {!sessionData ? (
                        <div className="no-selection">
                            <div className="no-selection-icon">📊</div>
                            <h3>Chọn một session để xem chi tiết</h3>
                            <p>Click vào session bên trái để xem phân tích cảm xúc</p>
                        </div>
                    ) : (
                        <>
                            {/* Session Header */}
                            <div className="detail-header">
                                <div>
                                    <h2>{sessionData.sessionId}</h2>
                                    <p className="detail-subtitle">
                                        {sessionData.faces.length} khuôn mặt được phát hiện
                                    </p>
                                </div>

                                {/* Face Selector */}
                                {sessionData.faces.length > 0 && (
                                    <div className="face-selector">
                                        <label>Chọn khuôn mặt:</label>
                                        <select
                                            value={selectedFace || ''}
                                            onChange={(e) => setSelectedFace(e.target.value)}
                                        >
                                            {sessionData.faces.map(face => (
                                                <option key={face.faceId} value={face.faceId}>
                                                    {face.faceId} ({face.totalFrames} frames)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {sessionData.faces.length === 0 ? (
                                <div className="no-faces">
                                    <p>⚠️ Không phát hiện khuôn mặt nào trong session này</p>
                                </div>
                            ) : chartData ? (
                                <>
                                    {/* Face Image */}
                                    {chartData.faceData.firstFrameImage && (
                                        <div className="face-image-section">
                                            <img
                                                src={`${API_URL}${chartData.faceData.firstFrameImage}`}
                                                alt="First Frame"
                                                className="face-image"
                                            />
                                            <div className="image-caption">
                                                Ảnh đầu tiên - {chartData.faceData.faceId}
                                            </div>
                                        </div>
                                    )}

                                    {/* Charts Grid */}
                                    <div className="charts-grid">
                                        {/* Pie Chart */}
                                        <div className="chart-card">
                                            <h3 className="chart-title">📊 Phân Bố Cảm Xúc Trung Bình</h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <PieChart>
                                                    <Pie
                                                        data={chartData.pieData}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                    >
                                                        {chartData.pieData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Bar Chart */}
                                        <div className="chart-card">
                                            <h3 className="chart-title">📈 So Sánh Cảm Xúc</h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={chartData.barData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="emotion" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="giáTrị" fill="#8884d8">
                                                        {chartData.barData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Line Chart */}
                                        <div className="chart-card full-width">
                                            <h3 className="chart-title">📉 Timeline Cảm Xúc Theo Frame</h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <LineChart data={chartData.lineData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="frame" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    {Object.keys(EMOTION_LABELS).map((emotion, index) => (
                                                        <Line
                                                            key={emotion}
                                                            type="monotone"
                                                            dataKey={EMOTION_LABELS[emotion]}
                                                            stroke={Object.values(COLORS)[index]}
                                                            strokeWidth={2}
                                                        />
                                                    ))}
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Statistics Table */}
                                    <div className="statistics-section">
                                        <h3 className="section-title">📋 Thống Kê Chi Tiết</h3>
                                        <div className="stats-table">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Cảm Xúc</th>
                                                        <th>Giá Trị Trung Bình</th>
                                                        <th>Tỷ Lệ</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Object.keys(EMOTION_LABELS).map(emotion => {
                                                        // Safety check
                                                        if (!chartData?.faceData?.averageEmotions) return null;
                                                        
                                                        const value = chartData.faceData.averageEmotions[emotion.toLowerCase()] || 0;
                                                        const total = Object.values(chartData.faceData.averageEmotions).reduce((a, b) => a + b, 0);
                                                        const percentage = total > 0 ? (value / total * 100).toFixed(1) : 0;
                                                        
                                                        return (
                                                            <tr key={emotion}>
                                                                <td>
                                                                    <span className="emotion-label" style={{ color: COLORS[emotion] }}>
                                                                        {EMOTION_LABELS[emotion]}
                                                                    </span>
                                                                </td>
                                                                <td>{value.toFixed(4)}</td>
                                                                <td>
                                                                    <div className="progress-bar">
                                                                        <div 
                                                                            className="progress-fill" 
                                                                            style={{ 
                                                                                width: `${percentage}%`,
                                                                                backgroundColor: COLORS[emotion]
                                                                            }}
                                                                        ></div>
                                                                        <span className="progress-text">{percentage}%</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Summary Info */}
                                        <div className="summary-info">
                                            <div className="info-item">
                                                <strong>Tổng số frames:</strong>
                                                <span>{chartData.faceData.totalFrames || 0}</span>
                                            </div>
                                            <div className="info-item">
                                                <strong>Cảm xúc chiếm ưu thế:</strong>
                                                <span style={{ color: COLORS[chartData.faceData.dominantEmotion] || '#000' }}>
                                                    {EMOTION_LABELS[chartData.faceData.dominantEmotion] || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </>
                    )}
                </main>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>⚠️ Xác nhận xóa</h3>
                        </div>
                        <div className="modal-body">
                            <p>Bạn có chắc chắn muốn xóa session này?</p>
                            <p className="warning-text">
                                <strong>Session ID:</strong> {deleteConfirm}
                            </p>
                            <p className="warning-text">
                                ⚠️ Hành động này sẽ xóa vĩnh viễn tất cả dữ liệu và không thể hoàn tác!
                            </p>
                        </div>
                        <div className="modal-actions">
                            <button 
                                className="btn-cancel"
                                onClick={() => setDeleteConfirm(null)}
                            >
                                ❌ Hủy
                            </button>
                            <button 
                                className="btn-confirm-delete"
                                onClick={() => handleDeleteSession(deleteConfirm)}
                            >
                                🗑️ Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
