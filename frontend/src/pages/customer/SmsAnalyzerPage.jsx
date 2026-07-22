import React, { useState } from 'react';
import { MessageSquare, ShieldAlert, AlertTriangle, CheckCircle, Smartphone, Database, Zap, Mail } from 'lucide-react';
import InfoTooltip from '../../components/ui/InfoTooltip';

export default function SmsAnalyzerPage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [inputText, setInputText] = useState('');

  const handleAnalyze = (e) => {
    e.preventDefault();
    if (!inputText) return;
    setAnalyzing(true);
    setResult(null);

    // Simulate AI Analysis
    setTimeout(() => {
      setAnalyzing(false);
      setResult({
        threatScore: 95,
        confidence: 'Critical',
        category: 'Bank Impersonation / Smishing',
        evidence: [
          'Message claims an unauthorized transaction occurred.',
          'Includes a suspicious shortened URL (bit.ly or similar).',
          'Urgent call to action requesting immediate verification.'
        ],
        explanation: 'This is a classic "Smishing" (SMS Phishing) attempt. Scammers impersonate your bank to create panic. The link leads to a fake login page designed to steal your online banking credentials.',
        action: 'Delete the text immediately. Do not click the link. If concerned, log into your bank app directly.',
        tips: [
          'Banks never send links in SMS asking you to verify your identity or cancel a transaction.',
          'Always navigate to your bank\'s website manually rather than clicking text links.'
        ]
      });
    }, 1800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 40, maxWidth: 1000, margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}><Mail size={48} color="var(--accent)" /></div>
        <h1 className="page-title" style={{ fontSize: 32 }}>SMS Threat Analyzer</h1>
        <p className="page-subtitle" style={{ maxWidth: 600, margin: '0 auto' }}>
          Paste suspicious text messages (OTP scams, bank alerts, delivery notifications) here. Our AI will break down the exact scam vector and verify the links.
        </p>
      </div>

      {/* Input Area */}
      <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
          <button className="btn-pub btn-pub-ghost" style={{ flex: 1, border: '1px dashed var(--border-subtle)' }}>
             Upload Screenshot
          </button>
          <button className="btn-pub btn-pub-ghost" style={{ flex: 1, border: '1px dashed var(--border-subtle)' }}>
             Paste from Clipboard
          </button>
        </div>

        <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <textarea 
            placeholder="Paste the SMS text here... (e.g. 'CHASE: Unusual login attempt. Click here to secure account: http://bit.ly/123')"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            style={{ 
              width: '100%', minHeight: 120, padding: 16, background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', 
              outline: 'none', resize: 'vertical', fontSize: 14, fontFamily: 'var(--font-mono)' 
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}> We parse links safely in an isolated sandbox.</span>
            <button type="submit" className="btn-pub btn-pub-primary" disabled={analyzing || !inputText}>
              {analyzing ? 'Scanning for Threats...' : 'Analyze SMS'}
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {result && (
        <div className="glass-card" style={{ padding: 32, animation: 'fadeIn 0.5s ease', border: '1px solid rgba(255,55,95,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}></span> Critical Threat
              </h2>
              <div style={{ fontSize: 16, color: 'var(--accent-red)', fontWeight: 600, marginTop: 8 }}>{result.category}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                <InfoTooltip 
                  title="SMS Threat Score"
                  content="This score (0-100) represents the probability of SMS phishing (smishing). It evaluates urgency markers, embedded URLs, and known malicious patterns."
                >
                  Threat Score
                </InfoTooltip>
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent-red)' }}>{result.threatScore}<span style={{ fontSize: 18, color: 'var(--text-muted)' }}>/100</span></div>
              <div style={{ fontSize: 12, color: 'var(--accent-red)' }}>Confidence: {result.confidence}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 12 }}>AI Explanation</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)' }}>{result.explanation}</p>
              
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: 24, marginBottom: 12 }}>
                <InfoTooltip 
                  title="Extracted Evidence"
                  content="Specific linguistic anomalies or malicious URLs found in the text message."
                >
                  Evidence Found
                </InfoTooltip>
              </h3>
              <ul style={{ paddingLeft: 20, fontSize: 14, color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.evidence.map((ev, i) => (
                  <li key={i}>{ev}</li>
                ))}
              </ul>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 12 }}>Recommended Action</h3>
              <div style={{ padding: 12, background: 'rgba(255,55,95,0.1)', borderLeft: '4px solid var(--accent-red)', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }}>
                {result.action}
              </div>

              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: 24, marginBottom: 12 }}>Educational Tips</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {result.tips.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 16 }}></span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
