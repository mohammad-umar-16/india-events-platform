import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import EventsPage from './pages/EventsPage';
import MyEventsPage from './pages/MyEventsPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { authAPI } from './services/api';
import './App.css';

function NavAuthSection() {
  const { user, logout, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <li>
        <button className="nav-link nav-signin-btn" onClick={() => authAPI.loginWithGoogle()}>
          Sign in with Google
        </button>
      </li>
    );
  }

  return (
    <>
      <li><Link to="/my-events" className="nav-link">My Events</Link></li>
      <li className="nav-user">
        {user.picture && <img src={user.picture} alt={user.name} className="nav-avatar" />}
        <span className="nav-username">{user.name?.split(' ')[0]}</span>
        <button className="nav-link nav-signout-btn" onClick={logout}>Sign out</button>
      </li>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff', color: '#1B2A4A', border: '1px solid #E8DCC8',
                padding: '16px', borderRadius: '8px', boxShadow: '0 4px 16px rgba(27, 42, 74, 0.12)'
              },
              success: { iconTheme: { primary: '#2F6E62', secondary: '#fff' } },
              error: { iconTheme: { primary: '#D64511', secondary: '#fff' } },
            }}
          />

          <nav className="nav">
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link to="/" className="nav-brand">India Events</Link>
              <ul className="nav-links">
                <li><Link to="/" className="nav-link">Events</Link></li>
                <NavAuthSection />
              </ul>
            </div>
          </nav>

          <Routes>
            <Route path="/" element={<EventsPage />} />
            <Route path="/my-events" element={<MyEventsPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>

          <footer className="site-footer">
            <div className="container">
              <div className="footer-content">
                <div>
                  <div className="footer-brand">India Events</div>
                  <p className="footer-cities">Delhi · Mumbai · Bangalore · Hyderabad · Pune</p>
                </div>
              </div>
              <p className="footer-sources">Aggregated from AllEvents, Townscript, District, Meetup & Eventbrite</p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;