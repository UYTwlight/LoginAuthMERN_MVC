import { useEffect, useState } from 'react';

const usePermissions = () => {
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'user');

  useEffect(() => {
    const handleStorageChange = () => {
      setUserRole(localStorage.getItem('userRole') || 'user');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const hasPermission = (requiredRole) => {
    if (!requiredRole) return true;
    if (requiredRole === 'admin') return userRole === 'admin';
    if (requiredRole === 'manager') return ['admin', 'manager'].includes(userRole);
    return true; // User role always has access to user-level features
  };

  const isAdmin = userRole === 'admin';
  const isManager = ['admin', 'manager'].includes(userRole);
  const isUser = true; // Everyone has user permissions

  return {
    userRole,
    hasPermission,
    isAdmin,
    isManager,
    isUser
  };
};

export default usePermissions;