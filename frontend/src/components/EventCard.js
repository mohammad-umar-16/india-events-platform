// EventCard.js - full file
import React, { useState } from 'react';
import { format } from 'date-fns';
import EmailCaptureModal from './EmailCaptureModal';

function EventCard({ event }) {
  const [showModal, setShowModal] = useState(false);
  const [imgFailed, setImgFailed] = useState(false); // fallback to placeholder instead of vanishing

  const formatDate = (dateString) => {
    try { return format(new Date(dateString), 'EEE, MMM d, yyyy'); } catch { return 'Date TBA'; }
  };
  const formatTime = (dateString) => {
    try { return format(new Date(dateString), 'h:mm a'); } catch { return 'Time TBA'; }
  };
  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
  };

  const showImage = event.imageUrl && !imgFailed;

  return (
    <>
      <div className="event-card">
        <div className="event-image-wrap">
          {showImage ? (
            <img src={event.imageUrl} alt={event.title} className="event-image"
              onError={() => setImgFailed(true)} />
          ) : (
            <div className="event-image-placeholder">🎉</div>
          )}
        </div>

        <div className="event-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            {event.category && <span className="event-category">{event.category}</span>}
            {event.city && (
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {event.city}
              </span>
            )}
          </div>

          <h3 className="event-title">{event.title}</h3>

          <div className="event-meta">
            <div className="event-meta-item"><span>📅</span><span>{formatDate(event.dateTime)}</span></div>
            <div className="event-meta-item"><span>🕐</span><span>{formatTime(event.dateTime)}</span></div>
            {event.venueName && <div className="event-meta-item"><span>📍</span><span>{event.venueName}</span></div>}
            {event.priceInfo && <div className="event-meta-item"><span>🎟️</span><span>{event.priceInfo}</span></div>}
          </div>

          {event.description && <p className="event-description">{truncateText(event.description)}</p>}

          <div className="event-footer">
            <span className="event-source-tag">via {event.sourceWebsite}</span>
            <button className="btn btn-primary btn-small" onClick={() => setShowModal(true)}>Get Tickets</button>
          </div>
        </div>
      </div>

      {showModal && <EmailCaptureModal event={event} onClose={() => setShowModal(false)} />}
    </>
  );
}

export default EventCard;