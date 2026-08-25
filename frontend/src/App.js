import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import EventsPage from './pages/EventsPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import './App.css';

function App() {
  return (
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
              <li><Link to="/login" className="nav-link">Dashboard</Link></li>
            </ul>
          </div>
        </nav>
        <div className="garland-divider" aria-hidden="true"></div>

        <Routes>
          <Route path="/" element={<EventsPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>

        <footer style={{ background: 'var(--neel)', color: 'var(--white)', padding: '2rem 0', marginTop: '4rem', textAlign: 'center' }}>
          <div className="container">
            <p style={{ margin: 0, opacity: 0.9 }}>India Events · Delhi · Mumbai · Bangalore · Hyderabad · Pune</p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', opacity: 0.6, fontFamily: "'IBM Plex Mono', monospace" }}>
              Aggregated from AllEvents, Townscript, Insider, Meetup & Eventbrite
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;