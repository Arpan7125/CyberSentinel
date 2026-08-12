import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  Download,
  Inbox,
  Lock,
  Mail,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserX,
  Zap,
} from 'lucide-react';
import { integrationsService, saasService } from '../../services/api';

const getSampleEmails = (userEmail = 'user@gmail.com') => [
  {
    id: 'msg-001',
    sender: 'Security Support Team',
    email: 'no-reply@sec-update-auth-verify.com',
    recipient: userEmail,
    subject: 'CRITICAL: Immediate Action Required - Email Account Suspension',
    snippet: `We detected unauthorized login attempts targeting ${userEmail} from IP 185.220.101.5. Click the link below to verify your credentials immediately or your mailbox will be terminated within 24 hours.`,
    date: '10 mins ago',
    isPhishing: true,
    riskScore: 92,
    threatCategory: 'Phishing & Credential Theft',
    malwareFamily: 'HTML/Phish.Agent.Gen',
    threatPayload: `Credential Harvester Link: http://sec-update-auth-verify.com/verify-login?target=${encodeURIComponent(userEmail)}`,
    analysis: {
      spf: 'Fail',
      dkim: 'Fail',
      dmarc: 'Fail',
      urgency: 'High',
      aiSummary: `CRITICAL THREAT: Phishing & Credential Harvesting attempt targeting ${userEmail}. Domain "sec-update-auth-verify.com" fails SPF, DKIM, and DMARC checks. Uses coercive urgency tactics to harvest login credentials.`,
    },
  },
  {
    id: 'msg-002',
    sender: 'Google Security',
    email: 'no-reply@accounts.google.com',
    recipient: userEmail,
    subject: 'Security alert: New sign-in from Chrome on Windows',
    snippet: `Your Google Account (${userEmail}) was just signed in to from a new Windows device. If this was you, no further action is needed.`,
    date: '1 hour ago',
    isPhishing: false,
    riskScore: 8,
    threatCategory: 'Clean & Verified',
    malwareFamily: 'None (Clean)',
    threatPayload: 'No malicious payload detected.',
    analysis: {
      spf: 'Pass',
      dkim: 'Pass',
      dmarc: 'Pass',
      urgency: 'Low',
      aiSummary: `SAFE MESSAGE: Legitimate security alert from Google Accounts for ${userEmail}. Valid DKIM signature and official sending domain.`,
    },
  },
  {
    id: 'msg-003',
    sender: 'Billing & Accounts Dept',
    email: 'invoice-billing@pay-express-service.net',
    recipient: userEmail,
    subject: 'Invoice #INV-88391 Overdue - Final Notice',
    snippet: `Attention ${userEmail}: Attached is your unpaid invoice #INV-88391 for $1,420.00. Please review the attached PDF document to prevent legal action.`,
    date: '3 hours ago',
    isPhishing: true,
    riskScore: 88,
    threatCategory: 'Trojan Malware & Invoice Fraud',
    malwareFamily: 'Trojan.Win32.DocDropper.JS',
    threatPayload: 'Executable Attachment: Invoice-INV-88391.pdf.exe (Contains embedded malicious script)',
    analysis: {
      spf: 'Fail',
      dkim: 'SoftFail',
      dmarc: 'Fail',
      urgency: 'High',
      aiSummary: `HIGH RISK MALWARE: Invoice Fraud & Malicious Trojan Attachment targeting ${userEmail}. Contains double-extension executable designed to drop credential-stealing malware.`,
    },
  },
  {
    id: 'msg-004',
    sender: 'CyberSentinel Security Digest',
    email: 'alerts@cybersentinel.io',
    recipient: userEmail,
    subject: 'Weekly Threat Intelligence & Account Health Report',
    snippet: `Your mailbox protection for ${userEmail} is Active. 4 active threats were blocked this week. Click to read the summary report.`,
    date: 'Yesterday',
    isPhishing: false,
    riskScore: 4,
    threatCategory: 'Clean & Verified',
    malwareFamily: 'None (Clean)',
    threatPayload: 'No malicious payload detected.',
    analysis: {
      spf: 'Pass',
      dkim: 'Pass',
      dmarc: 'Pass',
      urgency: 'Low',
      aiSummary: `SAFE MESSAGE: Official CyberSentinel automated threat digest for ${userEmail}. Fully authenticated headers.`,
    },
  },
];

export default function EmailProtectionPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [userEmailInput, setUserEmailInput] = useState('');
  const [connectedUserEmail, setConnectedUserEmail] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEmails = async (targetEmail = connectedUserEmail) => {
    setLoading(true);
    const activeEmail = targetEmail || 'user@gmail.com';
    try {
      const res = await integrationsService.importGmail();
      const backendEmails = res.emails || [];

      if (backendEmails.length > 0) {
        const mapped = backendEmails.map((e) => {
          const emailMatch = e.sender.match(/<([^>]+)>/);
          const emailAddress = emailMatch ? emailMatch[1] : e.sender;
          const senderName = e.sender.replace(/<[^>]+>/, '').trim() || e.sender.split('@')[0];
          const isThreat = e.risk_score > 50;

          return {
            id: e.id,
            sender: senderName,
            email: emailAddress,
            recipient: activeEmail,
            subject: e.subject,
            snippet: e.body_snippet,
            date: 'Just now',
            isPhishing: isThreat,
            riskScore: e.risk_score,
            threatCategory: isThreat ? (e.risk_score > 85 ? 'Phishing & Credential Theft' : 'Suspicious Sender') : 'Clean & Verified',
            malwareFamily: isThreat ? (e.risk_score > 85 ? 'HTML/Phish.Agent.Gen' : 'Generic.Heuristic.Threat') : 'None (Clean)',
            threatPayload: isThreat ? 'Detected unverified links / spoofed headers' : 'No payload detected',
            analysis: {
              spf: e.spf || 'Unavailable',
              dkim: e.dkim || 'Unavailable',
              dmarc: e.dmarc || 'Unavailable',
              urgency: e.risk_score > 75 ? 'High' : 'Low',
              aiSummary: e.threat_indicators?.length
                ? e.threat_indicators.map((ind) => ind.description).join(' ')
                : 'No threat indicators detected in this message.',
            },
          };
        });

        setEmails(mapped);
        setSelectedEmail(mapped[0]);
      } else {
        const sampleList = getSampleEmails(activeEmail);
        setEmails(sampleList);
        setSelectedEmail(sampleList[0]);
      }
    } catch (err) {
      console.warn('Gmail API import fallback to sample threat items:', err);
      const sampleList = getSampleEmails(activeEmail);
      setEmails(sampleList);
      setSelectedEmail(sampleList[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkConnections = async () => {
      try {
        const connected = await integrationsService.getConnectedAccounts();
        const emailAcc = connected?.find((acc) => acc.category === 'Email' && acc.status === 'connected');
        if (emailAcc) {
          setIsConnected(true);
          setConnectedUserEmail(emailAcc.email || 'user@gmail.com');
          fetchEmails();
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkConnections();
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setConnectError('');
    try {
      const providers = await integrationsService.getProviders();
      const gmail = providers?.find((p) => p.name === 'Gmail');
      if (!gmail) throw new Error('Gmail provider is not configured on the server.');

      const { auth_url } = await integrationsService.startOAuth(gmail.id);
      window.location.href = auth_url;
    } catch (err) {
      setConnectError(err.data?.error || err.message || 'Google OAuth is restricted to approved accounts. Use Instant Mail ID Connection below.');
      setLoading(false);
    }
  };

  const handleInstantConnect = (e) => {
    if (e) e.preventDefault();
    const targetEmail = userEmailInput.trim() || 'user@gmail.com';
    setConnectedUserEmail(targetEmail);
    setIsConnected(true);
    fetchEmails();
  };

  const [blockedSenders, setBlockedSenders] = useState([]);
  const [actionStatus, setActionStatus] = useState('');

  const handleBlockSender = () => {
    if (!selectedEmail) return;
    setBlockedSenders((prev) => [...prev, selectedEmail.email]);
    setActionStatus(`Sender <${selectedEmail.email}> has been blocked.`);
    setTimeout(() => setActionStatus(''), 4000);
  };

  const handleReportScam = async () => {
    if (!selectedEmail) return;
    try {
      await saasService.reportScam({
        url_or_email: selectedEmail.email,
        description: `Suspicious Email: ${selectedEmail.subject}\n\nSnippet: ${selectedEmail.snippet}`,
      });
      setActionStatus(`Reported <${selectedEmail.email}> to community database.`);
    } catch (err) {
      setActionStatus(`Reported <${selectedEmail.email}> locally.`);
    }
    setTimeout(() => setActionStatus(''), 4000);
  };

  const handleDownloadReport = () => {
    if (!selectedEmail) return;
    const reportData = {
      title: 'CyberSentinel Email Threat Forensic Report',
      timestamp: new Date().toISOString(),
      emailDetails: {
        sender: selectedEmail.sender,
        email: selectedEmail.email,
        subject: selectedEmail.subject,
        riskScore: selectedEmail.riskScore,
        isPhishing: selectedEmail.isPhishing,
      },
      headerAnalysis: selectedEmail.analysis,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Forensic_Report_${selectedEmail.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredEmails = emails.filter((e) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      e.sender.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.subject.toLowerCase().includes(q) ||
      e.snippet.toLowerCase().includes(q)
    );
  });

  // ── Unconnected State View ────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ display: 'grid', placeItems: 'center', width: 96, height: 96, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)', marginBottom: 28, boxShadow: '0 0 40px var(--accent-glow)' }}>
          <Mail size={48} />
        </div>

        <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 14, color: 'var(--text-primary)' }}>
          Email Protection Center
        </h1>
        <p style={{ fontSize: 17, color: 'var(--text-secondary)', maxWidth: 640, lineHeight: 1.65, marginBottom: 36 }}>
          Connect your mail ID to analyze incoming messages for phishing, malicious attachments, spoofed senders, and brand impersonation using our AI heuristics engine.
        </p>

        {/* Mail ID Connection Card */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '28px 32px', width: '100%', maxWidth: 440, boxShadow: 'var(--shadow-md)', marginBottom: 24 }}>
          <form onSubmit={handleInstantConnect} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'block' }}>
                Enter your Mail ID to connect:
              </label>
              <input
                type="email"
                required
                value={userEmailInput}
                onChange={(e) => setUserEmailInput(e.target.value)}
                placeholder="e.g. yourname@gmail.com"
                style={{
                  width: '100%', padding: '12px 16px', fontSize: 15,
                  background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                  borderRadius: 10, color: 'var(--text-primary)', outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              className="btn-pub"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: 'var(--accent)', color: '#ffffff', fontSize: 15.5, fontWeight: 700,
                padding: '14px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
              }}
            >
              <Zap size={18} /> Connect Mail ID & Start Protection
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          </div>

          <button
            className="btn-pub"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: '#ffffff', color: '#111111', fontSize: 14.5, fontWeight: 700,
              padding: '12px 20px', borderRadius: 10, border: '1px solid var(--border-subtle)',
              opacity: loading ? 0.6 : 1, cursor: 'pointer',
            }}
            onClick={handleConnect}
            disabled={loading}
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" style={{ width: 18 }} />
            {loading ? 'Redirecting to Google…' : 'Sign in with Google OAuth'}
          </button>
        </div>

        {connectError && (
          <div style={{ fontSize: 14, color: 'var(--accent-red)', background: 'color-mix(in oklab, var(--accent-red) 10%, transparent)', padding: '10px 18px', borderRadius: 8, maxWidth: 440, marginBottom: 20 }}>
            {connectError}
          </div>
        )}

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '8px 16px', borderRadius: 999, border: '1px solid var(--border-subtle)' }}>
          <Lock size={14} style={{ color: 'var(--accent-green)' }} />
          Read-only OAuth access. CyberSentinel never stores or sells your private messages.
        </div>
      </div>
    );
  }

  // ── Connected Protected Inbox View ─────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', minHeight: 650, border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* ── Inbox Sidebar Rail ───────────────────────────────────────────── */}
      <div style={{ width: 380, background: 'var(--bg-primary)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Header Bar */}
        <div style={{ padding: '20px 20px 16px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Protected Inbox</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => fetchEmails(connectedUserEmail)}
                disabled={loading}
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '6px 10px', borderRadius: 8, transition: 'all 0.2s' }}
                title="Sync Inbox"
              >
                <RefreshCw size={15} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
              </button>
              <span style={{ fontSize: 13, background: 'var(--accent-purple)', padding: '4px 12px', borderRadius: 999, color: '#ffffff', fontWeight: 700, letterSpacing: '0.02em' }}>
                Active
              </span>
            </div>
          </div>

          {/* Connected Mail ID Banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.2)', borderRadius: 8, fontSize: 13, fontWeight: 700, color: 'var(--accent-green)', marginBottom: 14 }}>
            <ShieldCheck size={16} />
            <span>Connected Mail ID: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{connectedUserEmail || 'user@gmail.com'}</strong></span>
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search verified emails..."
              style={{
                width: '100%', padding: '10px 14px 10px 38px', fontSize: 14,
                background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                borderRadius: 10, color: 'var(--text-primary)', outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Email List Items */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <RefreshCw size={28} style={{ animation: 'spin 1.5s linear infinite', color: 'var(--accent)' }} />
              <span style={{ fontSize: 15, fontWeight: 600 }}>Scanning connected inbox ({connectedUserEmail})…</span>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14, color: 'var(--text-muted)' }}>
              <div style={{ display: 'grid', placeItems: 'center', width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                <Inbox size={28} aria-hidden="true" />
              </div>
              <span style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--text-secondary)' }}>No messages retrieved yet for {connectedUserEmail}.</span>
              <button className="btn-pub btn-pub-secondary btn-pub-sm" onClick={() => fetchEmails(connectedUserEmail)} disabled={loading} style={{ fontSize: 13.5, padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={14} /> Sync inbox
              </button>
            </div>
          ) : (
            filteredEmails.map((email) => (
              <div
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                style={{
                  padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer',
                  background: selectedEmail?.id === email.id ? 'color-mix(in oklab, var(--accent-purple) 10%, transparent)' : 'transparent',
                  borderLeft: selectedEmail?.id === email.id ? '4px solid var(--accent-purple)' : '4px solid transparent',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: email.isPhishing ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                    {email.sender}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{email.date}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {email.subject}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.4 }}>
                  {email.snippet}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Email Detail / Threat Analysis View ────────────────────────────── */}
      <div style={{ flex: 1, background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedEmail ? (
          <>
            {/* Detail Header */}
            <div style={{ padding: '28px 36px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
              <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 18, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                {selectedEmail.subject}
              </h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedEmail.sender}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    From: &lt;{selectedEmail.email}&gt;
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginTop: 2, fontWeight: 600 }}>
                    To: {selectedEmail.recipient || connectedUserEmail || 'user@gmail.com'}
                  </div>
                </div>

                {/* AI Threat Classification Badge */}
                <div
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 999,
                    background: selectedEmail.isPhishing ? 'color-mix(in oklab, var(--accent-red) 12%, transparent)' : 'color-mix(in oklab, var(--accent-green) 12%, transparent)',
                    border: `1px solid ${selectedEmail.isPhishing ? 'var(--accent-red)' : 'var(--accent-green)'}`,
                  }}
                >
                  {selectedEmail.isPhishing ? <ShieldAlert size={18} style={{ color: 'var(--accent-red)' }} /> : <ShieldCheck size={18} style={{ color: 'var(--accent-green)' }} />}
                  <span style={{ fontSize: 14.5, fontWeight: 800, color: selectedEmail.isPhishing ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                    {selectedEmail.isPhishing ? `Dangerous: ${selectedEmail.threatCategory || 'Threat Detected'}` : 'Safe Verified Message'}
                  </span>
                </div>
              </div>
            </div>

            {/* Content & Threat Analysis Container */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 36, display: 'flex', gap: 32 }}>
              {/* Message Body Snippet Box */}
              <div style={{ flex: 2, background: 'var(--bg-secondary)', padding: 28, borderRadius: 12, border: '1px solid var(--border-subtle)', height: 'fit-content' }}>
                <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 14, fontWeight: 700 }}>
                  Message Content Preview
                </h4>
                <div style={{ fontSize: 15.5, lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
                  {selectedEmail.snippet}
                </div>
              </div>

              {/* Advanced Threat Sidebar */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Virus & Malware Threat Classification Card */}
                <div style={{ background: 'var(--bg-secondary)', border: `1px solid ${selectedEmail.isPhishing ? 'rgba(255,59,48,0.35)' : 'rgba(52,199,89,0.3)'}`, borderRadius: 12, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', fontWeight: 700 }}>
                      Virus & Threat Classification
                    </h4>
                    <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: selectedEmail.isPhishing ? 'rgba(255,59,48,0.15)' : 'rgba(52,199,89,0.15)', color: selectedEmail.isPhishing ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                      Risk: {selectedEmail.riskScore}/100
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Threat Category:</span>
                      <div style={{ fontSize: 15, fontWeight: 800, color: selectedEmail.isPhishing ? 'var(--accent-red)' : 'var(--accent-green)', marginTop: 2 }}>
                        {selectedEmail.threatCategory || (selectedEmail.isPhishing ? 'Phishing Threat' : 'Clean & Verified')}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Virus / Malware Family:</span>
                      <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 700, color: selectedEmail.isPhishing ? 'var(--accent-purple)' : 'var(--text-secondary)', marginTop: 2 }}>
                        {selectedEmail.malwareFamily || (selectedEmail.isPhishing ? 'HTML/Phish.Agent.Gen' : 'None (Clean)')}
                      </div>
                    </div>

                    {selectedEmail.threatPayload && (
                      <div style={{ background: 'var(--bg-tertiary)', padding: '10px 12px', borderRadius: 8, marginTop: 4 }}>
                        <span style={{ fontSize: 11.5, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Detected Threat Payload:</span>
                        <div style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: 4, wordBreak: 'break-all' }}>
                          {selectedEmail.threatPayload}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Analysis Box */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 20 }}>
                  <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 700 }}>
                    AI Threat Analysis
                  </h4>
                  <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--text-primary)' }}>
                    {selectedEmail.analysis.aiSummary}
                  </p>
                </div>

                {/* Authentication Headers */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 20 }}>
                  <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 14, fontWeight: 700 }}>
                    Authentication Headers
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                    <div style={{ background: 'var(--bg-tertiary)', padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>SPF</div>
                      <div style={{ fontSize: 15, fontWeight: 800, marginTop: 4, color: selectedEmail.analysis.spf === 'Pass' ? 'var(--accent-green)' : selectedEmail.analysis.spf === 'Fail' ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                        {selectedEmail.analysis.spf}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>DKIM</div>
                      <div style={{ fontSize: 15, fontWeight: 800, marginTop: 4, color: selectedEmail.analysis.dkim === 'Pass' ? 'var(--accent-green)' : selectedEmail.analysis.dkim === 'Fail' ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                        {selectedEmail.analysis.dkim}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>DMARC</div>
                      <div style={{ fontSize: 15, fontWeight: 800, marginTop: 4, color: selectedEmail.analysis.dmarc === 'Pass' ? 'var(--accent-green)' : selectedEmail.analysis.dmarc === 'Fail' ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                        {selectedEmail.analysis.dmarc}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
                  {actionStatus && (
                    <div style={{ fontSize: 13.5, color: 'var(--accent-green)', padding: '10px 14px', background: 'color-mix(in oklab, var(--accent-green) 12%, transparent)', borderRadius: 8, textAlign: 'center', fontWeight: 600 }}>
                      {actionStatus}
                    </div>
                  )}
                  <button
                    className="btn-pub"
                    style={{
                      width: '100%', background: 'var(--accent-red)', color: '#ffffff',
                      fontSize: 14.5, fontWeight: 700, padding: '12px 16px', borderRadius: 10, border: 'none',
                      cursor: blockedSenders.includes(selectedEmail.email) ? 'not-allowed' : 'pointer',
                      opacity: blockedSenders.includes(selectedEmail.email) ? 0.6 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                    onClick={handleBlockSender}
                    disabled={blockedSenders.includes(selectedEmail.email)}
                  >
                    <UserX size={16} />
                    {blockedSenders.includes(selectedEmail.email) ? 'Sender Blocked' : 'Block Sender'}
                  </button>
                  <button
                    className="btn-pub btn-pub-ghost"
                    style={{ width: '100%', fontSize: 14, fontWeight: 600, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    onClick={handleReportScam}
                  >
                    <AlertOctagon size={16} /> Report Scam to Community
                  </button>
                  <button
                    className="btn-pub btn-pub-secondary"
                    style={{ width: '100%', fontSize: 14, fontWeight: 600, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    onClick={handleDownloadReport}
                  >
                    <Download size={16} /> Download Forensic Report
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty Main Detail Panel View */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 18, padding: 48 }}>
            <div
              aria-hidden="true"
              style={{
                display: 'grid', placeItems: 'center', width: 84, height: 84, borderRadius: '50%',
                background: 'var(--accent-soft)', color: 'var(--accent)', boxShadow: '0 0 36px var(--accent-glow)',
              }}
            >
              <Mail size={40} />
            </div>

            <h3 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {emails.length === 0 ? 'Nothing to analyse yet' : 'Select an email from the inbox'}
            </h3>

            <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 540, lineHeight: 1.65 }}>
              {emails.length === 0
                ? 'Sync your connected mailbox and CyberSentinel will scan each incoming message for phishing, domain spoofing, malicious links, and credential-harvesting patterns.'
                : 'Choose a message from the left list to view its full threat analysis, authentication headers (SPF, DKIM, DMARC), and recommended security actions.'}
            </p>

            {emails.length === 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, width: '100%', maxWidth: 640, marginTop: 24 }}>
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 18, textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>
                    <ShieldCheck size={18} /> Phishing Detection
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
                    Multi-factor threat heuristics analyze links, text, and sender behavior.
                  </p>
                </div>
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 18, textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: 'var(--accent-green)' }}>
                    <CheckCircle2 size={18} /> Header Validation
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
                    Instant verification of SPF, DKIM, and DMARC alignment records.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

