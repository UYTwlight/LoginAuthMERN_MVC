import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Components/Home';
import Login from './Components/Auth/Login';
import Register from './Components/Auth/Register';
import UserDetails from './Components/Auth/UserDetails';
import Dashboard from './Components/Dashboard/Dashboard';
import Reports from './Components/Reports/Reports';
import UserManagement from './Components/UserManagement/UserManagement';
import EmotionTest from './Components/EmotionTest/EmotionTest';
import ProtectedRoute from './Components/Auth/ProtectedRoute';
import SessionTimeout from './Components/Auth/SessionTimeout';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes - accessible by all authenticated users */}
        <Route path="/" element={
          <ProtectedRoute>
            <SessionTimeout>
              <Home />
            </SessionTimeout>
          </ProtectedRoute>
        } />
        <Route path="/userDetails" element={
          <ProtectedRoute>
            <SessionTimeout>
              <UserDetails />
            </SessionTimeout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <SessionTimeout>
              <Dashboard />
            </SessionTimeout>
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            <SessionTimeout>
              <Reports />
            </SessionTimeout>
          </ProtectedRoute>
        } />

        {/* Manager/Admin only routes */}
        <Route path="/users" element={
          <ProtectedRoute requiredRole="manager">
            <SessionTimeout>
              <UserManagement />
            </SessionTimeout>
          </ProtectedRoute>
        } />
        <Route path="/cameras" element={
          <ProtectedRoute requiredRole="manager">
            <SessionTimeout>
              <Dashboard />
            </SessionTimeout>
          </ProtectedRoute>
        } />
        <Route path="/emotion-test" element={
          <ProtectedRoute requiredRole="manager">
            <SessionTimeout>
              <EmotionTest />
            </SessionTimeout>
          </ProtectedRoute>
        } />
        <Route path="/model" element={
          <ProtectedRoute requiredRole="manager">
            <SessionTimeout>
              <Dashboard />
            </SessionTimeout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
