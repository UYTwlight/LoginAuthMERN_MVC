import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import './Reports.css';

const Reports = () => {
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    cameraId: '',
    groupBy: 'day' // 'hour' or 'day'
  });

  const [cameras, setCameras] = useState([]);
  const [emotionData, setEmotionData] = useState({
    trends: [],
    overview: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Colors for emotion categories
  const COLORS = {
    Happy: '#2ecc71',
    Sad: '#e74c3c',
    Neutral: '#3498db',
    Angry: '#e67e22',
    Surprised: '#9b59b6'
  };

  // Fetch camera list on component mount
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/cameras');
        setCameras(response.data);
      } catch (err) {
        console.error('Error fetching cameras:', err);
        setError('Failed to load cameras');
      }
    };

    fetchCameras();
  }, []);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fetch emotion statistics
  const fetchEmotionStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('http://localhost:3001/api/emotions/stats', {
        params: filters
      });

      setEmotionData({
        trends: response.data.trends,
        overview: response.data.overview
      });
    } catch (err) {
      console.error('Error fetching emotion statistics:', err);
      setError('Failed to load emotion statistics');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    fetchEmotionStats();
  };

  return (
    <div className="reports-container">
      <h1>Báo cáo tổng quan cảm xúc</h1>

      {/* Filters */}
      <form onSubmit={handleSubmit} className="filters-form">
        <div className="filter-group">
          <label>
            Từ ngày:
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </label>

          <label>
            Đến ngày:
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </label>

          <label>
            Camera:
            <select
              name="cameraId"
              value={filters.cameraId}
              onChange={handleFilterChange}
            >
              <option value="">Tất cả camera</option>
              {cameras.map(camera => (
                <option key={camera.id} value={camera.id}>
                  {camera.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Nhóm theo:
            <select
              name="groupBy"
              value={filters.groupBy}
              onChange={handleFilterChange}
            >
              <option value="hour">Giờ</option>
              <option value="day">Ngày</option>
            </select>
          </label>
        </div>

        <button type="submit" className="submit-button">
          Xem báo cáo
        </button>
      </form>

      {loading && <div className="loading">Đang tải dữ liệu...</div>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && emotionData.trends.length > 0 && (
        <div className="charts-container">
          {/* Line Chart - Emotion Trends */}
          <div className="chart-wrapper">
            <h2>Xu hướng cảm xúc theo thời gian</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={emotionData.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                {Object.keys(COLORS).map(emotion => (
                  <Line
                    key={emotion}
                    type="monotone"
                    dataKey={emotion.toLowerCase()}
                    stroke={COLORS[emotion]}
                    name={emotion}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart - Overall Distribution */}
          <div className="chart-wrapper">
            <h2>Phân bố cảm xúc tổng quan</h2>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={emotionData.overview}
                  dataKey="value"
                  nameKey="emotion"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  label={({ emotion, percent }) => 
                    `${emotion} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {emotionData.overview.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[entry.emotion]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;