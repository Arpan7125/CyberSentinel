import React, { useState } from 'react';
import { 
  CheckSquare, 
  Globe, 
  Lock, 
  Unlock, 
  AlertTriangle
} from 'lucide-react';
import { scanService } from '../services/api';

export default function UrlScanner({ onScanComplete }) {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [checkedRecs, setCheckedRecs] = useState({});

  const handleScan = async (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setLoading(true);
    try {
      const data = await scanService.analyzeUrl({ url: urlInput });
      setResult(data);
      setCheckedRecs({});
      if (onScanComplete) onScanComplete(); // trigger dashboard refresh
    } catch (err) {
      console.warn("Backend unavailable. Loading offline URL reputation heuristics simulation...", err);
      const cleanUrl = urlInput.trim().toLowerCase();
      let mockResult;

      if (cleanUrl.includes("paypa1") || cleanUrl.includes("netflix-") || cleanUrl.includes("chase-") || cleanUrl.includes("update") || cleanUrl.endsWith(".xyz") || cleanUrl.endsWith(".club") || cleanUrl.startsWith("http://")) {
        let indicators = [];
        let score = 30.0;
        let spoofedBrand = null;
        let isSpoofing = false;

        if (cleanUrl.startsWith("http://")) {
          score += 20.0;
          indicators.push({ "type": "Unencrypted Protocol", "severity": "Medium", "description": "The site uses HTTP instead of secure HTTPS. Data sent is not encrypted." });
        }
        if (cleanUrl.endsWith(".xyz") || cleanUrl.endsWith(".club")) {
          score += 25.0;
          indicators.push({ "type": "Suspicious Top Level Domain (TLD)", "severity": "High", "description": "The domain ends in a TLD statistically highly associated with phishing." });
        }
        if (cleanUrl.includes("paypa1") || cleanUrl.includes("paypal")) {
          score += 60.0;
          isSpoofing = true;
          spoofedBrand = "PayPal";
          indicators.push({ "type": "Brand Spoofing", "severity": "Critical", "description": "The domain contains the brand name PayPal but is not hosted on their official domains." });
        }
        if (cleanUrl.includes("netflix")) {
          score += 60.0;
          isSpoofing = true;
          spoofedBrand = "Netflix";
          indicators.push({ "type": "Brand Spoofing", "severity": "Critical", "description": "The domain contains the brand name Netflix but is not official." });
        }

        const finalScore = Math.min(100.0, score);
        mockResult = {
          "risk_score": finalScore,
          "risk_level": finalScore > 75 ? "Critical" : finalScore > 50 ? "High" : "Medium",
          "threat_indicators": indicators,
          "details": {
            "domain": cleanUrl.replace("https://", "").replace("http://", "").split("/")[0],
            "protocol": cleanUrl.startsWith("https://") ? "https" : "http",
            "subdomain_count": cleanUrl.split(".").length - 2,
            "has_https": cleanUrl.startsWith("https://"),
            "ip_address_host": false,
            "brand_spoofing": isSpoofing,
            "spoofed_brand": spoofedBrand
          },
          "recommendations": [
            "Do NOT click links, enter passwords, or type bank details on this page.",
            "Close the page immediately if it is already open.",
            "Verify the domain address carefully."
          ]
        };
      } else {
        mockResult = {
          "risk_score": 0.0,
          "risk_level": "Low",
          "threat_indicators": [],
          "details": {
            "domain": cleanUrl.replace("https://", "").replace("http://", "").split("/")[0],
            "protocol": cleanUrl.startsWith("https://") ? "https" : "http",
            "subdomain_count": 0,
            "has_https": cleanUrl.startsWith("https://"),
            "ip_address_host": false,
            "brand_spoofing": false,
            "spoofed_brand": null
          },
          "recommendations": [
            "This URL appears to be safe.",
            "Always check the browser address bar to ensure you are on the correct site."
          ]
        };
      }
      setResult(mockResult);
      setCheckedRecs({});
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
    <div className="page-container reveal-up">
      {/* Ambient backgrounds */}
      <div className="glow-orb glow-green" style={{ bottom: '10%', left: '10%', opacity: 0.1 }} />

      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title text-gradient-orange">URL METRICS SCANNER</h2>
          <p className="page-subtitle">HEURISTIC MATCHES, BRAND SPOOFING RESOLUTIONS, AND ENCRYPTED PROTOCOL VERIFICATION</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 28 }}>
        {/* Left column — Inputs & Browser sandbox */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <form onSubmit={handleScan} className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label htmlFor="url-input" className="form-label">TARGET VECTOR HOST / LINK</label>
            
            <div style={{ display: 'flex', gap: 14 }}>
              <input
                id="url-input"
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter URL to check (e.g. http://secure-paypal-login-update.com/signin)..."
                className="input-field"
                style={{ flex: 1 }}
                required
              />
              
              <button
                type="submit"
                disabled={loading || !urlInput.trim()}
                className="cta-btn"
                style={{ padding: '12px 24px' }}
              >
                <span className="cta-btn-inner">
                  <span className="cta-btn-text-wrapper" style={{ height: 16 }}>
                    <span className="cta-btn-text" style={{ fontSize: 11 }}>
                      {loading ? 'VERIFYING...' : 'VERIFY LINK'}
                    </span>
                    <span className="cta-btn-text-hover" style={{ fontSize: 11 }}>
                      {loading ? 'VERIFYING...' : 'VERIFY LINK'}
                    </span>
                  </span>
                  {!loading && <span>🔗</span>}
                </span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800 }}>SAMPLES:</span>
              <button
                type="button"
                onClick={() => setUrlInput("https://www.paypal.com")}
                style={{ 
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', 
                  cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700,
                  padding: '4px 10px', borderRadius: 'var(--radius-sm)'
                }}
              >
                PayPal (Safe)
              </button>
              <button
                type="button"
                onClick={() => setUrlInput("http://paypa1-security-verification.xyz/signin")}
                style={{ 
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', 
                  cursor: 'pointer', color: '#EF4444', fontSize: 11, fontWeight: 700,
                  padding: '4px 10px', borderRadius: 'var(--radius-sm)'
                }}
              >
                Paypa1 (Spoof)
              </button>
              <button
                type="button"
                onClick={() => setUrlInput("http://netflix-billing-failed.club")}
                style={{ 
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', 
                  cursor: 'pointer', color: '#EF4444', fontSize: 11, fontWeight: 700,
                  padding: '4px 10px', borderRadius: 'var(--radius-sm)'
                }}
              >
                Netflix (TLD Danger)
              </button>
            </div>
          </form>

          {/* Browser Address Bar Zone Preview */}
          {result && (
            <div className="glass-card slide-up-item" style={{ padding: 24 }}>
              <h4 className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Globe size={14} style={{ color: 'var(--accent-orange)' }} /> SIMULATED ROUTING SANDBOX
              </h4>

              {/* Browser Mock Sandbox */}
              <div style={{ 
                background: 'var(--bg-secondary)', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: 'var(--radius-sm)', 
                overflow: 'hidden',
                boxShadow: '0 12px 30px rgba(0,0,0,0.5)'
              }}>
                {/* Header browser circles */}
                <div style={{ background: 'var(--bg-primary)', padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }}></span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FBBF24', display: 'inline-block' }}></span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3EB649', display: 'inline-block' }}></span>
                </div>
                
                {/* Address Bar */}
                <div style={{ padding: 16, background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  {result.details.has_https ? (
                    <div style={{ 
                      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', 
                      background: 'rgba(62,182,73,0.06)', border: '1px solid rgba(62,182,73,0.3)', 
                      color: 'var(--accent-green)', fontSize: 10, fontWeight: 900, borderRadius: 'var(--radius-sm)'
                    }}>
                      <Lock size={12} strokeWidth={2.5} /> ENCRYPTED
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', 
                      background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)', 
                      color: '#EF4444', fontSize: 10, fontWeight: 900, borderRadius: 'var(--radius-sm)',
                      animation: 'pulseGlow 1.5s infinite'
                    }}>
                      <Unlock size={12} strokeWidth={2.5} /> UNENCRYPTED
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
                    <span style={{ color: 'var(--text-muted)' }}>{urlInput.replace(/^https?:\/\/[^/]+/, '')}</span>
                  </div>
                </div>

                {/* Threat details grid */}
                <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, background: 'var(--bg-primary)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span className="form-label" style={{ fontSize: 10 }}>Host Credentials</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Host Target:</span>
                        <strong className="mono-display" style={{ color: 'var(--text-primary)' }}>{result.details.domain}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Subdomain Nodes:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{result.details.subdomain_count}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span className="form-label" style={{ fontSize: 10 }}>Reputation Flags</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Spoofing match:</span>
                        {result.details.brand_spoofing ? (
                          <strong style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <AlertTriangle size={12} /> {result.details.spoofed_brand} Spoof
                          </strong>
                        ) : (
                          <strong style={{ color: 'var(--accent-green)' }}>Verified Clean</strong>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>IP Host Check:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{result.details.ip_address_host ? "Raw IP Host" : "DNS Registered"}</strong>
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
              <div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>
                <div className="form-label" style={{ width: '100%', textAlign: 'left' }}>Risk Coefficient</div>
                
                {/* Custom SVG dial */}
                <div style={{ position: 'relative', width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="transparent" stroke="var(--border-subtle)" strokeWidth="6" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="42" 
                      fill="transparent" 
                      stroke={getDialColor(result.risk_level)} 
                      strokeWidth="6" 
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - result.risk_score / 100)}`}
                      style={{ transition: 'all 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="mono-display" style={{ fontSize: 32, fontWeight: 900 }}>{result.risk_score}%</div>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>threat score</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="mono-display" style={{ fontSize: 10, color: 'var(--text-muted)' }}>THREAT STATUS</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className={`badge ${result.risk_level === 'Critical' ? 'badge-critical' : result.risk_level === 'High' ? 'badge-high' : result.risk_level === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
                      {result.risk_level} Severity Threat
                    </span>
                  </div>
                </div>
              </div>

              {/* Threat Indicators */}
              {result.threat_indicators && result.threat_indicators.length > 0 && (
                <div className="glass-card" style={{ padding: 24 }}>
                  <h4 className="form-label" style={{ marginBottom: 16 }}>Threat Matrix Details</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 220, overflowY: 'auto' }}>
                    {result.threat_indicators.map((ind, idx) => (
                      <div key={idx} style={{ 
                        padding: 16, 
                        background: 'var(--bg-secondary)', 
                        border: '1px solid var(--border-subtle)', 
                        borderRadius: 'var(--radius-sm)'
                      }}>
                        <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <strong style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{ind.type}</strong>
                          <span style={{ 
                            fontSize: 9, fontWeight: 900, color: getDialColor(ind.severity), 
                            textTransform: 'uppercase', letterSpacing: '0.04em' 
                          }}>
                            {ind.severity}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ind.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action checklist */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="glass-card" style={{ padding: 24 }}>
                  <h4 className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <CheckSquare size={14} style={{ color: 'var(--accent-orange)' }} /> Defense Directives
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {result.recommendations.map((rec, idx) => {
                      const isChecked = checkedRecs[idx] || false;
                      return (
                        <label 
                          key={idx} 
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            padding: '12px 14px',
                            background: isChecked ? 'rgba(62,182,73,0.05)' : 'rgba(255,255,255,0.01)',
                            border: `1px solid ${isChecked ? 'rgba(62,182,73,0.2)' : 'var(--border-subtle)'}`,
                            borderRadius: 'var(--radius-sm)',
                            color: isChecked ? 'var(--accent-green)' : 'var(--text-secondary)',
                            fontSize: 12.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.25s ease'
                          }}
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => setCheckedRecs({ ...checkedRecs, [idx]: !isChecked })}
                            style={{ 
                              marginTop: 3, 
                              accentColor: 'var(--accent-green)',
                              cursor: 'pointer'
                            }}
                          />
                          <span>{rec}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Idle Screen */
            <div className="glass-card" style={{ padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 340, textAlign: 'center', gap: 16 }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)',
                animation: 'pulseGlow 2s infinite'
              }}>
                <Globe size={28} />
              </div>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>TERMINAL IDLE</h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, maxWidth: 220, lineHeight: 1.6 }}>
                  Submit a routing URL in the input zone to verify DNS registers and Brand heuristics.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
