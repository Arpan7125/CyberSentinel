import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldCheck, Database, Smartphone, CheckCircle2 } from 'lucide-react';
import { integrationsService } from '../../services/api';

export default function ApiIntegrationsPage() {
  const [keys, setKeys] = useState({
    virustotal_api_key: '',
    twilio_sid: '',
    twilio_token: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchConfig() {
      try {
        const response = await integrationsService.getConfig();
        if (active && response) {
          setKeys({
            virustotal_api_key: response.virustotal_api_key || '',
            twilio_sid: response.twilio_sid || '',
            twilio_token: response.twilio_token || '',
          });
        }
      } catch (err) {
        console.error('Error fetching integrations config:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchConfig();
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (e) => {
    setKeys({ ...keys, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await integrationsService.saveConfig(keys);
      setSaved(true);
    } catch (err) {
      alert(err.message || 'Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400 }}>
        <div className="spinner" style={{ width: 40, height: 40 }}></div>
      </div>
    );
  }

  return (
    <div className="md-fade-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 12 }}>
          <KeyRound size={24} color="var(--accent)" />
        </div>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: 28 }}>API Integrations Manager</h1>
          <p className="page-subtitle" style={{ margin: 0, marginTop: 4 }}>Configure the external API keys for VirusTotal scanning and Twilio SMS alerts. Email, SMS, and screenshot analysis run on the platform's own built-in models — no external AI key required.</p>
        </div>
      </div>

      <div style={{ maxWidth: 800 }}>
        <form onSubmit={handleSave} className="glass-card" style={{ padding: 32 }}>
          
          <div style={{ marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Database size={20} color="var(--accent-teal)" />
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>VirusTotal (File/URL Scanning)</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>Provides real-time reputation lookups for URLs, IP addresses, and file hashes.</p>
            <input 
              type="password" 
              name="virustotal_api_key"
              placeholder="API Key..."
              value={keys.virustotal_api_key}
              onChange={handleChange}
              style={{ width: '100%', padding: 16, background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Smartphone size={20} color="var(--accent-orange)" />
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Twilio (SMS Alerts)</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>Sends outbound SMS warning messages. Without these, alerts are written to the server log instead of being delivered.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 650, marginBottom: 8 }}>TWILIO ACCOUNT SID</label>
                <input 
                  type="text" 
                  name="twilio_sid"
                  placeholder="AC..."
                  value={keys.twilio_sid}
                  onChange={handleChange}
                  style={{ width: '100%', padding: 16, background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 650, marginBottom: 8 }}>TWILIO AUTH TOKEN</label>
                <input 
                  type="password" 
                  name="twilio_token"
                  placeholder="Auth Token..."
                  value={keys.twilio_token}
                  onChange={handleChange}
                  style={{ width: '100%', padding: 16, background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
            {saved && <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-green)', fontSize: 14, fontWeight: 600 }}><CheckCircle2 size={16} /> Keys Saved</div>}
            <button type="submit" className="btn-pub btn-pub-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>

        </form>

        <div className="glass-card" style={{ padding: 24, marginTop: 24, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <ShieldCheck size={24} color="var(--accent-green)" />
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 16 }}>How these keys are stored</h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
              Keys are saved to your account on the server and are only used to call the service they belong to.
              They are stored as plain text in the database, not encrypted at rest — so treat database access as
              equivalent to holding these keys, and prefer scoped keys you can revoke.
              A key left blank simply leaves that feature reporting itself as not configured.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
