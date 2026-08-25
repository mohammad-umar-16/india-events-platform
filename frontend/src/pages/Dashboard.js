import React, { useState, useEffect, useCallback } from 'react';
import { dashboardAPI, authAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    city: 'Delhi',
    status: '',
    search: '',
    fromDate: '',
    toDate: '',
    imported: ''
  });

  const [importNotes, setImportNotes] = useState('');
  const [cities, setCities] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [userRes, statsRes, citiesRes] = await Promise.all([
        authAPI.getCurrentUser(),
        dashboardAPI.getStats(),
        dashboardAPI.getCities()
      ]);

      setUser(userRes.data);
      setStats(statsRes.data);
      setCities(citiesRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
    }
  };

  const fetchEvents = useCallback(async () => {
    try {
      const params = { ...filters };
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });

      const response = await dashboardAPI.getEvents(params);
      setEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    }
  }, [filters]);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [filters, user, fetchEvents]);

  const handleImport = async () => {
    if (!selectedEvent) return;

    try {
      await dashboardAPI.importEvent(selectedEvent._id, importNotes);
      toast.success('Event imported successfully!');
      setImportNotes('');
      setSelectedEvent(null);
      fetchEvents();
      loadDashboardData();
    } catch (error) {
      console.error('Error importing event:', error);
      toast.error('Failed to import event');
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="container">
          <div className="dashboard-header-content">
            <div>
              <h1 className="dashboard-title">Events Dashboard</h1>
              <p className="dashboard-subtitle">Manage and import events</p>
            </div>
            <div className="user-section">
              {user?.picture && (
                <img src={user.picture} alt={user.name} className="user-avatar" />
              )}
              <div>
                <div className="user-name">{user?.name}</div>
                <div className="user-email">{user?.email}</div>
              </div>
              <button onClick={handleLogout} className="btn btn-secondary btn-small">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats?.totalEvents || 0}</div>
            <div className="stat-label">Total Events</div>
          </div>
          <div className="stat-card stat-new">
            <div className="stat-value">{stats?.newEvents || 0}</div>
            <div className="stat-label">New Events</div>
          </div>
          <div className="stat-card stat-updated">
            <div className="stat-value">{stats?.updatedEvents || 0}</div>
            <div className="stat-label">Updated Events</div>
          </div>
          <div className="stat-card stat-imported">
            <div className="stat-value">{stats?.importedEvents || 0}</div>
            <div className="stat-label">Imported</div>
          </div>
          <div className="stat-card stat-inactive">
            <div className="stat-value">{stats?.inactiveEvents || 0}</div>
            <div className="stat-label">Inactive</div>
          </div>
        </div>

        <div className="filters-section">
          <h3 className="filters-title">Filters</h3>
          <div className="filters-grid">
            <div className="form-group">
              <label className="form-label">City</label>
              <select
                className="form-input"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              >
                <option value="">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="new">New</option>
                <option value="updated">Updated</option>
                <option value="inactive">Inactive</option>
                <option value="imported">Imported</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search title, venue..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">From Date</label>
              <input
                type="date"
                className="form-input"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">To Date</label>
              <input
                type="date"
                className="form-input"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Imported</label>
              <select
                className="form-input"
                value={filters.imported}
                onChange={(e) => setFilters({ ...filters, imported: e.target.value })}
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>

          <button
            className="btn btn-secondary btn-small"
            onClick={() => setFilters({
              city: 'Delhi',
              status: '',
              search: '',
              fromDate: '',
              toDate: '',
              imported: ''
            })}
          >
            Clear Filters
          </button>
        </div>

        <div className="dashboard-content">
          <div className="events-table-container">
            <h3 className="section-subtitle">Events ({events.length})</h3>
            <div className="table-wrapper">
              <table className="events-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Venue</th>
                    <th>Source</th>
                    <th>Imported</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => (
                    <tr
                      key={event._id}
                      className={selectedEvent?._id === event._id ? 'selected' : ''}
                      onClick={() => setSelectedEvent(event)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <span className={`status-badge status-${event.status}`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="event-title-cell">{event.title}</td>
                      <td>{format(new Date(event.dateTime), 'MMM d, yyyy')}</td>
                      <td>{event.venueName || 'TBA'}</td>
                      <td>{event.sourceWebsite}</td>
                      <td>{event.imported ? '✓' : '—'}</td>
                      <td>
                        {!event.imported && (
                          <button
                            className="btn btn-primary btn-small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
                            }}
                          >
                            Import
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {events.length === 0 && (
                <div className="empty-state">
                  <p>No events found matching your filters</p>
                </div>
              )}
            </div>
          </div>

          {selectedEvent && (
            <div className="event-preview">
              <div className="preview-header">
                <h3>Event Details</h3>
                <button
                  className="close-btn"
                  onClick={() => setSelectedEvent(null)}
                >
                  ✕
                </button>
              </div>

              <div className="preview-content">
                {selectedEvent.imageUrl && (
                  <img
                    src={selectedEvent.imageUrl}
                    alt={selectedEvent.title}
                    className="preview-image"
                  />
                )}

                <h2 className="preview-title">{selectedEvent.title}</h2>

                <div className="preview-meta">
                  <div className="preview-meta-item">
                    <strong>Date:</strong> {format(new Date(selectedEvent.dateTime), 'PPP')}
                  </div>
                  <div className="preview-meta-item">
                    <strong>Time:</strong> {format(new Date(selectedEvent.dateTime), 'p')}
                  </div>
                  <div className="preview-meta-item">
                    <strong>Venue:</strong> {selectedEvent.venueName || 'TBA'}
                  </div>
                  {selectedEvent.venueAddress && (
                    <div className="preview-meta-item">
                      <strong>Address:</strong> {selectedEvent.venueAddress}
                    </div>
                  )}
                  <div className="preview-meta-item">
                    <strong>City:</strong> {selectedEvent.city}
                  </div>
                  <div className="preview-meta-item">
                    <strong>Source:</strong> {selectedEvent.sourceWebsite}
                  </div>
                  <div className="preview-meta-item">
                    <strong>Status:</strong>{' '}
                    <span className={`status-badge status-${selectedEvent.status}`}>
                      {selectedEvent.status}
                    </span>
                  </div>
                </div>

                {selectedEvent.description && (
                  <div className="preview-description">
                    <strong>Description:</strong>
                    <p>{selectedEvent.description}</p>
                  </div>
                )}

                {selectedEvent.category && (
                  <div className="preview-meta-item">
                    <strong>Category:</strong> {selectedEvent.category}
                  </div>
                )}

                
                 <a  href={selectedEvent.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ marginTop: '1rem', display: 'inline-block' }}
                >
                  View Original Event
                </a>

                {!selectedEvent.imported && (
                  <div className="import-section">
                    <h4>Import to Platform</h4>
                    <div className="form-group">
                      <label className="form-label">Import Notes (Optional)</label>
                      <textarea
                        className="form-input"
                        rows="3"
                        placeholder="Add notes about this import..."
                        value={importNotes}
                        onChange={(e) => setImportNotes(e.target.value)}
                      />
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleImport}
                    >
                      Import Event
                    </button>
                  </div>
                )}

                {selectedEvent.imported && (
                  <div className="import-info">
                    <h4>Import Information</h4>
                    <p><strong>Imported At:</strong> {format(new Date(selectedEvent.importedAt), 'PPP p')}</p>
                    {selectedEvent.importedBy && (
                      <p><strong>Imported By:</strong> {selectedEvent.importedBy.name}</p>
                    )}
                    {selectedEvent.importNotes && (
                      <p><strong>Notes:</strong> {selectedEvent.importNotes}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;