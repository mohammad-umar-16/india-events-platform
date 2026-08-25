import React, { useState, useEffect, useCallback } from 'react';
import EventCard from '../components/EventCard';
import { eventsAPI } from '../services/api';
import toast from 'react-hot-toast';

const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Pune'];

function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCity, setSelectedCity] = useState('Delhi');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce search input so we don't fire a request on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { city: selectedCity, limit: 100 };
      if (selectedCategory) params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;
      const response = await eventsAPI.getAll(params);
      setEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [selectedCity, selectedCategory, searchTerm]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await eventsAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  return (
    <div className="events-page">
      <div className="header">
        <div className="container header-content">
          <h1 className="site-title">India Events</h1>
          <p className="site-subtitle">Concerts, workshops, festivals and everything in between</p>
        </div>
      </div>

      <div className="container">
        <div className="events-section">
          <div className="city-stamps" role="group" aria-label="Filter by city">
            {CITIES.map(city => (
              <button key={city} className={`city-stamp ${selectedCity === city ? 'active' : ''}`} onClick={() => setSelectedCity(city)}>
                {city}
              </button>
            ))}
          </div>

          {categories.length > 0 && (
            <div className="category-chips" role="group" aria-label="Filter by category">
              <button className={`category-chip ${selectedCategory === '' ? 'active' : ''}`} onClick={() => setSelectedCategory('')}>All</button>
              {categories.map(cat => (
                <button key={cat} className={`category-chip ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div style={{ marginBottom: '2rem' }}>
            <input type="text" placeholder="Search events..." className="form-input" style={{ maxWidth: '340px' }}
              value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>

          {loading ? (
            <div className="loading"><div className="spinner"></div><p>Loading events...</p></div>
          ) : events.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎭</div>
              <h3>No events found</h3>
              <p>Try a different city, category, or check back later for new events.</p>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-secondary)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.9rem' }}>
                Showing {events.length} event{events.length !== 1 ? 's' : ''} in {selectedCity}
              </div>
              <div className="events-grid">
                {events.map(event => <EventCard key={event._id} event={event} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventsPage;