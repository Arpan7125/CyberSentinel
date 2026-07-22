import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileImage, 
  CheckSquare, 
  FileText
} from 'lucide-react';

export default function ScreenshotScanner({ onScanComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [checkedRecs, setCheckedRecs] = useState({});
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setResult(null);
    }
  };

  const loadPreset = (presetName) => {
    setResult(null);
    let mockFile = new File(["mock"], `${presetName}_screenshot.png`, { type: "image/png" });
    setSelectedFile(mockFile);
    
    let mockBase64 = '';
    if (presetName === 'netflix') {
      mockBase64 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='150' viewBox='0 0 300 150'><rect width='300' height='150' fill='%230a0b10'/><text x='20' y='45' fill='%23e50914' font-family='sans-serif' font-weight='bold' font-size='20'>NETFLIX</text><text x='20' y='80' fill='%238e929a' font-family='sans-serif' font-size='11' font-weight='bold'>Billing decline alert. Pay immediately at:</text><text x='20' y='105' fill='%23FF5A1F' font-family='sans-serif' font-size='11' font-weight='bold'>http://netflix-billing-update.com</text></svg>";
    } else if (presetName === 'paypal') {
      mockBase64 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='150' viewBox='0 0 300 150'><rect width='300' height='150' fill='%230a0b10'/><text x='20' y='45' fill='%23003087' font-family='sans-serif' font-weight='bold' font-size='20'>PayPal</text><text x='20' y='80' fill='%238e929a' font-family='sans-serif' font-size='11' font-weight='bold'>Unauthorized charges. Cancel invoice at:</text><text x='20' y='105' fill='%23FF5A1F' font-family='sans-serif' font-size='11' font-weight='bold'>http://paypal-billing-cancel.com</text></svg>";
    } else if (presetName === 'chase') {
      mockBase64 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='150' viewBox='0 0 300 150'><rect width='300' height='150' fill='%230a0b10'/><text x='20' y='45' fill='%231172ec' font-family='sans-serif' font-weight='bold' font-size='20'>CHASE BANK</text><text x='20' y='80' fill='%238e929a' font-family='sans-serif' font-size='11' font-weight='bold'>Account locked. Verify credentials now:</text><text x='20' y='105' fill='%23FF5A1F' font-family='sans-serif' font-size='11' font-weight='bold'>http://secure-chase-login.xyz</text></svg>";
    } else {
      mockBase64 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='150' viewBox='0 0 300 150'><rect width='300' height='150' fill='%230a0b10'/><text x='20' y='55' fill='%238e929a' font-family='sans-serif' font-size='12' font-weight='bold'>Hey Joshua, are we still meeting for lunch today?</text><text x='20' y='85' fill='%234f535c' font-family='sans-serif' font-size='11' font-weight='bold'>Let me know if that works. - Arpan</text></svg>";
    }
    
    setImagePreview(mockBase64);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    
    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await fetch('http://localhost:8000/api/analyze/screenshot/', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze screenshot');
      }

      const data = await response.json();
      setResult(data);
      setCheckedRecs({});
      if (onScanComplete) onScanComplete(); // trigger dashboard refresh
    } catch (err) {
      console.warn("Backend unavailable or failed. Loading offline screenshot analyzer simulation...", err);
      let mockText = "";
      let mockResult;
      const filename = selectedFile.name.toLowerCase();

      if (filename.includes("netflix")) {
        mockText = "Netflix Billing Alert\nYour subscription payment failed. Update your card immediately to avoid service interruption. Click here: http://netflix-billing-update.com\nThank you,\nNetflix Support";
        mockResult = {
          "extracted_text": mockText,
          "ocr_engine": "Simulated OCR Engine (Offline)",
          "risk_score": 88.0,
          "risk_level": "Critical",
          "threat_indicators": [
            { "type": "Urgency", "severity": "High", "description": "Urgent language or false deadlines designed to induce panic and force fast action." },
            { "type": "Brand Spoofing", "severity": "Critical", "description": "The domain netflix-billing-update.com contains the brand Netflix but is spoofed." }
          ],
          "highlighted_words": [
            { "word": "failed", "severity": "medium", "weight": 0.5, "reason": "Linguistic risk trigger." },
            { "word": "immediately", "severity": "high", "weight": 1.2, "reason": "Creates a sense of false urgency." }
          ],
          "recommendations": [
            "Do not click on any links in this message.",
            "Verify the sender's identity through another channel.",
            "Do not share passwords, pins, or personal data."
          ]
        };
      } else if (filename.includes("paypal")) {
        mockText = "PayPal Security Department\nWe detected unauthorized transactions. Invoice #5819 for $782.90. Dispute it: http://paypal-billing-cancel.com\nLog in now.";
        mockResult = {
          "extracted_text": mockText,
          "ocr_engine": "Simulated OCR Engine (Offline)",
          "risk_score": 95.0,
          "risk_level": "Critical",
          "threat_indicators": [
            { "type": "Brand Spoofing", "severity": "Critical", "description": "The domain paypal-billing-cancel.com contains the brand PayPal but is spoofed." },
            { "type": "Financial Bait", "severity": "Medium", "description": "Mentions of lottery wins, gift cards, invoices, refunds, or crypto investments." }
          ],
          "highlighted_words": [
            { "word": "unauthorized", "severity": "high", "weight": 1.2, "reason": "Common phishing sentiment hook." },
            { "word": "dispute", "severity": "medium", "weight": 0.8, "reason": "Billing alert trigger phrase." }
          ],
          "recommendations": [
            "Do not click on any links in this message.",
            "Close the page immediately if it is already open."
          ]
        };
      } else if (filename.includes("chase") || filename.includes("bank")) {
        mockText = "CHASE BANK ALERT\nA suspicious login was attempted. Your access has been locked. Verify identity at: http://secure-chase-login.xyz\nDo not ignore.";
        mockResult = {
          "extracted_text": mockText,
          "ocr_engine": "Simulated OCR Engine (Offline)",
          "risk_score": 96.5,
          "risk_level": "Critical",
          "threat_indicators": [
            { "type": "Credential Harvesting", "severity": "Critical", "description": "Direct requests to confirm identities, reset passwords, or enter login credentials." },
            { "type": "Suspicious Destination Domain", "severity": "Critical", "description": "The domain secure-chase-login.xyz contains lookalike characteristics." }
          ],
          "highlighted_words": [
            { "word": "locked", "severity": "critical", "weight": 2.0, "reason": "High phishing association. Prompts sensitive account locks." },
            { "word": "verify", "severity": "critical", "weight": 1.8, "reason": "Credential harvesting trigger phrase." }
          ],
          "recommendations": [
            "Do not share passwords, pins, or personal data.",
            "Report this message to your security team."
          ]
        };
      } else {
        mockText = "Hey Joshua, are we still meeting for lunch today? Let know if that works. - Arpan";
        mockResult = {
          "extracted_text": mockText,
          "ocr_engine": "Simulated OCR Engine (Offline)",
          "risk_score": 2.5,
          "risk_level": "Low",
          "threat_indicators": [],
          "highlighted_words": [],
          "recommendations": [
            "This message appears to be safe.",
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

  const renderHighlightedText = () => {
    if (!result || !result.highlighted_words || result.highlighted_words.length === 0) {
      return <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{result.extracted_text}</p>;
    }

    const highlights = [...result.highlighted_words].sort((a, b) => b.word.length - a.word.length);
    let parts = [result.extracted_text];
    
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
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-52 scale-0 group-hover:scale-100 transition-all duration-200 bg-[#0c0d12] border border-white/10 p-3 rounded text-[11px] font-normal text-slate-355 leading-normal z-30 shadow-2xl pointer-events-none">
                  <strong className="text-white block capitalize font-bold mb-1">{item.severity} Risk: {item.word}</strong>
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
      <div className="glow-orb glow-orange" style={{ bottom: '10%', right: '10%', opacity: 0.1 }} />

      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title text-gradient-orange">OPTICAL OCR TERMINAL</h2>
          <p className="page-subtitle">EXTRACTING RAW CHARACTERS FROM SUSPICIOUS COMMUNICATIONS AND MAPPED SCREEN GRABS</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 28 }}>
        {/* Left column — Upload Zone & OCR Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <form onSubmit={handleUpload} className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <span className="form-label">UPLOAD VECTOR IMAGE FILE</span>
            
            <div 
              onClick={() => fileInputRef.current.click()}
              style={{
                border: '1px dashed var(--border-card)',
                borderRadius: 'var(--radius-sm)',
                padding: '40px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--bg-secondary)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent-orange)';
                e.currentTarget.style.background = 'rgba(255, 90, 31, 0.02)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-card)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
              }}
            >
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <UploadCloud size={36} style={{ color: 'var(--text-muted)', marginBottom: 12, marginInline: 'auto' }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Drag & drop image file, or click to browse</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Supports PNG, JPG, JPEG, WEBP up to 5MB</p>
            </div>

            {/* Presets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800 }}>DEMO SCENARIOS:</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { name: 'netflix', label: 'Netflix Phish' },
                  { name: 'paypal', label: 'PayPal Phish' },
                  { name: 'chase', label: 'Chase Phish' },
                  { name: 'slack', label: 'Safe Slack' }
                ].map(p => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => loadPreset(p.name)}
                    style={{ 
                      background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', 
                      cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 800,
                      padding: '8px 4px', borderRadius: 'var(--radius-sm)', textTransform: 'uppercase'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-orange)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview image */}
            {imagePreview && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                    <img src={imagePreview} alt="Preview" style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'block', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedFile?.name}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--accent-green)', fontWeight: 700 }}>IMAGE QUEUED</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="cta-btn"
                  style={{ padding: '10px 20px' }}
                >
                  <span className="cta-btn-inner">
                    <span className="cta-btn-text-wrapper" style={{ height: 16 }}>
                      <span className="cta-btn-text" style={{ fontSize: 11 }}>
                        {loading ? 'READING...' : 'RUN OCR DETECTION'}
                      </span>
                      <span className="cta-btn-text-hover" style={{ fontSize: 11 }}>
                        {loading ? 'READING...' : 'RUN OCR DETECTION'}
                      </span>
                    </span>
                  </span>
                </button>
              </div>
            )}
          </form>

          {/* OCR Extracted Text Result */}
          {result && (
            <div className="glass-card slide-up-item" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12, marginBottom: 16 }}>
                <h4 className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <FileText size={14} style={{ color: 'var(--accent-orange)' }} /> EXTRACTED TEXT CHARACTERISTICS
                </h4>
                <span className="mono-display" style={{ fontSize: 9, fontWeight: 950, color: 'var(--accent-green)' }}>
                  {result.ocr_engine?.toUpperCase()}
                </span>
              </div>
              <div style={{ 
                background: 'var(--bg-secondary)', 
                padding: 20, 
                border: '1px solid var(--border-subtle)', 
                borderRadius: 'var(--radius-sm)' 
              }}>
                {renderHighlightedText()}
              </div>
            </div>
          )}
        </div>

        {/* Right column — Dial & Verdict */}
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
                <FileImage size={28} />
              </div>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>TERMINAL IDLE</h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, maxWidth: 220, lineHeight: 1.6 }}>
                  Upload image assets to analyze credentials under optical scan lenses.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
