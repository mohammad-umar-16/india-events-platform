import React, { useState, useEffect } from 'react';
import EventCard from '../components/EventCard';
import { favoritesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

function MyEventsPage() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    favoritesAPI.getAll()
      .then(res => setEvents(res.data.events))
      .catch(() => toast.error('Failed to load your saved events'))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const handleUnsave = (eventId) => {
    setEvents(prev => prev.filter(e => e._id !== eventId));
  };

  if (authLoading || loading) {
    return (
      <div className="events-page">
        <div className="header">
          <div className="container header-content">
            <h1 className="site-title">My Events</h1>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="events-page">
        <div className="header">
          <div className="container header-content">
            <h1 className="site-title">My Events</h1>
            <p className="site-subtitle">Sign in to save events you're interested in</p>
          </div>
        </div>
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">🔐</div>
            <h3>Sign in to see your saved events</h3>
            <button className="btn btn-primary" onClick={() => authAPI.loginWithGoogle()}>
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="events-page">
      <div className="header">
        <div className="container header-content">
          <h1 className="site-title">My Events</h1>
          <p className="site-subtitle">Events you've saved for later</p>
        </div>
      </div>
      <div className="garland-divider" aria-hidden="true"></div>

      <div className="container">
        <div className="events-section" style={{ paddingTop: '1.5rem' }}>
          {events.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💫</div>
              <h3>No saved events yet</h3>
              <p>Tap the heart on any event to save it here.</p>
            </div>
          ) : (
            <div className="events-grid">
              {events.map(event => (
                <EventCard key={event._id} event={event} initiallySaved={true} onUnsave={handleUnsave} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyEventsPage;