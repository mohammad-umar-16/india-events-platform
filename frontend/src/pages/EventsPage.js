import React, { useState, useEffect, useCallback, useRef } from 'react';
import EventCard from '../components/EventCard';
import { eventsAPI, favoritesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Pune'];

function SkeletonCard() {
  return (
    <div className="event-card-skeleton">
      <div className="skel-image skeleton-shimmer" />
      <div className="skel-body">
        <div className="skel-line short skeleton-shimmer" />
        <div className="skel-line title skeleton-shimmer" />
        <div className="skel-line skeleton-shimmer" />
        <div className="skel-line short skeleton-shimmer" />
      </div>
    </div>
  );
}

function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);       // first load only - shows skeletons
  const [refreshing, setRefreshing] = useState(false); // subsequent filter changes - dims grid
  const [categories, setCategories] = useState([]);
  const [selectedCity, setSelectedCity] = useState('Delhi');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchEvents = useCallback(async (isFirstLoad) => {
    if (isFirstLoad) setLoading(true); else setRefreshing(true);
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
      setRefreshing(false);
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

  useEffect(() => {
    fetchEvents(isFirstLoadRef.current);
    isFirstLoadRef.current = false;
  }, [fetchEvents]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  useEffect(() => {
    if (!user) { setSavedIds(new Set()); return; }
    favoritesAPI.getAll()
      .then(res => setSavedIds(new Set(res.data.events.map(e => e._id))))
      .catch(() => {});
  }, [user]);

  const activeFilterCount = (selectedCategory ? 1 : 0) + (searchTerm ? 1 : 0);

  return (
    <div className="events-page">
      <div className="header">
        <div className="container header-content">
          <h1 className="site-title">India Events</h1>
          <p className="site-subtitle">Concerts, workshops, festivals and everything in between</p>
        </div>
      </div>
      <div className="garland-divider" aria-hidden="true"></div>

      <div className="container">
        <div className="filter-bar">
          <div className="filter-bar-inner">
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

            <div className="filter-row-top">
              <div className="ticket-search">
                <input type="text" placeholder="Search events..."
                  value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
              </div>
              {activeFilterCount > 0 && (
                <span className="active-filter-badge">{activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active</span>
              )}
            </div>
          </div>
        </div>

        <div className="events-section" style={{ paddingTop: '1.5rem' }}>
          {loading ? (
            <div className="events-grid">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : events.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎭✨</div>
              <h3>No events found</h3>
              <p>Try a different city, category, or check back later for new events.</p>
            </div>
          ) : (
            <>
              {refreshing && (
                <div className="inline-loader">
                  <div className="spinner-sm"></div>
                  <span>Updating...</span>
                </div>
              )}
              <div style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-secondary)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.9rem' }}>
                Showing {events.length} event{events.length !== 1 ? 's' : ''} in {selectedCity}
              </div>
              <div className={`events-grid ${refreshing ? 'is-loading' : ''}`}>
                {events.map(event => (
                  <EventCard key={event._id} event={event} initiallySaved={savedIds.has(event._id)} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventsPage;