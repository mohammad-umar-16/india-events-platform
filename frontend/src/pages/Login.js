import React from 'react';
import { authAPI } from '../services/api';
import './Login.css';

function Login() {
  const handleGoogleLogin = () => {
    authAPI.loginWithGoogle();
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">India Events</h1>
            <p className="login-subtitle">Dashboard Login</p>
          </div>

          <div className="login-content">
            <p className="login-description">
              Sign in with your Google account to access the events dashboard
            </p>

            <button
              className="google-login-btn"
              onClick={handleGoogleLogin}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M19.8 10.2273C19.8 9.51818 19.7364 8.83636 19.6182 8.18182H10.2V12.05H15.6418C15.3818 13.3 14.6545 14.3591 13.5864 15.0682V17.5773H16.8182C18.7091 15.8364 19.8 13.2727 19.8 10.2273Z" fill="#4285F4"/>
                <path d="M10.2 20C12.9 20 15.1682 19.1045 16.8182 17.5773L13.5864 15.0682C12.6864 15.6682 11.5455 16.0227 10.2 16.0227C7.59545 16.0227 5.38182 14.2636 4.58636 11.9H1.25455V14.4909C2.89545 17.7591 6.30909 20 10.2 20Z" fill="#34A853"/>
                <path d="M4.58636 11.9C4.36364 11.3 4.23636 10.6591 4.23636 10C4.23636 9.34091 4.36364 8.7 4.58636 8.1V5.50909H1.25455C0.572727 6.86364 0.2 8.38636 0.2 10C0.2 11.6136 0.572727 13.1364 1.25455 14.4909L4.58636 11.9Z" fill="#FBBC05"/>
                <path d="M10.2 3.97727C11.6591 3.97727 12.9682 4.48182 13.9909 5.45455L16.8545 2.59091C15.1636 0.981818 12.8955 0 10.2 0C6.30909 0 2.89545 2.24091 1.25455 5.50909L4.58636 8.1C5.38182 5.73636 7.59545 3.97727 10.2 3.97727Z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>

            <div className="login-features">
              <h3>Dashboard Features:</h3>
              <ul>
                <li>✓ View and filter all events</li>
                <li>✓ Import events to platform</li>
                <li>✓ Track event status</li>
                <li>✓ Manage multiple cities</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="login-footer">
          <a href="/" className="back-link">← Back to Events</a>
        </div>
      </div>
    </div>
  );
}

export default Login;