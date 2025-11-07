import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SESSION_DURATION = {
  admin: null, // Không giới hạn
  user: 30 * 60 * 1000, // 30 phút
  manager: 30 * 60 * 1000 // 30 phút
};

const SessionTimeout = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    const sessionDuration = SESSION_DURATION[userRole];

    if (!sessionDuration) {
      return; // Không giới hạn thời gian cho admin
    }

    const updateLastActivity = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    const checkSessionTimeout = () => {
      const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0');
      const currentTime = Date.now();
      
      if (currentTime - lastActivity > sessionDuration) {
        localStorage.clear();
        alert('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
      }
    };

    // Set initial last activity
    updateLastActivity();

    // Add event listeners for user activity
    const events = ['mousemove', 'mousedown', 'click', 'scroll', 'keypress', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, updateLastActivity);
    });

    // Check session timeout every minute
    const intervalId = setInterval(checkSessionTimeout, 60 * 1000);

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateLastActivity);
      });
      clearInterval(intervalId);
    };
  }, [navigate]);

  return children;
};

export default SessionTimeout;