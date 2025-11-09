import { useForm } from 'react-hook-form';
import styles from './Auth.module.css';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const Login = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  const onSubmit = async (data) => {
  try {
    const response = await api.post('/auth/login', data);

    if (response.status === 200) {
      const { accessToken, role, user } = response.data;
      
      if (accessToken) {
        // Store the token and user info
        localStorage.setItem('accessToken', accessToken);
        const userRole = role || user?.role || 'user';
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('userName', user?.name || '');
        localStorage.setItem('userEmail', user?.email || '');
        
        // Initialize session time
        localStorage.setItem('lastActivity', Date.now().toString());
        
        // Show role-specific message
        const sessionInfo = userRole === 'admin' 
          ? 'Bạn có thể sử dụng không giới hạn thời gian.'
          : 'Phiên làm việc của bạn sẽ hết hạn sau 30 phút không hoạt động.';
        
        alert(`Đăng nhập thành công! Xin chào ${user?.name || 'User'}\n${sessionInfo}`);
        
        // Navigate to dashboard camera
        navigate('/dashboard');
      } else {
        console.log("Token Not Received");
        alert('Login failed: No access token received');
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    if (error.response) {
      alert(error.response.data.message || 'Login failed');
    } else {
      alert('An unexpected error occurred. Please try again.');
    }
  }
};


  return (
    <div className={styles.authContainer}>
      <form className={styles.authForm} onSubmit={handleSubmit(onSubmit)}>
        <h2 className={styles.authTitle}>Login to your account</h2>

        <div className={styles.inputGroup}>
          <label htmlFor="email" className={styles.label}>Email</label>
          <input
            id="email"
            type="email"
            className={styles.input}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Invalid email address',
              },
            })}
          />
          {errors.email && <div className={styles.error}>{errors.email.message}</div>}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="password" className={styles.label}>Password</label>
          <input
            id="password"
            type="password"
            className={styles.input}
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
          />
          {errors.password && <div className={styles.error}>{errors.password.message}</div>}
        </div>

        <button type="submit" className={styles.submitButton}>
          Login
        </button>

        <p className={styles.toggleText}>
          Don't have an account?{' '}
          <Link to="/register" className={styles.toggleLink}>Register</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
