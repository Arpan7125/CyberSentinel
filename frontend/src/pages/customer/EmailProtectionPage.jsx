import React, { useState } from 'react';
import { Mail } from 'lucide-react';

// Simulated Email Data
const MOCK_EMAILS = [
  {
    id: 1,
    sender: 'PayPal Support',
    email: 'service@paypal-update-alert.com',
    subject: 'Action Required: Your account is restricted',
    snippet: 'Dear Customer, we noticed unusual activity on your account...',
    date: '10:42 AM',
    isPhishing: true,
    riskScore: 98,
    analysis: {
      spf: 'Fail',
      dkim: 'Fail',
      dmarc: 'Fail',
      domainAge: '3 days old',
      urgency: 'High',
      aiSummary: 'This email aggressively demands action and uses a typo-squatted domain attempting to impersonate PayPal. Do not click any links.'
    }
  },
  {
    id: 2,
    sender: 'Netflix',
    email: 'info@mailer.netflix.com',
    subject: 'Your monthly receipt',
    snippet: 'Thanks for choosing Netflix. Here is your receipt for the month...',
    date: 'Yesterday',
    isPhishing: false,
    riskScore: 5,
    analysis: {
      spf: 'Pass',
      dkim: 'Pass',
      dmarc: 'Pass',
      domainAge: '24 years old',
      urgency: 'Low',
      aiSummary: 'This is a standard transactional email from a verified Netflix domain. No threats detected.'
    }
  },
  {
    id: 3,
    sender: 'CEO Office',
    email: 'executive.director99@gmail.com',
    subject: 'URGENT: Wire Transfer Needed',
    snippet: 'Are you at your desk? I need you to process a vendor payment immediately...',
    date: 'Monday',
    isPhishing: true,
    riskScore: 85,
    analysis: {
      spf: 'Pass', // Gmail passes SPF for gmail.com
      dkim: 'Pass',
      dmarc: 'Pass',
      domainAge: 'N/A',
      urgency: 'Critical',
      aiSummary: 'Classic CEO Fraud / Business Email Compromise (BEC). The sender is using a free Gmail account to impersonate an executive. Do not reply or send money.'
    }
  }
];

export default function EmailProtectionPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);

  if (!isConnected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}><Mail size={64} color="var(--accent)" /></div>
        <h1 className="page-title" style={{ fontSize: 28 }}>Email Protection Center</h1>
        <p className="page-subtitle" style={{ maxWidth: 600, marginBottom: 32 }}>
          Connect your inbox to instantly analyze incoming emails for phishing, malicious attachments, spoofing, and brand impersonation using our AI heuristics engine.
        </p>

        <div style={{ display: 'flex', gap: 16, flexDirection: 'column', width: '100%', maxWidth: 300 }}>
          <button 
            className="btn-pub" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#fff', color: '#000' }}
            onClick={() => setIsConnected(true)}
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" style={{ width: 18 }} />
            Connect Google Workspace
          </button>
          
          <button 
            className="btn-pub" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#0078D4', color: 'var(--text-primary)' }}
            onClick={() => setIsConnected(true)}
          >
            <svg width="18" height="18" viewBox="0 0 21 21"><path fill="#f25022" d="M0 0h10v10H0z"/><path fill="#7fba00" d="M11 0h10v10H11z"/><path fill="#00a4ef" d="M0 11h10v10H0z"/><path fill="#ffb900" d="M11 11h10v10H11z"/></svg>
            Connect Microsoft 365
          </button>
        </div>
        
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 24 }}>
          We request read-only access. CyberSentinel never stores or sells your private messages.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 140px)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
      
      {/* Inbox List */}
      <div style={{ width: 350, background: 'var(--bg-primary)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Protected Inbox</h3>
            <span style={{ fontSize: 11, background: 'var(--accent-purple)', padding: '2px 8px', borderRadius: 10, color: 'var(--text-primary)', fontWeight: 600 }}>Active</span>
          </div>
          <input 
            type="text" 
            placeholder="Search verified emails..." 
            style={{ width: '100%', marginTop: 12, padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', outline: 'none' }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {MOCK_EMAILS.map(email => (
            <div 
              key={email.id} 
              onClick={() => setSelectedEmail(email)}
              style={{ 
                padding: 16, borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer',
                background: selectedEmail?.id === email.id ? 'rgba(175,82,222,0.1)' : 'transparent',
                borderLeft: selectedEmail?.id === email.id ? '3px solid #AF52DE' : '3px solid transparent'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: email.isPhishing ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                  {email.sender}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{email.date}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {email.subject}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {email.snippet}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email Detail / Threat Analysis Overlay */}
      <div style={{ flex: 1, background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
        {selectedEmail ? (
          <>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>{selectedEmail.subject}</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedEmail.sender}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>&lt;{selectedEmail.email}&gt;</div>
                </div>
                
                {/* AI Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 20, background: selectedEmail.isPhishing ? 'rgba(255,55,95,0.1)' : 'rgba(50,215,75,0.1)', border: `1px solid ${selectedEmail.isPhishing ? 'rgba(255,55,95,0.2)' : 'rgba(50,215,75,0.2)'}` }}>
                  <span style={{ fontSize: 16 }}>{selectedEmail.isPhishing ? '' : ''}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: selectedEmail.isPhishing ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                    {selectedEmail.isPhishing ? 'Dangerous' : 'Safe'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 32, display: 'flex', gap: 32 }}>
              
              {/* Message Body Simulation */}
              <div style={{ flex: 2, background: 'var(--bg-secondary)', padding: 24, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  {selectedEmail.snippet}
                  <br/><br/>
                  <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    [Simulated Email Body Render]
                  </div>
                </div>
              </div>

              {/* Advanced Threat Analysis Sidebar */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* AI Summary */}
                <div className="glass-card" style={{ padding: 16 }}>
                  <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>AI Threat Analysis</h4>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-primary)' }}>{selectedEmail.analysis.aiSummary}</p>
                </div>

                {/* Technical Headers */}
                <div className="glass-card" style={{ padding: 16 }}>
                  <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 12 }}>Authentication Headers</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>SPF</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: selectedEmail.analysis.spf === 'Pass' ? 'var(--accent-green)' : 'var(--accent-red)' }}>{selectedEmail.analysis.spf}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>DKIM</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: selectedEmail.analysis.dkim === 'Pass' ? 'var(--accent-green)' : 'var(--accent-red)' }}>{selectedEmail.analysis.dkim}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>DMARC</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: selectedEmail.analysis.dmarc === 'Pass' ? 'var(--accent-green)' : 'var(--accent-red)' }}>{selectedEmail.analysis.dmarc}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Domain Age</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{selectedEmail.analysis.domainAge}</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
                  <button className="btn-pub btn-pub-primary btn-pub-sm" style={{ width: '100%', background: 'var(--accent-red)' }}>Block Sender</button>
                  <button className="btn-pub btn-pub-ghost btn-pub-sm" style={{ width: '100%' }}>Report Scam to Community</button>
                  <button className="btn-pub btn-pub-secondary btn-pub-sm" style={{ width: '100%' }}>Download Forensic Report</button>
                </div>

              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Select an email to view threat analysis
          </div>
        )}
      </div>

    </div>
  );
}
