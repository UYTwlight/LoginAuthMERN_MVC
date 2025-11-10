import { useEffect, useState } from "react";
import styles from "./Auth.module.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const UserDetails = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchUserDetails = async (token) => {
    return await axios.get(`${API_URL}/api/auth/getUserDetails`, {
      withCredentials: true, // send cookie
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  useEffect(() => {
    // Fetch user details from backend
    const fetchUser = async () => {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        console.log("No access token found, redirecting to login");
        navigate("/login");
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const res = await fetchUserDetails(accessToken);
        setUser(res.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user details:", error);
        
        if (error.response) {
          const status = error.response.status;
          
          if (status === 401 || status === 403) {
            // Token expired, try to refresh
            try {
              console.log("Access Token Expired, attempting refresh");
              const refreshRes = await axios.get(
                `${API_URL}/api/auth/refresh`,
                {
                  withCredentials: true,
                }
              );
              const newAccessToken = refreshRes.data.accessToken;
              localStorage.setItem("accessToken", newAccessToken);
              
              // Retry fetching user details with new token
              const retryRes = await fetchUserDetails(newAccessToken);
              setUser(retryRes.data);
              setLoading(false);
            } catch (refreshError) {
              console.error("Refresh token expired or invalid:", refreshError);
              setError("Session expired. Please login again.");
              setLoading(false);
              localStorage.clear();
              setTimeout(() => navigate("/login"), 2000);
            }
          } else {
            setError(`Error: ${error.response.data.message || 'Failed to fetch user details'}`);
            setLoading(false);
          }
        } else {
          // Network error or other issue
          setError("Network error. Please check your connection and try again.");
          setLoading(false);
        }
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_URL}/api/auth/logout`,
        {},
        {
          withCredentials: true,
        }
      );
      localStorage.clear();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Clear local storage anyway and redirect
      localStorage.clear();
      navigate("/login");
    }
  };

  if (loading) return (
    <div className={styles.authContainer}>
      <div className={styles.authForm}>
        <h2 className={styles.authTitle}>Loading...</h2>
        <p>Fetching user information...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className={styles.authContainer}>
      <div className={styles.authForm}>
        <h2 className={styles.authTitle}>Error</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => navigate("/login")} className={styles.submitButton}>
          Go to Login
        </button>
      </div>
    </div>
  );

  if (!user) return (
    <div className={styles.authContainer}>
      <div className={styles.authForm}>
        <h2 className={styles.authTitle}>No User Data</h2>
        <p>Unable to load user information.</p>
        <button onClick={() => navigate("/login")} className={styles.submitButton}>
          Go to Login
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.authContainer}>
      <div className={styles.authForm}>
        <h2 className={styles.authTitle}>User Details</h2>
        <p>
          <strong>Name:</strong> {user.name}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Mobile:</strong> {user.mobile}
        </p>
        <p>
          <strong>Role:</strong> {user.role || 'user'}
        </p>

        <button onClick={handleLogout} className={styles.submitButton}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserDetails;
