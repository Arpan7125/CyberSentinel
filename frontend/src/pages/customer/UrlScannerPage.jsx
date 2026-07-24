import React, { useState } from 'react';
import { CheckSquare, Globe, Lock, Unlock, AlertTriangle, Shield, Search } from 'lucide-react';
import { scanService } from '../../services/api';
import InfoTooltip from '../../components/ui/InfoTooltip';

export default function UrlScannerPage() {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [checkedRecs, setCheckedRecs] = useState({});

  const handleScan = async (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await scanService.analyzeUrl({ url: urlInput.trim() });
      const recList = (res.recommendations || []).map((text, i) => ({ id: `rec-${i}`, text }));
      setResult({
        ...res,
        recommendations: recList.length > 0 ? recList : [
          { id: 'rec-0', text: 'This URL appears safe based on domain age, SSL status, and threat databases.' }
        ]
      });
      setCheckedRecs({});
    } catch (err) {
      console.error(err);
      alert('Failed to analyze URL. Server might be down.');
    } finally {
      setLoading(false);
    }
  };

  const getDialColor = (level) => {
    switch (level) {
      case 'Critical': return '#EF4444';
      case 'High': return '#FF5A1F';
      case 'Medium': return '#FBBF24';
      default: return '#3EB649';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 40, maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginTop: 16 }}>
        <h1 className="page-title" style={{ fontSize: 28, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Globe size={28} color="var(--accent)" /> Advanced URL & Website Scanner
        </h1>
        <p className="page-subtitle">Perform deep WHOIS lookups, SSL validation, DNS analysis, and AI-powered phishing detection on any link.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 28 }}>
        {/* Left column — Inputs & Browser sandbox */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <form onSubmit={handleScan} className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label htmlFor="url-input" className="form-label">TARGET URL TO ANALYZE</label>
            
            <div style={{ display: 'flex', gap: 14 }}>
              <input
                id="url-input"
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter URL (e.g. http://secure-paypal-login-update.com/signin)"
                style={{ flex: 1, padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none' }}
                required
              />
              
              <button
                type="submit"
                disabled={loading || !urlInput.trim()}
                className="btn-pub btn-pub-primary"
                style={{ padding: '0 24px', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {loading ? 'ANALYZING...' : <><Search size={18} /> SCAN LINK</>}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>TRY A SAMPLE:</span>
              <button
                type="button"
                onClick={() => setUrlInput("https://www.paypal.com")}
                className="btn-pub btn-pub-ghost btn-pub-sm"
              >
                Legitimate Site
              </button>
              <button
                type="button"
                onClick={() => setUrlInput("http://paypa1-security-verification.xyz/signin")}
                className="btn-pub btn-pub-ghost btn-pub-sm"
                style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }}
              >
                Phishing Site
              </button>
            </div>
          </form>

          {/* Browser Address Bar Zone Preview */}
          {result && (
            <div className="glass-card slide-up-item" style={{ padding: 24 }}>
              <h4 className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Globe size={14} style={{ color: 'var(--accent-purple)' }} /> ISOLATED SANDBOX PREVIEW
              </h4>

              <div style={{ 
                background: 'var(--bg-secondary)', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: 'var(--radius-sm)', 
                overflow: 'hidden'
              }}>
                <div style={{ background: 'var(--bg-primary)', padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }}></span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FBBF24', display: 'inline-block' }}></span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3EB649', display: 'inline-block' }}></span>
                </div>
                
                <div style={{ padding: 16, background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  {result.details.protocol === 'https' ? (
                    <div style={{ 
                      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', 
                      background: 'rgba(62,182,73,0.06)', border: '1px solid rgba(62,182,73,0.3)', 
                      color: 'var(--accent-green)', fontSize: 10, fontWeight: 900, borderRadius: 'var(--radius-sm)'
                    }}>
                      <Lock size={12} strokeWidth={2.5} /> SECURE
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', 
                      background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)', 
                      color: '#EF4444', fontSize: 10, fontWeight: 900, borderRadius: 'var(--radius-sm)',
                      animation: 'pulseGlow 1.5s infinite'
                    }}>
                      <Unlock size={12} strokeWidth={2.5} /> UNSECURE
                    </div>
                  )}

                  <div className="mono-display" style={{ 
                    flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', 
                    borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 13 
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>{result.details.protocol}://</span>
                    <span style={{ color: result.details.brand_spoofing ? '#EF4444' : 'var(--text-primary)', fontWeight: 800 }}>
                      {result.details.domain}
                    </span>
                  </div>
                </div>

                {/* Technical details grid */}
                <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, background: 'var(--bg-primary)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span className="form-label" style={{ fontSize: 10 }}>WHOIS & DNS Info</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Domain Age:</span>
                        <strong style={{ color: (result.details?.whoisAge || '').includes('Days') ? '#EF4444' : 'var(--text-primary)' }}>{result.details?.whoisAge || 'Registered < 30 days ago'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Server Location:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{result.details?.ipLocation || 'Cloudflare CDN / US'}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span className="form-label" style={{ fontSize: 10 }}>Brand Safety</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Visual Spoofing:</span>
                        {result.details.brand_spoofing ? (
                          <strong style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <AlertTriangle size={12} /> Detected
                          </strong>
                        ) : (
                          <strong style={{ color: 'var(--accent-green)' }}>Clean</strong>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column — Dial & Indicators */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {result ? (
            <>
              {/* Verdict Indicator */}
              <div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center', border: result.risk_level === 'Critical' ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border-subtle)' }}>
                <div className="form-label" style={{ width: '100%', textAlign: 'left' }}>
                  <InfoTooltip 
                    title="Risk Score Calculation"
                    content="The Risk Score (0-100) is derived from multiple factors: domain age, SSL validity, known blacklists, visual brand spoofing detection, and heuristic pattern matching. Scores above 75 are considered Critical threats."
                  >
                    Risk Assessment
                  </InfoTooltip>
                </div>
                
                <div style={{ position: 'relative', width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="transparent" stroke="var(--border-subtle)" strokeWidth="6" />
                    <circle 
                      cx="50" cy="50" r="42" fill="transparent" 
                      stroke={getDialColor(result.risk_level)} strokeWidth="6" 
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - result.risk_score / 100)}`}
                      style={{ transition: 'all 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="mono-display" style={{ fontSize: 32, fontWeight: 900 }}>{result.risk_score}</div>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>score</span>
                  </div>
                </div>

                <span className={`badge ${result.risk_level === 'Critical' ? 'badge-critical' : result.risk_level === 'High' ? 'badge-high' : result.risk_level === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
                  {result.risk_level} Threat
                </span>
              </div>

              {/* Threat Indicators */}
              {result.threat_indicators.length > 0 && (
                <div className="glass-card" style={{ padding: 24 }}>
                  <h4 className="form-label" style={{ marginBottom: 16 }}>
                    <InfoTooltip 
                      title="Indicators of Compromise"
                      content="These are the specific flags triggered during our deep analysis. High and Critical severity indicators strongly correlate with active phishing or malware distribution."
                    >
                      Detected Vulnerabilities
                    </InfoTooltip>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {result.threat_indicators.map((ind, idx) => (
                      <div key={idx} style={{ padding: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{ind.type}</strong>
                          <span style={{ fontSize: 10, fontWeight: 800, color: getDialColor(ind.severity) }}>{ind.severity.toUpperCase()}</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ind.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="glass-card" style={{ padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 340, textAlign: 'center', gap: 16 }}>
              <Shield size={48} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase' }}>Waiting for Target</h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, maxWidth: 220 }}>Enter a URL to perform a comprehensive security analysis.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
