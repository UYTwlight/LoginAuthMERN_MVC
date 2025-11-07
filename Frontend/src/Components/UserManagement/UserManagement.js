import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './UserManagement.css';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user',
    name: '',
    mobile: ''
  });
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Fetch users on component mount
  const fetchUsers = useCallback(async () => {
    try {
      // Get fresh token from localStorage
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await api.get('/auth/users');
      const userData = response.data.users || response.data;
      
      if (Array.isArray(userData)) {
        setUsers(userData);
        setError(null);
      } else {
        setError('Không nhận được dữ liệu người dùng hợp lệ');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      if (err.response?.status === 401) {
        // Token refresh will be handled by axios interceptor
        setError('Phiên làm việc đã hết hạn, đang làm mới...');
      } else {
        setError('Không thể tải danh sách người dùng: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Email không hợp lệ');
      return false;
    }
    if (!editingUser && !formData.password) {
      setError('Mật khẩu không được để trống');
      return false;
    }
    if (!formData.role) {
      setError('Vui lòng chọn vai trò');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      if (editingUser) {
        // Update user
        await api.patch(`/auth/users/${editingUser._id}`, {
          role: formData.role
        });
        alert('Cập nhật người dùng thành công!');
      } else {
        // Create new user
        await api.post('/auth/register', {
          email: formData.email,
          password: formData.password,
          role: formData.role,
          name: formData.name || formData.email.split('@')[0],
          mobile: formData.mobile || '0000000000'
        });
        alert('Tạo người dùng mới thành công!');
      }

      // Refresh user list
      await fetchUsers();
      handleCloseModal();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Có lỗi xảy ra';
      setError(errorMessage);
      if (err.response?.status === 409) {
        setError('Email đã tồn tại trong hệ thống');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirmDelete) {
      setConfirmDelete(userId);
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/auth/users/${userId}`);
      await fetchUsers();
      setConfirmDelete(null);
      setError(null);
      alert('Xóa người dùng thành công!');
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Không thể xóa người dùng: ' + (err.response?.data?.message || ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '', // Don't show or edit existing password
      role: user.role,
      name: user.name || '',
      mobile: user.mobile || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      role: 'user',
      name: '',
      mobile: ''
    });
    setError(null);
  };

  return (
    <div className="user-management-container">
      <div className="header">
        <h1>Quản lý Người dùng</h1>
        <button 
          className="add-button"
          onClick={() => setIsModalOpen(true)}
        >
          Thêm mới
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Tên</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user.email}</td>
                  <td>{user.name || '-'}</td>
                  <td>{user.mobile || '-'}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role === 'admin' ? 'Admin' : 
                       user.role === 'manager' ? 'Quản lý' : 'Người dùng'}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      className="edit-button"
                      onClick={() => handleEdit(user)}
                    >
                      Sửa
                    </button>
                    <button
                      className={`delete-button ${confirmDelete === user._id ? 'confirm' : ''}`}
                      onClick={() => handleDelete(user._id)}
                    >
                      {confirmDelete === user._id ? 'Xác nhận xóa?' : 'Xóa'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Add/Edit User */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingUser ? 'Sửa thông tin người dùng' : 'Thêm người dùng mới'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={editingUser}
                  placeholder="Nhập email"
                />
              </div>

              {!editingUser && (
                <div className="form-group">
                  <label htmlFor="password">Mật khẩu:</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="Nhập mật khẩu"
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="name">Tên người dùng:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nhập tên người dùng"
                />
              </div>

              <div className="form-group">
                <label htmlFor="mobile">Số điện thoại:</label>
                <input
                  type="text"
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Vai trò:</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Chọn vai trò --</option>
                  <option value="user">Người dùng</option>
                  <option value="manager">Quản lý</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? 'Đang xử lý...' : (editingUser ? 'Cập nhật' : 'Thêm mới')}
                </button>
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="cancel-button"
                  disabled={loading}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
