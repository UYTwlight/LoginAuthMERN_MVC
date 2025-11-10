import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from './Navbar';
import CameraView from '../Camera/CameraView';
import './Dashboard.css';

const Dashboard = () => {
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [searchParams] = useSearchParams();

  // Get user role from localStorage
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role) {
      setUserRole(role);
    }
  }, []);

  // Auto-select first camera if tab=camera in URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'camera' && !selectedCamera) {
      // Auto-select first camera
      const cameras = [
        { id: 'camera1', name: 'Camera 1', location: 'Webcam - Emotion Detection', type: 'local', icon: '🎭' },
      ];
      setSelectedCamera(cameras[0]);
    }
  }, [searchParams, selectedCamera]);

  // Camera list
  const cameras = [
    { id: 'camera1', name: 'Camera 1', location: 'Webcam - Emotion Detection', type: 'local', icon: '🎭' },
    { id: 'camera2', name: 'Camera 2', location: 'Hallway', type: 'network', icon: '📹' },
    { id: 'camera3', name: 'Camera 3', location: 'Parking', type: 'network', icon: '📹' },
  ];

  return (
    <div className="dashboard-container">
      <Navbar userRole={userRole} />
      
      <div className="dashboard-content">
        <div className="camera-selection">
          <h2>Chọn Camera</h2>
          <div className="camera-list">
            {cameras.map(camera => (
              <div
                key={camera.id}
                className={`camera-item ${selectedCamera?.id === camera.id ? 'selected' : ''}`}
                onClick={() => setSelectedCamera(camera)}
              >
                <div className="camera-icon-badge">{camera.icon}</div>
                <h3>{camera.name}</h3>
                <p>{camera.location}</p>
                {camera.type === 'local' && (
                  <span className="camera-badge">C++ OpenCV</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="video-container">
          {selectedCamera ? (
            selectedCamera.id === 'camera1' ? (
              <CameraView />
            ) : (
              <div className="video-stream">
                <h2>{selectedCamera.name} - {selectedCamera.location}</h2>
                <div className="video-player">
                  <div className="video-placeholder">
                    <span>🚧 Tính năng đang phát triển</span>
                    <p>Camera mạng sẽ được hỗ trợ trong phiên bản tiếp theo</p>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="no-camera-selected">
              <div>
                <h3>👋 Chào mừng đến với Hệ thống Emotion Detection</h3>
                <p>Vui lòng chọn camera từ danh sách bên trái</p>
                <ul style={{ textAlign: 'left', marginTop: '20px' }}>
                  <li><strong>Camera 1</strong>: Sử dụng webcam với C++ OpenCV để phát hiện cảm xúc realtime</li>
                  <li><strong>Camera 2-3</strong>: Tính năng đang phát triển</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;