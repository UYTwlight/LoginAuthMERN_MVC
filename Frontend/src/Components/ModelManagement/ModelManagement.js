import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ModelManagement.css';

const ModelManagement = () => {
    const [models, setModels] = useState([]);
    const [activeModel, setActiveModel] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingModel, setPendingModel] = useState('');

    // Load models on component mount
    useEffect(() => {
        loadModels();
    }, []);

    const loadModels = async () => {
        try {
            setLoading(true);
            setError('');
            
            const token = localStorage.getItem('accessToken');
            const response = await axios.get('http://localhost:3001/api/models', {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                withCredentials: true
            });

            if (response.data.success) {
                setModels(response.data.models);
                setActiveModel(response.data.activeModel);
            }
        } catch (err) {
            console.error('Error loading models:', err);
            setError(err.response?.data?.message || 'Không thể tải danh sách models');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.name.endsWith('.onnx')) {
                setError('Chỉ chấp nhận file .onnx');
                return;
            }
            setSelectedFile(file);
            setError('');
            setSuccess('');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Vui lòng chọn file model để upload');
            return;
        }

        try {
            setUploading(true);
            setError('');
            setSuccess('');

            const formData = new FormData();
            formData.append('model', selectedFile);

            const token = localStorage.getItem('accessToken');
            const response = await axios.post(
                'http://localhost:3001/api/models/upload',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    },
                    withCredentials: true
                }
            );

            if (response.data.success) {
                setSuccess(`✅ Upload thành công: ${selectedFile.name}`);
                setSelectedFile(null);
                // Reset file input
                document.getElementById('model-file-input').value = '';
                // Reload models list
                await loadModels();
            }
        } catch (err) {
            console.error('Error uploading model:', err);
            setError(err.response?.data?.message || 'Không thể upload model');
        } finally {
            setUploading(false);
        }
    };

    const handleSelectModel = (modelName) => {
        if (modelName === activeModel) {
            return; // Already active
        }
        setPendingModel(modelName);
        setShowConfirm(true);
    };

    const confirmModelChange = async () => {
        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const token = localStorage.getItem('accessToken');
            const response = await axios.post(
                'http://localhost:3001/api/models/active',
                { modelName: pendingModel },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    withCredentials: true
                }
            );

            if (response.data.success) {
                setActiveModel(pendingModel);
                await loadModels();
                
                // If rebuild is in progress
                if (response.data.rebuildInProgress) {
                    setSuccess(`✅ Model "${pendingModel}" đã được kích hoạt! 🔨 Đang rebuild main.exe...`);
                    
                    // Hide loading state immediately
                    setLoading(false);
                    
                    // Show notification
                    setTimeout(() => {
                        alert('⚠️ Hệ thống đang rebuild main.exe với model mới.\n\n' +
                              '✅ Bạn có thể tiếp tục sử dụng hệ thống.\n\n' +
                              '📝 Kiểm tra Backend console để xem tiến trình:\n' +
                              '   - [BUILD] ✅ Rebuild completed\n' +
                              '   - [BUILD] ℹ️  Model is ready to use\n\n' +
                              '⏱️ Thời gian: ~10-30 giây\n\n' +
                              '🔄 Khởi động lại camera để sử dụng model mới!');
                    }, 500);
                    
                    // Auto-update message after estimated build time (20 seconds)
                    setTimeout(() => {
                        setSuccess(`✅ Model "${pendingModel}" đã được kích hoạt! (Kiểm tra console để xác nhận build)`);
                    }, 20000);
                    
                } else {
                    // No rebuild, show normal message
                    setSuccess(`✅ Model "${pendingModel}" đã được kích hoạt!`);
                    setTimeout(() => {
                        alert('⚠️ Lưu ý: Camera cần được khởi động lại để sử dụng model mới!');
                    }, 500);
                }
            }
        } catch (err) {
            console.error('Error setting active model:', err);
            setError(err.response?.data?.message || 'Không thể thay đổi model');
            setLoading(false);
        } finally {
            setShowConfirm(false);
            setPendingModel('');
            // Don't set loading to false here if rebuild is in progress (already handled above)
        }
    };

    const handleDeleteModel = async (modelName) => {
        if (modelName === activeModel) {
            setError('Không thể xóa model đang sử dụng');
            return;
        }

        const confirmed = window.confirm(`Bạn có chắc muốn xóa model "${modelName}"?`);
        if (!confirmed) return;

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const token = localStorage.getItem('accessToken');
            const response = await axios.delete(
                `http://localhost:3001/api/models/${modelName}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    withCredentials: true
                }
            );

            if (response.data.success) {
                setSuccess(`✅ Đã xóa model: ${modelName}`);
                await loadModels();
            }
        } catch (err) {
            console.error('Error deleting model:', err);
            setError(err.response?.data?.message || 'Không thể xóa model');
        } finally {
            setLoading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN');
    };

    return (
        <div className="model-management-container">
            <h2>🧠 Quản Lý Mô Hình AI</h2>

            {error && <div className="message error-message">{error}</div>}
            {success && <div className="message success-message">{success}</div>}

            {/* Upload Section */}
            <div className="upload-section card">
                <h3>📤 Upload Mô Hình Mới</h3>
                <p className="section-description">
                    Tải lên file mô hình emotion recognition (.onnx). File sẽ được lưu vào thư mục Emotion-statistics.
                </p>
                
                <div className="upload-controls">
                    <input
                        type="file"
                        id="model-file-input"
                        accept=".onnx"
                        onChange={handleFileSelect}
                        className="file-input"
                    />
                    <label htmlFor="model-file-input" className="file-label">
                        {selectedFile ? `📄 ${selectedFile.name}` : '📁 Chọn file .onnx'}
                    </label>
                    
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        className="btn-upload"
                    >
                        {uploading ? '⏳ Đang upload...' : '✅ Upload Model'}
                    </button>
                </div>

                {selectedFile && (
                    <div className="file-info">
                        <p><strong>Tên file:</strong> {selectedFile.name}</p>
                        <p><strong>Kích thước:</strong> {formatFileSize(selectedFile.size)}</p>
                    </div>
                )}
            </div>

            {/* Active Model Section */}
            <div className="active-model-section card">
                <h3>⚡ Mô Hình Đang Sử Dụng</h3>
                <div className="active-model-display">
                    <span className="model-icon">🎯</span>
                    <span className="model-name">{activeModel}</span>
                    <span className="active-badge">ACTIVE</span>
                </div>
                <p className="model-note">
                    💡 Mô hình này sẽ được sử dụng khi khởi động camera detection
                </p>
            </div>

            {/* Models List Section */}
            <div className="models-list-section card">
                <h3>📚 Danh Sách Mô Hình</h3>
                
                {loading && <p className="loading-text">⏳ Đang tải...</p>}

                {!loading && models.length === 0 && (
                    <p className="no-models">Chưa có mô hình nào. Hãy upload mô hình đầu tiên!</p>
                )}

                {!loading && models.length > 0 && (
                    <div className="models-grid">
                        {models.map((model) => (
                            <div
                                key={model.filename}
                                className={`model-card ${model.isActive ? 'active' : ''}`}
                            >
                                <div className="model-card-header">
                                    <span className="model-icon-large">
                                        {model.isActive ? '🎯' : '📦'}
                                    </span>
                                    <h4>{model.filename}</h4>
                                </div>

                                <div className="model-card-body">
                                    <p><strong>Kích thước:</strong> {formatFileSize(model.size)}</p>
                                    <p><strong>Cập nhật:</strong> {formatDate(model.lastModified)}</p>
                                    {model.isActive && (
                                        <span className="status-badge active">✅ Đang sử dụng</span>
                                    )}
                                </div>

                                <div className="model-card-actions">
                                    {!model.isActive && (
                                        <>
                                            <button
                                                onClick={() => handleSelectModel(model.filename)}
                                                className="btn-select"
                                            >
                                                ⚡ Kích hoạt
                                            </button>
                                            <button
                                                onClick={() => handleDeleteModel(model.filename)}
                                                className="btn-delete"
                                            >
                                                🗑️ Xóa
                                            </button>
                                        </>
                                    )}
                                    {model.isActive && (
                                        <button className="btn-active" disabled>
                                            ✅ Đang dùng
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>⚠️ Xác nhận thay đổi model</h3>
                        <p>Bạn có chắc muốn chuyển sang sử dụng model:</p>
                        <p className="confirm-model-name"><strong>{pendingModel}</strong></p>
                        <p className="modal-note">
                            💡 Lưu ý: Camera cần được khởi động lại để sử dụng model mới
                        </p>
                        
                        <div className="modal-actions">
                            <button
                                onClick={confirmModelChange}
                                className="btn-confirm"
                                disabled={loading}
                            >
                                {loading ? '⏳ Đang xử lý...' : '✅ Xác nhận'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowConfirm(false);
                                    setPendingModel('');
                                }}
                                className="btn-cancel"
                                disabled={loading}
                            >
                                ❌ Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModelManagement;
