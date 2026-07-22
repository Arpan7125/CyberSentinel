import React, { useState } from 'react';
import { UploadCloud, Shield, CheckCircle, Info } from 'lucide-react';
import { saasService } from '../../services/api';
import '../../assets/analyzer.css';

export default function ScamReporterPage() {
  const [form, setForm] = useState({
    type: 'email',
    title: '',
    source: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await saasService.reportScam({
        url_or_email: form.source,
        description: `[Type: ${form.type}, Title: ${form.title}]\n\n${form.description}`
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="analyzer-page" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <CheckCircle size={64} color="#32D74B" style={{ marginBottom: 24 }} />
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Report Submitted</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>Thank you for helping keep the community safe. Our security analysts and AI models are reviewing your submission.</p>
          <button className="btn-pub btn-pub-primary" onClick={() => setSubmitted(false)}>Submit Another Report</button>
        </div>
      </div>
    );
  }

  return (
    <div className="analyzer-page">
      <div className="analyzer-header">
        <h1>Report a Scam</h1>
        <p>Encountered a suspicious email, text message, website, or phone call? Report it here to help us update the global threat intelligence database.</p>
      </div>

      <div className="analyzer-content">
        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(255,59,48,0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', borderRadius: 8, marginBottom: 20 }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ background: 'var(--bg-secondary)', padding: 32, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: 16, background: 'rgba(50,215,75,0.05)', borderRadius: 8, border: '1px solid rgba(50,215,75,0.2)' }}>
            <Shield color="#32D74B" size={20} />
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Your report will be anonymized before being shared with the CyberSentinel community.</span>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Type of Threat</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {['email', 'sms', 'website', 'social', 'call', 'other'].map(t => (
                <label key={t} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px',
                  background: form.type === t ? 'rgba(175,82,222,0.1)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${form.type === t ? '#AF52DE' : 'var(--border-subtle)'}`,
                  borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
                  transition: 'all 0.2s'
                }}>
                  <input type="radio" name="type" value={t} checked={form.type === t} onChange={(e) => setForm({...form, type: e.target.value})} style={{ display: 'none' }} />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Incident Title</label>
            <input 
              required
              type="text" 
              placeholder="e.g., Fake PayPal Invoice Email" 
              value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})}
              style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', padding: 12, borderRadius: 8, color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Source (Sender Email, Phone Number, or URL)</label>
            <input 
              required
              type="text" 
              placeholder="e.g., security-update@pay-pal-secure.com" 
              value={form.source}
              onChange={(e) => setForm({...form, source: e.target.value})}
              style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', padding: 12, borderRadius: 8, color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Details</label>
            <textarea 
              required
              placeholder="Describe the scam. What happened? What did they ask for?" 
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', padding: 12, borderRadius: 8, color: 'var(--text-primary)', outline: 'none', minHeight: 120, resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: 32 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Attachments (Optional)</label>
            <div style={{ border: '2px dashed var(--border-subtle)', borderRadius: 8, padding: 32, textAlign: 'center', cursor: 'pointer', background: 'var(--bg-secondary)' }}>
              <UploadCloud size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>Upload screenshots, emails, or files</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>JPG, PNG, PDF, EML (Max 10MB)</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
            <button type="button" className="btn-pub btn-pub-ghost">Cancel</button>
            <button type="submit" className="btn-pub btn-pub-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
