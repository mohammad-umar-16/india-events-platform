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

        <Routes>
          <Route path="/" element={<EventsPage />} />
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
  );
}

export default App;