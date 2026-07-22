import React, { useState } from 'react';

export default function NewsletterForm({ variant = 'inline' }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(''); // '', 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }
    setStatus('loading');
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API}/subscribe/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: '' }),
      });
      if (res.ok) {
        setStatus('success');
        setMessage('You\'re subscribed! Watch your inbox for threat intelligence updates.');
        setEmail('');
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus('error');
        setMessage(data.error || 'Subscription failed. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className={`newsletter-form newsletter-${variant}`}>
        <div className="newsletter-success">
          <span className="newsletter-success-icon">✓</span>
          <span>{message}</span>
        </div>
      </div>
    );
  }

  return (
    <form className={`newsletter-form newsletter-${variant}`} onSubmit={handleSubmit}>
      <div className="newsletter-input-group">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus(''); }}
          placeholder="Enter your email for threat updates"
          className="newsletter-input"
          aria-label="Email address for newsletter"
          required
        />
        <button type="submit" className="newsletter-btn" disabled={status === 'loading'}>
          {status === 'loading' ? (
            <span className="btn-spinner" />
          ) : 'Subscribe'}
        </button>
      </div>
      {status === 'error' && <p className="newsletter-error">{message}</p>}
      <p className="newsletter-disclaimer">No spam. Unsubscribe anytime. Read our <a href="/privacy">Privacy Policy</a>.</p>
    </form>
  );
}
