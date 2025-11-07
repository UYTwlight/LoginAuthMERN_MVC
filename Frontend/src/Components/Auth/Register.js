import { useForm } from 'react-hook-form';
import styles from './Auth.module.css';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useState } from 'react';

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const password = watch("password"); // Used for password confirmation




const onSubmit = async (data) => {
  try {
    setIsLoading(true);
    console.log('Registration form submitted', data);

    // Remove confirmPassword from data before sending
    const { confirmPassword, ...registrationData } = {
      ...data,
      role: 'user' // Default role for new registrations is user
    };

    // Register user
    const registerResponse = await axios.post(
      'http://localhost:3001/api/auth/register',
      registrationData,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (registerResponse.status === 201 || registerResponse.status === 200) {
      // Auto-login after successful registration
      const loginResponse = await axios.post(
        'http://localhost:3001/api/auth/login',
        {
          email: data.email,
          password: data.password
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (loginResponse.status === 200) {
        const { accessToken, user, role } = loginResponse.data;
        
        // Store auth data
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('userRole', role || user?.role || 'manager');
        localStorage.setItem('userName', user?.name || '');
        localStorage.setItem('userEmail', user?.email || '');
        
        // Success message
        alert('Registration successful! You are now logged in.');
        
        // Navigate to dashboard
        navigate('/');
      }
    }
  } catch (error) {
    console.error('Registration error:', error);

    if (error.response) {
      // Handle specific error cases
      switch (error.response.status) {
        case 400:
          alert(error.response.data.message || 'Invalid registration data. Please check all fields.');
          break;
        case 409:
          alert('Email already exists. Please use a different email or try logging in.');
          break;
        case 422:
          alert('Invalid data format. Please check all fields.');
          break;
        default:
          alert(error.response.data.message || 'Registration failed. Please try again.');
      }
    } else if (error.request) {
      // Network error
      alert('Unable to connect to the server. Please check your internet connection.');
    } else {
      alert('Registration failed. Please try again later.');
    }
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className={styles.authContainer}>
      <form className={styles.authForm} onSubmit={handleSubmit(onSubmit)}>
        <h2 className={styles.authTitle}>Create an account</h2>

        <div className={styles.inputGroup}>
          <label htmlFor="name" className={styles.label}>Full Name</label>
          <input
            id="name"
            type="text"
            className={styles.input}
            {...register('name', {
              required: 'Name is required',
              minLength: {
                value: 3,
                message: 'Name must be at least 3 characters',
              },
            })}
          />
          {errors.name && <div className={styles.error}>{errors.name.message}</div>}
        </div>

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
          <label htmlFor="mobile" className={styles.label}>Mobile Number</label>
          <input
            id="mobile"
            type="text"
            className={styles.input}
            {...register('mobile', {
              required: 'Mobile number is required',
              pattern: {
                value: /^[0-9]{10}$/,
                message: 'Mobile number must be 10 digits',
              },
            })}
          />
          {errors.mobile && <div className={styles.error}>{errors.mobile.message}</div>}
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
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&#]{6,}$/,
                message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
              },
            })}
          />
          {errors.password && <div className={styles.error}>{errors.password.message}</div>}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            className={styles.input}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: value => value === password || 'Passwords do not match'
            })}
          />
          {errors.confirmPassword && <div className={styles.error}>{errors.confirmPassword.message}</div>}
        </div>

        <button 
          type="submit" 
          className={`${styles.submitButton} ${isLoading ? styles.loading : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>

        <p className={styles.toggleText}>
          Already have an account?{' '}
          <Link to="/login" className={styles.toggleLink}>Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
