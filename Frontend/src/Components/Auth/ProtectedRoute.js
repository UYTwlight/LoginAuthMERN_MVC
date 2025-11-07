import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const userRole = localStorage.getItem('userRole');
  
  // If no role is required, allow access
  if (!requiredRole) {
    return children;
  }

  // For admin routes, check if user is admin
  if (requiredRole === 'admin' && userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // For manager routes, check if user is admin or manager
  if (requiredRole === 'manager' && !['admin', 'manager'].includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  // If user has sufficient permissions, render the route
  return children;
};

export default ProtectedRoute;