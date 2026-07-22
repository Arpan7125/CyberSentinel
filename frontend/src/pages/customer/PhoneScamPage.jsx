import React, { useState } from 'react';
import { Smartphone, Phone, ShieldAlert, AlertTriangle, CheckCircle, Globe, Flag, User, MapPin } from 'lucide-react';
export default function PhoneScamPage() {
  const [phone, setPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!phone) return;
    setIsSearching(true);
    setResult(null);
    
    // Simulate API call
    setTimeout(() => {
      setIsSearching(false);
      setResult({
        number: phone,
        country: 'United States',
        carrier: 'Twilio / VoIP',
        type: 'VoIP (High Risk)',
        reputation: 'Dangerous',
        spamScore: 92,
        reports: 142,
        lastReported: '2 hours ago',
        aiAssessment: 'This number exhibits behavior consistent with highly automated robocall campaigns and IRS imposter scams. Multiple users report aggressive demands for payment in gift cards.',
        communityComments: [
          { author: 'User749', text: 'Claimed to be from the IRS. Very aggressive.', date: 'Today' },
          { author: 'Anonymous', text: 'Left a robotic voicemail about an arrest warrant.', date: 'Yesterday' }
        ]
      });
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 40, maxWidth: 900, margin: '0 auto' }}>
      
      {/* Header & Search */}
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}><Smartphone size={48} color="var(--accent)" /></div>
        <h1 className="page-title" style={{ fontSize: 32 }}>Phone Scam Intelligence</h1>
        <p className="page-subtitle" style={{ maxWidth: 600, margin: '0 auto 32px' }}>
          Search our global community database to identify unknown callers, robocalls, and active phone scams.
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, maxWidth: 600, margin: '0 auto' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}><Phone size={18} color="var(--text-muted)" /></span>
            <input 
              type="tel" 
              placeholder="Enter phone number (e.g. +1 555-0199)" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', padding: '16px 16px 16px 48px', fontSize: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>
          <button type="submit" className="btn-pub btn-pub-primary" disabled={isSearching} style={{ padding: '0 32px' }}>
            {isSearching ? 'Scanning...' : 'Analyze Number'}
          </button>
        </form>
      </div>

      {/* Results Section */}
      {result && (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          <div className="glass-card" style={{ padding: 32, position: 'relative', overflow: 'hidden' }}>
            
            {/* Risk Indicator Background */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, background: result.spamScore > 80 ? 'var(--accent-red)' : 'var(--accent-green)', filter: 'blur(120px)', opacity: 0.15, borderRadius: '50%' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Intelligence Report For</div>
                <h2 style={{ fontSize: 36, fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: 2 }}>{result.number}</h2>
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <span style={{ padding: '4px 12px', background: 'var(--bg-tertiary)', borderRadius: 20, fontSize: 13 }}> {result.country}</span>
                  <span style={{ padding: '4px 12px', background: 'var(--bg-tertiary)', borderRadius: 20, fontSize: 13 }}> {result.carrier}</span>
                  <span style={{ padding: '4px 12px', background: 'var(--bg-tertiary)', borderRadius: 20, fontSize: 13 }}> {result.type}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Spam Score</div>
                <div style={{ fontSize: 48, fontWeight: 800, color: result.spamScore > 80 ? 'var(--accent-red)' : 'var(--accent-green)', lineHeight: 1 }}>{result.spamScore}<span style={{ fontSize: 24, color: 'var(--text-muted)' }}>/100</span></div>
                <div style={{ fontSize: 14, fontWeight: 700, color: result.spamScore > 80 ? 'var(--accent-red)' : 'var(--accent-green)', marginTop: 8 }}>{result.reputation.toUpperCase()}</div>
              </div>
            </div>

            <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              
              {/* AI Assessment */}
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}> AI Behavioral Assessment</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{result.aiAssessment}</p>
                <div style={{ marginTop: 24, padding: 16, background: 'rgba(255,55,95,0.05)', border: '1px solid rgba(255,55,95,0.2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Community Flags</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-red)' }}>{result.reports} Reports</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Last reported: {result.lastReported}</div>
                </div>
              </div>

              {/* Community Comments */}
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}> Recent Community Reports</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {result.communityComments.map((c, i) => (
                    <div key={i} style={{ padding: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
                      <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>"{c.text}"</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                        <span>Reported by {c.author}</span>
                        <span>{c.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div style={{ marginTop: 32, display: 'flex', gap: 16 }}>
              <button className="btn-pub btn-pub-primary" style={{ background: 'var(--accent-red)' }}> Report this Number</button>
              <button className="btn-pub btn-pub-ghost">Mark as Safe</button>
            </div>
            
          </div>
        </div>
      )}

      {/* Global Intel Map visual filler */}
      {!result && !isSearching && (
        <div style={{ textAlign: 'center', opacity: 0.5, marginTop: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}></div>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto' }}>Our global telemetry network processes over 1.2 million spam calls daily to keep our threat database updated.</p>
        </div>
      )}

    </div>
  );
}
