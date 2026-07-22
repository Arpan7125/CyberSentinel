import React, { useState } from 'react';
import { 
  Code2, 
  Terminal, 
  Play, 
  Copy, 
  CheckCircle,
  FileText,
  Link2,
  Image as ImageIcon
} from 'lucide-react';

export default function ApiSandbox() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('text'); // 'text', 'url', 'screenshot'
  const [selectedLang, setSelectedLang] = useState('curl'); // 'curl', 'js', 'python'
  const [payloadText, setPayloadText] = useState('{"text": "URGENT security lock notice http://secure-bank-login.net"}');
  const [jsonResponse, setJsonResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const endpoints = {
    text: {
      method: 'POST',
      path: '/api/analyze/text/',
      description: 'Analyze incoming email/SMS body texts for language patterns and social engineering cues using Scikit-learn NLP models.',
      defaultPayload: '{\n  "text": "URGENT: Your account has been suspended! Verify details now at http://secure-bank-login.net"\n}'
    },
    url: {
      method: 'POST',
      path: '/api/analyze/url/',
      description: 'Evaluate brand spoofing, character typosquatting homographs, suspicious TLD suffixes, and path subdomains.',
      defaultPayload: '{\n  "url": "http://paypa1-security-verification.xyz/signin"\n}'
    },
    screenshot: {
      method: 'POST',
      path: '/api/analyze/screenshot/',
      description: 'Upload a screenshot image. Parses textual segments using EasyOCR and runs threat logs pipelines.',
      defaultPayload: '[Multipart Form Data: "image" file binary]'
    }
  };

  const handleEndpointSelect = (ep) => {
    setSelectedEndpoint(ep);
    setPayloadText(endpoints[ep].defaultPayload);
    setJsonResponse(null);
  };

  const handleTriggerApi = async () => {
    setLoading(true);
    try {
      let response;
      if (selectedEndpoint === 'text') {
        const bodyObj = JSON.parse(payloadText);
        response = await fetch('http://localhost:8000/api/analyze/text/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyObj)
        });
      } else if (selectedEndpoint === 'url') {
        const bodyObj = JSON.parse(payloadText);
        response = await fetch('http://localhost:8000/api/analyze/url/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyObj)
        });
      } else {
        response = await fetch('http://localhost:8000/api/dashboard/stats/');
      }

      if (!response.ok) {
        throw new Error('API request failed');
      }
      const data = await response.json();
      setJsonResponse(data);
    } catch (err) {
      console.warn("Backend API offline. Loading simulated JSON API responses...", err);
      if (selectedEndpoint === 'text') {
        setJsonResponse({
          "risk_score": 86.5,
          "risk_level": "Critical",
          "threat_indicators": [
            { "type": "Urgency", "severity": "High", "description": "Linguistic deadline pressure detected." }
          ],
          "highlighted_words": [
            { "word": "urgent", "severity": "high", "weight": 1.5, "reason": "Scam urgency marker." }
          ],
          "recommendations": ["Do not click hyperlinks.", "Verify sender identity."]
        });
      } else if (selectedEndpoint === 'url') {
        setJsonResponse({
          "risk_score": 95.0,
          "risk_level": "Critical",
          "threat_indicators": [
            { "type": "Brand Spoofing", "severity": "Critical", "description": "Mimics PayPal services." }
          ],
          "details": { "domain": "paypa1-security-verification.xyz", "has_https": false, "brand_spoofing": true },
          "recommendations": ["Blocklist domain.", "Close browser page."]
        });
      } else {
        setJsonResponse({
          "message": "Screenshot sandbox requires file uploads. Extracted text is channeled to text scanners.",
          "simulated_extracted_content": "URGENT netflix billing failed http://netflix-billing-update.com"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getCodeSnippet = () => {
    const ep = endpoints[selectedEndpoint];
    if (selectedLang === 'curl') {
      if (selectedEndpoint === 'screenshot') {
        return `curl -X POST http://localhost:8000${ep.path} \\\n  -F "image=@/path/to/screenshot.png"`;
      }
      return `curl -X POST http://localhost:8000${ep.path} \\\n  -H "Content-Type: application/json" \\\n  -d '${payloadText.trim()}'`;
    } else if (selectedLang === 'js') {
      if (selectedEndpoint === 'screenshot') {
        return `const formData = new FormData();\nformData.append("image", fileInput.files[0]);\n\nfetch("http://localhost:8000${ep.path}", {\n  method: "POST",\n  body: formData\n})\n.then(res => res.json())\n.then(data => console.log(data));`;
      }
      return `fetch("http://localhost:8000${ep.path}", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify(${payloadText.trim()})\n})\n.then(res => res.json())\n.then(data => console.log(data));`;
    } else {
      if (selectedEndpoint === 'screenshot') {
        return `import requests\n\nurl = "http://localhost:8000${ep.path}"\nfiles = {"image": open("screenshot.png", "rb")}\n\nresponse = requests.post(url, files=files)\nprint(response.json())`;
      }
      return `import requests\nimport json\n\nurl = "http://localhost:8000${ep.path}"\npayload = ${payloadText.trim()}\nheaders = {"Content-Type": "application/json"}\n\nresponse = requests.post(url, data=json.dumps(payload), headers=headers)\nprint(response.json())`;
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container reveal-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title text-gradient-orange">DEVELOPER SANDBOX</h2>
          <p className="page-subtitle">INTEGRATE CLASSIFICATION AGENTS DIRECTLY INTO EXTERNAL SERVERS AND FIREWALLS</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 28 }}>
        {/* Left column — Docs & Code snippets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Endpoint Selector */}
          <div className="glass-card" style={{ padding: 24 }}>
            <span className="form-label" style={{ marginBottom: 16 }}>Select Target Node</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.keys(endpoints).map((ep) => (
                <button
                  key={ep}
                  onClick={() => handleEndpointSelect(ep)}
                  style={{
                    background: selectedEndpoint === ep ? 'rgba(255, 90, 31, 0.05)' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${selectedEndpoint === ep ? 'var(--accent-orange)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px 20px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={e => {
                    if (selectedEndpoint !== ep) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={e => {
                    if (selectedEndpoint !== ep) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ 
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 32, height: 32, borderRadius: '50%',
                      background: selectedEndpoint === ep ? 'var(--accent-orange-glow)' : 'rgba(255,255,255,0.04)',
                      color: selectedEndpoint === ep ? 'var(--accent-orange)' : 'var(--text-secondary)'
                    }}>
                      {ep === 'text' && <FileText size={16} />}
                      {ep === 'url' && <Link2 size={16} />}
                      {ep === 'screenshot' && <ImageIcon size={16} />}
                    </span>
                    <div>
                      <strong style={{ fontSize: 13, display: 'block', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                        {ep === 'text' ? 'Linguistic NLP classifier' : ep === 'url' ? 'URL Reputation heuristics' : 'Optical OCR extractor'}
                      </strong>
                      <span className="mono-display" style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
                        {endpoints[ep].method} // {endpoints[ep].path}
                      </span>
                    </div>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>
            
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 18, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
              {endpoints[selectedEndpoint].description}
            </div>
          </div>

          {/* Code Snippets */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <Terminal size={14} style={{ color: 'var(--accent-orange)' }} /> INTEGRATION Snips
              </span>
              
              <div style={{ 
                display: 'flex', background: 'var(--bg-secondary)', 
                border: '1px solid var(--border-subtle)', padding: 2, borderRadius: 'var(--radius-sm)'
              }}>
                {['curl', 'js', 'python'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLang(lang)}
                    style={{
                      background: selectedLang === lang ? 'rgba(255,255,255,0.04)' : 'transparent',
                      border: 'none',
                      color: selectedLang === lang ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '4px 10px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {lang === 'js' ? 'Fetch JS' : lang === 'python' ? 'Python' : 'cURL'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <pre className="mono-display" style={{ 
                background: '#07080a', border: '1px solid var(--border-subtle)', 
                padding: 18, fontSize: 12, lineHeight: 1.6, color: 'var(--accent-cyan)', 
                overflowX: 'auto', maxHeight: 180, borderRadius: 'var(--radius-sm)'
              }}>
                {getCodeSnippet()}
              </pre>
              <button
                onClick={handleCopyCode}
                style={{
                  position: 'absolute', top: 12, right: 12, background: 'var(--bg-primary)', 
                  border: '1px solid var(--border-subtle)', cursor: 'pointer',
                  padding: 6, borderRadius: '4px', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#FFFFFF'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                {copied ? <CheckCircle size={14} style={{ color: 'var(--accent-green)' }} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Right column — Sandbox trigger & Response */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Query JSON Editor */}
          <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span className="form-label">REQUEST BODY PAYLOAD</span>
            
            <textarea
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              disabled={selectedEndpoint === 'screenshot'}
              className="textarea-field"
              style={{ height: 120, fontSize: 12 }}
            />

            <button
              onClick={handleTriggerApi}
              disabled={loading}
              className="cta-btn"
              style={{ width: '100%' }}
            >
              <span className="cta-btn-inner">
                <span className="cta-btn-text-wrapper" style={{ height: 16 }}>
                  <span className="cta-btn-text" style={{ fontSize: 11 }}>
                    {loading ? 'DISPATCHING...' : 'EXECUTE CALL'}
                  </span>
                  <span className="cta-btn-text-hover" style={{ fontSize: 11 }}>
                    {loading ? 'DISPATCHING...' : 'EXECUTE CALL'}
                  </span>
                </span>
                {!loading && <Play size={12} />}
              </span>
            </button>
          </div>

          {/* JSON Response Panel */}
          <div className="glass-card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
            <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Code2 size={14} style={{ color: 'var(--accent-orange)' }} /> TELEMETRY OUTPUT STREAM
            </span>

            {jsonResponse ? (
              <pre className="mono-display" style={{ 
                background: '#07080a', border: '1px solid var(--border-subtle)', 
                padding: 16, fontSize: 11.5, lineHeight: 1.6, color: 'var(--accent-green)', 
                overflowY: 'auto', flex: 1, borderRadius: 'var(--radius-sm)'
              }}>
                {JSON.stringify(jsonResponse, null, 2)}
              </pre>
            ) : (
              <div style={{ 
                border: '1px dashed var(--border-card)', 
                background: 'rgba(255, 255, 255, 0.005)', 
                borderRadius: 'var(--radius-sm)', 
                flex: 1, display: 'flex', flexDirection: 'column', 
                alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20 
              }}>
                <Terminal size={24} style={{ color: 'var(--text-muted)', marginBottom: 8, animation: 'pulseGlow 2s infinite' }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)' }}>CONSOLE READY</span>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', mt: 6, maxWidth: 180, lineHeight: 1.5 }}>
                  Launch queries to review structural returns inside this stream console.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRightIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: 14, height: 14 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
    </svg>
  );
}
