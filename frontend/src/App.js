import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import EventsPage from './pages/EventsPage';
import MyEventsPage from './pages/MyEventsPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { authAPI } from './services/api';
import './App.css';

function NavSearch() {
  const [searchParams] = useSearchParams();
  const [value, setValue] = useState(searchParams.get('search') || '');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setValue(searchParams.get('search') || '');
  }, [searchParams]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const timer = setTimeout(() => {
      const current = searchParams.get('search') || '';
      if (value === current) return;

      const params = new URLSearchParams(location.pathname === '/' ? location.search : '');
      if (value) params.set('search', value); else params.delete('search');
      navigate(`/${params.toString() ? `?${params.toString()}` : ''}`);
    }, 400);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="nav-search">
      <input
        type="text"
        placeholder="Search events..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}

function NavCenterLinks() {
  const { user } = useAuth();
  return (
    <ul className="nav-links">
      <li><Link to="/" className="nav-link">Events</Link></li>
      {user && <li><Link to="/my-events" className="nav-link">My Events</Link></li>}
    </ul>
  );
}

function NavAuthRight() {
  const { user, logout, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <button className="nav-signin-btn" onClick={() => authAPI.loginWithGoogle()}>
        Sign in with Google
      </button>
    );
  }

  return (
    <div className="nav-user">
      {user.picture ? (
        <img src={user.picture} alt={user.name} className="nav-avatar" />
      ) : (
        <span className="nav-avatar-fallback">{user.name?.[0]?.toUpperCase()}</span>
      )}
      <span className="nav-username">{user.name?.split(' ')[0]}</span>
      <button className="nav-signout-btn" onClick={logout}>Sign out</button>
    </div>
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
            <div className="nav-row">
              <Link to="/" className="nav-logo">
                <svg className="nav-logo-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12C4 9.79086 5.79086 8 8 8H24C26.2091 8 28 9.79086 28 12V13C26.3431 13 25 14.3431 25 16C25 17.6569 26.3431 19 28 19V20C28 22.2091 26.2091 24 24 24H8C5.79086 24 4 22.2091 4 20V19C5.65685 19 7 17.6569 7 16C7 14.3431 5.65685 13 4 13V12Z" fill="#F2A93C"/>
                  <path d="M13 8V24" stroke="#1B2A4A" strokeWidth="1.5" strokeDasharray="2 2"/>
                </svg>
                <span className="nav-logo-text">IndieVents</span>
              </Link>
              <div className="nav-center">
                <NavSearch />
                <NavCenterLinks />
              </div>
              <div className="nav-right">
                <NavAuthRight />
              </div>
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
                  <div className="footer-brand">IndieVents</div>
                  <p className="footer-about-text">
                    A single place to browse concerts, workshops, comedy shows and festivals across India — pulled together from AllEvents, Townscript, District, Meetup and Eventbrite so you don't have to check five different sites.
                  </p>
                </div>

                <div>
                  <div className="footer-col-title">Explore</div>
                  <ul className="footer-link-list">
                    <li><Link to="/">All Events</Link></li>
                    <li><Link to="/my-events">My Saved Events</Link></li>
                  </ul>
                </div>

                <div>
                  <div className="footer-col-title">Cities</div>
                  <ul className="footer-link-list">
                    <li>Delhi</li>
                    <li>Mumbai</li>
                    <li>Bangalore</li>
                    <li>Hyderabad</li>
                    <li>Pune</li>
                  </ul>
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