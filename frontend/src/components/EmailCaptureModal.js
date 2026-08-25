import React, { useState } from 'react';
import { eventsAPI } from '../services/api';
import toast from 'react-hot-toast';

function EmailCaptureModal({ event, onClose }) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !consent) {
      toast.error('Please provide your email and accept the terms');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await eventsAPI.captureEmail({
        email,
        consent,
        eventId: event._id
      });

      toast.success('Email captured! Redirecting to event...');
      
      // Redirect to original event URL
      setTimeout(() => {
        window.open(response.data.redirectUrl, '_blank');
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error capturing email:', error);
      toast.error('Failed to capture email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Get Your Tickets</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {event.title}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div className="form-checkbox">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                />
                <label htmlFor="consent">
                  I agree to receive email updates about events and news. 
                  You can unsubscribe at any time.
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !email || !consent}
            >
              {isSubmitting ? 'Processing...' : 'Continue to Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmailCaptureModal;
