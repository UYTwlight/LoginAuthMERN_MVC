import React, { useState } from 'react';
import Navbar from './Navbar';
import './Dashboard.css';

const Dashboard = () => {
  const [selectedCamera, setSelectedCamera] = useState(null);

  // Mock camera list - replace with actual data from your backend
  const cameras = [
    { id: 1, name: 'Camera 1', location: 'Main Entrance' },
    { id: 2, name: 'Camera 2', location: 'Hallway' },
    { id: 3, name: 'Camera 3', location: 'Parking' },
  ];

  return (
    <div className="dashboard-container">
      <Navbar />
      
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
                <h3>{camera.name}</h3>
                <p>{camera.location}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="video-container">
          {selectedCamera ? (
            <div className="video-stream">
              <h2>{selectedCamera.name} - {selectedCamera.location}</h2>
              <div className="video-player">
                {/* Replace this with actual video stream component */}
                <div className="video-placeholder">
                  <span>Live Stream</span>
                  <p>Camera ID: {selectedCamera.id}</p>
                </div>
              </div>
              <div className="emotion-labels">
                <div className="emotion-box">
                  <span className="emotion">Happy</span>
                  <span className="confidence">95%</span>
                </div>
                {/* Add more emotion boxes as needed */}
              </div>
            </div>
          ) : (
            <div className="no-camera-selected">
              <p>Vui lòng chọn camera để xem luồng video trực tiếp</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;