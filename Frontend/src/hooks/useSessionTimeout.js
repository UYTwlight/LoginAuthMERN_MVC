import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SESSION_DURATION = {
  admin: null, // Không giới hạn
  user: 30 * 60 * 1000, // 30 phút tính bằng milliseconds
  manager: 30 * 60 * 1000 // Manager cũng giới hạn 30 phút
};

const useSessionTimeout = () => {
  const navigate = useNavigate();
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    const sessionDuration = SESSION_DURATION[userRole];

    // Nếu là admin hoặc không có giới hạn thời gian
    if (!sessionDuration) return;

    // Cập nhật thời gian hoạt động cuối khi có tương tác
    const updateLastActivity = () => {
      setLastActivity(Date.now());
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    // Kiểm tra session timeout
    const checkSessionTimeout = () => {
      const lastActivityTime = parseInt(localStorage.getItem('lastActivity') || Date.now().toString());
      const currentTime = Date.now();
      const timePassed = currentTime - lastActivityTime;

      if (timePassed > sessionDuration) {
        // Session hết hạn
        localStorage.clear();
        alert('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
      }
    };

    // Thêm event listeners để theo dõi hoạt động người dùng
    const events = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click'
    ];

    events.forEach(event => {
      window.addEventListener(event, updateLastActivity);
    });

    // Kiểm tra timeout mỗi phút
    const intervalId = setInterval(checkSessionTimeout, 60 * 1000);

    // Lưu thời gian hoạt động ban đầu
    updateLastActivity();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateLastActivity);
      });
      clearInterval(intervalId);
    };
  }, [navigate]);

  return lastActivity;
};

export default useSessionTimeout;