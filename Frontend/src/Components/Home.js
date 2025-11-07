import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Dashboard/Navbar';
import './Home.css';

const Home = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [selectedCamera, setSelectedCamera] = useState(null);

  // Mock camera list - replace with actual data from your backend
  const cameras = [
    { id: 1, name: 'Camera 1', location: 'Main Entrance' },
    { id: 2, name: 'Camera 2', location: 'Hallway' },
    { id: 3, name: 'Camera 3', location: 'Parking' },
  ];

  // Check authentication status - replace with your actual auth logic
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('accessToken'); // Changed from 'token' to 'accessToken'
      const role = localStorage.getItem('userRole'); // You should store this during login
      if (token) {
        setIsAuthenticated(true);
        setUserRole(role || 'user'); // Default to user if role not found
      }
    };
    checkAuth();
  }, []);

  const renderLandingPage = () => (
    <div className="home-container landing">
      <div className="home-content">
        <h1>Welcome to Camera Analytics</h1>
        <p>Real-time emotion detection and analysis platform</p>
        
        <div className="action-buttons">
          <Link to="/login" className="auth-button login">
            Login
          </Link>
          <Link to="/register" className="auth-button register">
            Register
          </Link>
        </div>

        <div className="features">
          <div className="feature-item">
            <h3>Real-time Analysis</h3>
            <p>Live emotion detection from camera feeds</p>
          </div>
          <div className="feature-item">
            <h3>Multi-Camera Support</h3>
            <p>Monitor multiple locations simultaneously</p>
          </div>
          <div className="feature-item">
            <h3>Advanced Analytics</h3>
            <p>Detailed reports and insights</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="home-container dashboard">
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
                <div className="emotion-box">
                  <span className="emotion">Neutral</span>
                  <span className="confidence">5%</span>
                </div>
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

  return isAuthenticated ? renderDashboard() : renderLandingPage();
};

export default Home;