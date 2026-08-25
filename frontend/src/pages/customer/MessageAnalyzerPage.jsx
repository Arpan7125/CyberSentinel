import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, AlertTriangle, Upload, ClipboardPaste, Send } from 'lucide-react';
import InfoTooltip from '../../components/ui/InfoTooltip';
import { scanService, api } from '../../services/api';
import { MAX_SCAN_TEXT_CHARS, validateScanText } from '../../utils/validation';

const SEVERITY_COLOR = {
  critical: 'var(--accent-red)',
  high: 'var(--accent-orange)',
  medium: 'var(--accent-yellow)',
};
const severityColor = (s) => SEVERITY_COLOR[String(s).toLowerCase()] || 'var(--accent-yellow)';

/**
 * One analyzer for any suspicious message — SMS, WhatsApp, or anything pasted.
 *
 * This replaces the separate SMS and WhatsApp pages. They were near-identical:
 * both posted the same body to the same /analyze/text/ endpoint and rendered
 * the same result, differing only in wording and in which input helpers each
 * happened to have. Keeping two copies meant fixes landed on one and not the
 * other — the SMS page had length validation and accessible error wiring while
 * the WhatsApp page silently accepted any length and never labelled its field.
 *
 * The merged page keeps every input path that existed: clipboard paste (was
 * SMS-only), chat-export upload (was WhatsApp-only), and the hand-off to the
 * screenshot scanner.
 */
export default function MessageAnalyzerPage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');
  const [scannedText, setScannedText] = useState('');
  const [checkedRecs, setCheckedRecs] = useState({});
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Emergency SMS dispatch — folded in from the old standalone text scanner.
  const [alertPhone, setAlertPhone] = useState(() => localStorage.getItem('cs_twilio_to') || '');
  const [sendingSms, setSendingSms] = useState(false);
  const [smsStatus, setSmsStatus] = useState('');

  const handleSendEmergencySms = async () => {
    if (!alertPhone.trim()) {
      setSmsStatus('Enter a phone number to alert.');
      return;
    }
    setSendingSms(true);
    setSmsStatus('');
    try {
      const data = await api.post('/integrations/sms/dispatch/', {
        message: `SECURITY ALERT: CyberSentinel scored a ${result.confidence}-risk message at ${result.threatScore}%. Snippet: "${scannedText.substring(0, 80)}..."`,
        to_number: alertPhone,
      });
      localStorage.setItem('cs_twilio_to', alertPhone.trim());
      setSmsStatus(data.message || 'Alert sent.');
    } catch (err) {
      // Twilio may simply not be configured; say which it is rather than
      // implying the alert went out.
      setSmsStatus(err.message || 'Could not send the alert.');
    } finally {
      setSendingSms(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text);
        setError('');
      }
    } catch {
      // Clipboard access is routinely denied by the browser; that is expected,
      // not an error worth interrupting the user with a modal dialog.
      setError('Clipboard access was blocked. Paste the message into the box instead.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (text) {
        // A WhatsApp export can run past the scan limit, so trim to what the
        // analyzer will actually accept rather than failing after the upload.
        setInputText(String(text).slice(0, MAX_SCAN_TEXT_CHARS));
        setError('');
      }
    };
    reader.onerror = () => setError('That file could not be read. Try pasting the text instead.');
    reader.readAsText(file);
    // Allow re-selecting the same file after a failed read.
    e.target.value = '';
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();

    const lengthError = validateScanText(inputText);
    if (lengthError) {
      setError(lengthError);
      return;
    }

    setAnalyzing(true);
    setResult(null);
    setError('');
    setSmsStatus('');
    setCheckedRecs({});

    try {
      const res = await scanService.analyzeText({ text: inputText });
      // Freeze the text that produced this result, so the highlighted view
      // keeps matching the verdict even if the box is edited afterwards.
      setScannedText(inputText);
      setResult({
        threatScore: res.risk_score,
        confidence: res.risk_level,
        highlightedWords: res.highlighted_words || [],
        recommendations: res.recommendations || [],
        category: res.risk_level === 'Low'
          ? 'Clean / Safe Message'
          : res.risk_score > 75 ? 'Critical Scam Vector' : 'Suspicious Message',
        evidence: res.threat_indicators ? res.threat_indicators.map(ind => ind.description) : [],
        explanation: `Our machine learning model analyzed this message and detected a ${res.risk_level.toLowerCase()} risk of social engineering. The content scored ${res.risk_score}% on our phishing classifier.`,
        action: res.recommendations && res.recommendations.length > 0
          ? res.recommendations[0]
          : (res.risk_score > 50 ? 'Delete the message immediately. Do not click any links.' : 'No action required.'),
        tips: (res.recommendations ? res.recommendations.slice(1) : []).concat([
          'Never share one-time passcodes (OTP) or personal security pins.',
          'Always verify the identity of the sender through official channels.',
        ]),
      });
    } catch (err) {
      // The API layer already turned the status code into a message that says
      // what actually happened — a rate limit and a server outage are not the
      // same problem, and telling the user the wrong one wastes their time.
      setError(err.message || 'Failed to analyze that message.');
    } finally {
      setAnalyzing(false);
    }
  };

  const danger = result && result.threatScore > 50;

  /**
   * Show the scanned message with the flagged terms marked in place.
   *
   * Seeing *which* words drove the score, inside the original sentence, is far
   * more convincing than a detached list of indicators. Each mark carries the
   * model's own reason as its tooltip.
   */
  const renderHighlightedText = () => {
    // Terms of one or two characters are function words ("it", "or") that the
    // model gives a small weight but which explain nothing — marking them just
    // buries the terms that actually drove the score. The full set is still
    // listed under "Evidence found".
    const words = (result?.highlightedWords || []).filter(w => (w.word || '').length > 2);
    if (!words.length) {
      return <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, margin: 0 }}>{scannedText}</p>;
    }

    // Longest first, so "account number" wins over "account".
    const ordered = [...words].sort((a, b) => (b.word?.length || 0) - (a.word?.length || 0));
    let parts = [scannedText];

    ordered.forEach((item) => {
      if (!item.word) return;
      // The model returns plain terms, but escape anyway — an unescaped value
      // here would be interpreted as a regex pattern.
      const safe = item.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(${safe})`, 'gi');
      const next = [];

      parts.forEach((part, partIdx) => {
        if (typeof part !== 'string') { next.push(part); return; }
        part.split(re).forEach((chunk, idx) => {
          if (idx % 2 === 1) {
            const colour = severityColor(item.severity);
            next.push(
              <mark
                key={`${item.word}-${partIdx}-${idx}`}
                title={`${item.severity} risk — ${item.reason || 'flagged by the classifier'}`}
                style={{
                  background: `color-mix(in oklab, ${colour} 14%, transparent)`,
                  color: colour, border: `1px solid ${colour}`,
                  padding: '1px 5px', borderRadius: 4,
                  fontWeight: 700, cursor: 'help',
                }}
              >
                {chunk}
              </mark>
            );
          } else if (chunk) {
            next.push(chunk);
          }
        });
      });
      parts = next;
    });

    return <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9, margin: 0 }}>{parts}</p>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 40, maxWidth: 1000, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <div style={{ marginBottom: 16 }}><MessageSquare size={48} color="var(--accent)" /></div>
        <h1 className="page-title" style={{ fontSize: 32 }}>Message Analyzer</h1>
        <p className="page-subtitle" style={{ maxWidth: 620, margin: '0 auto' }}>
          Paste any suspicious message — SMS, WhatsApp, email text or a chat export — and the
          classifier will break down the scam vector and check the links it contains.
        </p>
      </div>

      {/* Input */}
      <div className="glass-card floating-card-subtle" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
          <button
            type="button"
            className="btn-pub btn-pub-ghost"
            style={{ flex: '1 1 180px', border: '1px dashed var(--border-subtle)', gap: 8 }}
            onClick={handlePasteClipboard}
          >
            <ClipboardPaste size={15} aria-hidden="true" /> Paste from clipboard
          </button>
          <button
            type="button"
            className="btn-pub btn-pub-ghost"
            style={{ flex: '1 1 180px', border: '1px dashed var(--border-subtle)', gap: 8 }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={15} aria-hidden="true" /> Upload chat export (.txt)
          </button>
          <button
            type="button"
            className="btn-pub btn-pub-ghost"
            style={{ flex: '1 1 180px', border: '1px dashed var(--border-subtle)' }}
            onClick={() => navigate('/dashboard/screenshot-scanner')}
          >
            Analyze a screenshot instead
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".txt,text/plain"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>

        <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label htmlFor="message-input" className="visually-hidden">Message to analyze</label>
          <textarea
            id="message-input"
            placeholder="Paste the message here… e.g. 'CHASE: Unusual login attempt. Click here to secure your account: http://bit.ly/123'"
            value={inputText}
            onChange={e => { setInputText(e.target.value); if (error) setError(''); }}
            maxLength={MAX_SCAN_TEXT_CHARS}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'message-input-error' : undefined}
            style={{
              width: '100%', minHeight: 140, padding: 16, background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)',
              outline: 'none', resize: 'vertical', fontSize: 14, fontFamily: 'var(--font-mono)',
            }}
          />

          {error && (
            <p id="message-input-error" className="field-error" role="alert">
              <AlertTriangle size={15} aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Links are parsed safely — nothing in the message is opened or followed.
            </span>
            <button type="submit" className="btn-pub btn-pub-primary" disabled={analyzing || !inputText.trim()}>
              {analyzing ? 'Scanning for threats…' : 'Analyze message'}
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {result && (
        <div
          className="glass-card floating-glow"
          style={{
            padding: 32, animation: 'fadeIn 0.5s ease',
            border: `1px solid ${danger ? 'color-mix(in oklab, var(--accent-red) 30%, transparent)' : 'color-mix(in oklab, var(--accent-green) 30%, transparent)'}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700 }}>
                {result.threatScore > 75 ? 'Critical threat' : danger ? 'Suspicious message' : 'Message appears clean'}
              </h2>
              <div style={{ fontSize: 16, color: danger ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: 600, marginTop: 8 }}>
                {result.category}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                <InfoTooltip
                  title="Threat score"
                  content="A 0–100 estimate of how likely this message is a phishing or scam attempt. It weighs urgency language, embedded URLs, and patterns learned from known scam messages."
                >
                  Threat score
                </InfoTooltip>
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: danger ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                {result.threatScore}<span style={{ fontSize: 18, color: 'var(--text-muted)' }}>/100</span>
              </div>
              <div style={{ fontSize: 12, color: danger ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                Confidence: {result.confidence}
              </div>
            </div>
          </div>

          {/* The scanned message with the flagged terms marked in place. */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 12 }}>
              <InfoTooltip
                title="Flagged terms"
                content="The words and phrases that contributed most to the score, marked inside your original message. Hover a mark to see why it was flagged."
              >
                The message, annotated
              </InfoTooltip>
            </h3>
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
              borderRadius: 8, padding: 16, fontSize: 14, color: 'var(--text-primary)',
              maxHeight: 260, overflowY: 'auto',
            }}>
              {renderHighlightedText()}
            </div>
          </div>

          <div className="analyzer-result-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 12 }}>Explanation</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)' }}>{result.explanation}</p>

              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: 24, marginBottom: 12 }}>
                <InfoTooltip
                  title="Extracted evidence"
                  content="The specific phrases, patterns or URLs in this message that contributed to the score."
                >
                  Evidence found
                </InfoTooltip>
              </h3>
              {result.evidence.length > 0 ? (
                <ul style={{ paddingLeft: 20, fontSize: 14, color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.evidence.map((ev, i) => <li key={i}>{ev}</li>)}
                </ul>
              ) : (
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>
                  No specific red-flag patterns were matched in this message.
                </p>
              )}
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 12 }}>Recommended action</h3>
              <div style={{
                padding: 12,
                background: danger ? 'color-mix(in oklab, var(--accent-red) 10%, transparent)' : 'color-mix(in oklab, var(--accent-green) 10%, transparent)',
                borderLeft: `4px solid ${danger ? 'var(--accent-red)' : 'var(--accent-green)'}`,
                color: 'var(--text-primary)', fontSize: 14, fontWeight: 600,
              }}>
                {result.action}
              </div>

              {/* Tickable checklist — folded in from the old text scanner, so a
                  user can work through the steps rather than just read them. */}
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: 24, marginBottom: 12 }}>Staying safe</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result.tips.map((tip, i) => {
                  const done = !!checkedRecs[i];
                  return (
                    <label key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => setCheckedRecs(prev => ({ ...prev, [i]: !prev[i] }))}
                        style={{ marginTop: 3, accentColor: 'var(--accent)', flexShrink: 0, cursor: 'pointer' }}
                      />
                      <span style={{
                        fontSize: 13, lineHeight: 1.5,
                        color: done ? 'var(--text-muted)' : 'var(--text-secondary)',
                        textDecoration: done ? 'line-through' : 'none',
                      }}>{tip}</span>
                    </label>
                  );
                })}
              </div>

              {/* Emergency SMS alert — only offered when the verdict warrants it. */}
              {danger && (
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>Warn someone</h3>
                  <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
                    Text a summary of this verdict to someone who may have received the same message.
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <label htmlFor="alert-phone" className="visually-hidden">Phone number to alert</label>
                    <input
                      id="alert-phone"
                      type="tel"
                      value={alertPhone}
                      onChange={e => { setAlertPhone(e.target.value); if (smsStatus) setSmsStatus(''); }}
                      placeholder="+14155552671"
                      style={{
                        flex: '1 1 160px', padding: '9px 12px', fontSize: 13,
                        background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)',
                        borderRadius: 6, color: 'var(--text-primary)', outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      className="btn-pub btn-pub-secondary btn-pub-sm"
                      onClick={handleSendEmergencySms}
                      disabled={sendingSms}
                      style={{ gap: 6 }}
                    >
                      <Send size={13} aria-hidden="true" />
                      {sendingSms ? 'Sending…' : 'Send alert'}
                    </button>
                  </div>
                  {smsStatus && (
                    <p role="status" style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 8 }}>{smsStatus}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
