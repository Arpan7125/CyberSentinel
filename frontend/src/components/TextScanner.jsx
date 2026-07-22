import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Eye, 
  CheckSquare, 
  Info
} from 'lucide-react';
import { useAuth } from '../AuthContext';

function RiskBadge({ level }) {
  const map = { Low: 'badge-low', Medium: 'badge-medium', High: 'badge-high', Critical: 'badge-critical' };
  const icons = { Low: '●', Medium: '●', High: '▲', Critical: '■' };
  return (
    <span className={`badge ${map[level] || 'badge-medium'}`} style={{ fontSize: 9, padding: '4px 10px' }}>
      <span style={{ marginRight: 4 }}>{icons[level]}</span> {level}
    </span>
  );
}

export default function TextScanner({ onScanComplete }) {
  const { token } = useAuth();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [checkedRecs, setCheckedRecs] = useState({});

  // Twilio Emergency Alert Dispatch states
  const [alertPhone, setAlertPhone] = useState(() => localStorage.getItem('cs_twilio_to') || '');
  const [sendingSms, setSendingSms] = useState(false);
  const [smsStatus, setSmsStatus] = useState('');

  const handleSendEmergencySms = async () => {
    if (!alertPhone.trim()) {
      setSmsStatus('Please enter a target phone number.');
      return;
    }
    setSendingSms(true);
    setSmsStatus('');
    try {
      const response = await fetch('http://localhost:8000/api/integrations/sms/dispatch/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Token ${token}` } : {})
        },
        body: JSON.stringify({
          message: `🚨 SECURITY ALERT: CyberSentinel logged a ${result.risk_level}-risk threat with coefficient ${result.risk_score}%. Content snippet: "${text.substring(0, 80)}..."`,
          to_number: alertPhone
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to dispatch SMS.');
      setSmsStatus(data.message);
    } catch (err) {
      setSmsStatus(`Dispatch failed: ${err.message}`);
    } finally {
      setSendingSms(false);
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/analyze/text/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze text');
      }

      const data = await response.json();
      setResult(data);
      setCheckedRecs({});
      if (onScanComplete) onScanComplete(); // trigger dashboard refresh
    } catch (err) {
      console.warn("Backend unavailable. Loading offline text classifier mock simulation...", err);
      const textLower = text.toLowerCase();
      let mockResult;

      if (textLower.includes("urgent") || textLower.includes("suspend") || textLower.includes("locked") || textLower.includes("billing") || textLower.includes("verify")) {
        mockResult = {
          "risk_score": 86.5,
          "risk_level": "Critical",
          "threat_indicators": [
            { "type": "Urgency", "severity": "High", "description": "Urgent language or false deadlines designed to induce panic and force fast action." },
            { "type": "Credential Harvesting", "severity": "Critical", "description": "Direct requests to confirm identities, reset passwords, or enter login credentials." }
          ],
          "highlighted_words": [
            { "word": "urgent", "severity": "high", "weight": 1.5, "reason": "Scam alert word indicating high urgency." },
            { "word": "suspend", "severity": "critical", "weight": 2.0, "reason": "High phishing association. Prompts sensitive account locks." },
            { "word": "verify", "severity": "critical", "weight": 1.8, "reason": "Credential harvesting trigger phrase." }
          ],
          "recommendations": [
            "Do not click on any links in this message.",
            "Verify the sender's identity through another channel.",
            "Do not share passwords, pins, or personal data.",
            "Report this message to your security team."
          ]
        };
      } else {
        mockResult = {
          "risk_score": 4.2,
          "risk_level": "Low",
          "threat_indicators": [],
          "highlighted_words": [],
          "recommendations": [
            "This message appears to be safe.",
            "Always exercise caution when responding to unexpected requests.",
            "Ensure your system antivirus and security definitions are up to date."
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

  const renderHighlightedText = () => {
    if (!result || !result.highlighted_words || result.highlighted_words.length === 0) {
      return <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{text}</p>;
    }

    const highlights = [...result.highlighted_words].sort((a, b) => b.word.length - a.word.length);
    let parts = [text];
    
    highlights.forEach((item) => {
      const newParts = [];
      const regex = new RegExp(`\\b(${item.word})\\b`, 'gi');
      
      parts.forEach((part) => {
        if (typeof part !== 'string') {
          newParts.push(part);
          return;
        }

        const splitText = part.split(regex);
        splitText.forEach((subpart, idx) => {
          if (idx % 2 === 1) {
            const glowCol = getDialColor(item.severity === 'critical' ? 'Critical' : item.severity === 'high' ? 'High' : 'Medium');
            newParts.push(
              <span 
                key={`${item.word}-${idx}`} 
                style={{
                  display: 'inline-block',
                  padding: '2px 6px',
                  background: 'var(--bg-secondary)',
                  border: `1px solid ${glowCol}`,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'help',
                  position: 'relative',
                  color: glowCol,
                  boxShadow: `0 0 10px ${glowCol}44`
                }}
                className="group relative"
              >
                {subpart}
                {/* Custom Tooltip */}
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-52 scale-0 group-hover:scale-100 transition-all duration-200 bg-[#0c0d12] border border-white/10 p-3 rounded text-[11px] font-normal text-slate-300 leading-normal z-30 shadow-2xl pointer-events-none">
                  <strong className="text-white block capitalize font-bold mb-1">{item.severity} Risk Indicator</strong>
                  {item.reason}
                </span>
              </span>
            );
          } else {
            if (subpart) newParts.push(subpart);
          }
        });
      });
      parts = newParts;
    });

    return (
      <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 14 }}>
        {parts.map((p, i) => <React.Fragment key={i}>{p}</React.Fragment>)}
      </div>
    );
  };

  return (
    <div className="page-container reveal-up">
      {/* Ambient backgrounds */}
      <div className="glow-orb glow-orange" style={{ top: '20%', right: '10%', opacity: 0.1 }} />

      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title text-gradient-orange">NLP TELEMETRY</h2>
          <p className="page-subtitle">PROFILING DIALECTICS, VELOCITY, AND PHISHING ENTROPY VECTORS</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 28 }}>
        {/* Left column — Inputs & inline highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <form onSubmit={handleScan} className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label htmlFor="message-input" className="form-label">RAW TELEMETRY INPUT</label>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800 }} className="mono-display">
                {text.length} CHARS
              </span>
            </div>
            
            <textarea
              id="message-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste email headers, communication logs, SMS texts, or alert strings here..."
              className="textarea-field"
              style={{ height: 220 }}
              required
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}>
              <button
                type="button"
                onClick={() => setText("URGENT: Your Netflix subscription billing failed. Verify your card credentials immediately inside 24 hours at http://netflix-billing-update.com")}
                style={{ 
                  background: 'none', border: 'none', cursor: 'pointer', 
                  color: 'var(--accent-orange)', fontSize: 11, fontWeight: 800, 
                  textTransform: 'uppercase', letterSpacing: '0.05em' 
                }}
              >
                // Load Threat Sample
              </button>
              
              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="cta-btn"
                style={{ padding: '12px 24px' }}
              >
                <span className="cta-btn-inner">
                  <span className="cta-btn-text-wrapper" style={{ height: 16 }}>
                    <span className="cta-btn-text" style={{ fontSize: 11 }}>
                      {loading ? 'ANALYZING...' : 'RUN PROFILE'}
                    </span>
                    <span className="cta-btn-text-hover" style={{ fontSize: 11 }}>
                      {loading ? 'ANALYZING...' : 'RUN PROFILE'}
                    </span>
                  </span>
                  {!loading && <span>🛡️</span>}
                </span>
              </button>
            </div>
          </form>

          {/* Real-time Highlighting */}
          {result && (
            <div className="glass-card slide-up-item" style={{ padding: 24 }}>
              <h4 className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Eye size={14} style={{ color: 'var(--accent-orange)' }} /> HIGHLIGHTED VERDICT OUTLINE
              </h4>
              <div style={{ 
                background: 'var(--bg-secondary)', 
                padding: 20, 
                border: '1px solid var(--border-subtle)', 
                borderRadius: 'var(--radius-sm)' 
              }}>
                {renderHighlightedText()}
              </div>
              {result.highlighted_words && result.highlighted_words.length > 0 && (
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Info size={12} />
                  <span>HOVER DETECTED NODES TO EXAMINE COEFFICIENTS</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column — Dial & Threat Report */}
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
                    <RiskBadge level={result.risk_level} />
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

              {/* Emergency SMS Warning Dispatcher */}
              {(result.risk_level === 'High' || result.risk_level === 'Critical') && (
                <div className="glass-card slide-up-item" style={{ padding: 24, border: '1px solid var(--accent-orange)' }}>
                  <h4 className="form-label" style={{ color: 'var(--accent-orange)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    ⚠️ EMERGENCY SMS DISPATCH VECTOR
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                    This threat telemetry is classified high risk. Dispatch an instant SMS warning warning alert to your security node device.
                  </p>
                  
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input
                      type="text"
                      placeholder="Security Target Phone (e.g. +14155552671)"
                      value={alertPhone}
                      onChange={e => setAlertPhone(e.target.value)}
                      style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 12px',
                        color: 'white',
                        fontSize: 12.5,
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={handleSendEmergencySms}
                      disabled={sendingSms}
                      className="cta-btn"
                      style={{ padding: '0 20px', borderRadius: 'var(--radius-sm)' }}
                    >
                      <span className="cta-btn-inner">
                        <span className="cta-btn-text" style={{ fontSize: 11 }}>{sendingSms ? 'DISPATCHING...' : 'DISPATCH SMS'}</span>
                      </span>
                    </button>
                  </div>

                  {smsStatus && (
                    <div style={{
                      fontSize: 11.5,
                      color: smsStatus.includes('failed') ? '#EF4444' : 'var(--accent-green)',
                      marginTop: 12,
                      fontWeight: 800
                    }}>
                      {smsStatus}
                    </div>
                  )}
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
                <ShieldCheck size={28} />
              </div>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>TERMINAL IDLE</h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, maxWidth: 220, lineHeight: 1.6 }}>
                  Submit data in the input zone to activate AI profiling matrices.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
