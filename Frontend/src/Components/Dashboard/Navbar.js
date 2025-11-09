import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import usePermissions from '../Auth/usePermissions';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { isManager, isAdmin } = usePermissions();
  const userName = localStorage.getItem('userName') || 'User';

  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span>Camera Analytics</span>
      </div>
      
      <div className="nav-links">
        {/* Always visible links for authenticated users */}
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
          Dashboard Camera
        </NavLink>
        
        <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>
          Báo cáo tổng quan
        </NavLink>

        {/* Manager/Admin only links */}
        {isManager && (
          <>
            <NavLink to="/cameras" className={({ isActive }) => isActive ? 'active' : ''}>
              Quản lý Camera
            </NavLink>
            
            <NavLink to="/emotion-test" className={({ isActive }) => isActive ? 'active' : ''}>
              Kiểm tra mô hình
            </NavLink>
            
            <NavLink to="/model" className={({ isActive }) => isActive ? 'active' : ''}>
              Cấu hình mô hình
            </NavLink>
          </>
        )}

        {/* Admin only links */}
        {isAdmin && (
          <NavLink to="/users" className={({ isActive }) => isActive ? 'active' : ''}>
            Quản lý Người dùng
          </NavLink>
        )}
      </div>

      <div className="nav-user">
        <span className="user-name">{userName}</span>
        <NavLink to="/userDetails" className={({ isActive }) => isActive ? 'active profile-link' : 'profile-link'}>
          Hồ sơ
        </NavLink>
        <button className="logout-button" onClick={handleLogout}>
          Đăng xuất
        </button>
      </div>
    </nav>
  );
};

export default Navbar;