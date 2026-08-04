import React from 'react';
import { BookOpen, Mail, MessageSquare, HelpCircle } from 'lucide-react';

export default function GuidelinesPage() {
  return (
    <div style={{
      padding: '40px',
      height: '100%',
      overflowY: 'auto',
      color: 'var(--text-primary)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: 40, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 24 }}>
        <h1 className="section-title text-gradient-orange" style={{ fontSize: 32, marginBottom: 8 }}>
          OPERATIONAL PROTOCOLS
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Security Node Guidance & Integration Instructions
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
        
        {/* Left Column — Detailed Guide */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* Section 1: Features Guidance */}
          <div className="glass-card" style={{ padding: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <BookOpen size={20} style={{ color: 'var(--accent-orange)' }} />
              SYSTEM CORE FUNCTIONALITY
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-accent)', marginBottom: 6 }}>📝 TEXT SCANNER</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Paste email content, SMS messages, or chat transcripts into the input field. The AI natural language processor analyzes indicators like <strong>Urgency Tactics</strong>, <strong>Authority Impersonation</strong>, and <strong>Credential Harvesting requests</strong> to compute a threat risk coefficient from 0-100%.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-accent)', marginBottom: 6 }}>🔗 URL LINK SCANNER</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Inspect suspicious URLs for security flags. Checks the domain age, searches for lookalike letters (Unicode homoglyphs), verifies top-level domain risk (e.g. <code>.xyz</code>, <code>.tk</code>), and extracts brand names to detect phishing pages mimicking PayPal, Netflix, or standard banking services.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-accent)', marginBottom: 6 }}>📸 SCREENSHOT OCR SCAN</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Upload screenshots of doubtful login windows, email bodies, or text messages. The built-in Optical Character Recognition (OCR) system reads text elements straight from the image pixel coordinates and automatically pipes them through the AI threat scoring analyzer.
                </p>
              </div>
              
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-accent)', marginBottom: 6 }}>🧠 AWARENESS QUIZ</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Enter the educational portal to practice identifying realistic phishing scripts. Each challenge presents a scenario, sender address, and body. Mark whether the instance is a scam or safe, and inspect highlighted threat coordinates with structural explanations.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Gmail API Credentials Setup */}
          <div className="glass-card" style={{ padding: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mail size={20} style={{ color: 'var(--accent-orange)' }} />
              GMAIL IMPORT INTEGRATION SETUP
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
              CyberSentinel integrates directly with the Gmail API to import and scan your inbox. To connect your live email feed:
            </p>
            
            <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <li>
                Visit the <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-orange)', fontWeight: 700 }}>Google Cloud Console</a> and create a new project named <strong>CyberSentinel</strong>.
              </li>
              <li>
                Navigate to the <strong>API Library</strong> page, search for the <strong>Gmail API</strong>, and click <strong>Enable</strong>.
              </li>
              <li>
                Go to the <strong>OAuth Consent Screen</strong> configuration. Select <strong>External</strong> access, set up the app details, and add your email to the <strong>Test Users</strong> list (since the app is in developer mode).
              </li>
              <li>
                Open the <strong>Credentials</strong> tab. Click <strong>Create Credentials</strong> and select <strong>OAuth Client ID</strong>. Set the Application Type to <strong>Web Application</strong>.
              </li>
              <li>
                Add <code>http://localhost:5173</code> to the <strong>Authorized JavaScript Origins</strong> and <strong>Authorized Redirect URIs</strong> fields.
              </li>
              <li>
                Click <strong>Create</strong> to retrieve your <strong>Client ID</strong> and <strong>Client Secret</strong>.
              </li>
              <li>
                Enter your credentials in the <strong>Settings</strong> tab of this terminal, click the Google login prompt, and authenticate to sync your recent inbox.
              </li>
            </ol>
            
            <div style={{
              marginTop: 20,
              padding: 14,
              background: 'rgba(255, 90, 31, 0.03)',
              border: '1px dashed var(--accent-orange-glow)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12.5,
              color: 'var(--text-secondary)'
            }}>
              💡 <strong>Note:</strong> Gmail import requires a real connection — without configured Google OAuth credentials and a connected account, the <strong>Sync Gmail Messages</strong> button will show an honest "not connected" error rather than any placeholder data.
            </div>
          </div>

          {/* Section 3: SMS Dispatch Setup */}
          <div className="glass-card" style={{ padding: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <MessageSquare size={20} style={{ color: 'var(--accent-orange)' }} />
              TWILIO SMS INTEGRATION SETUP
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
              Receive instant SMS threat alerts on your mobile phone. CyberSentinel communicates with the Twilio SMS Gateway to dispatch threat dispatches.
            </p>

            <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <li>
                Create an account at <a href="https://www.twilio.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-orange)', fontWeight: 700 }}>Twilio</a>.
              </li>
              <li>
                Acquire a virtual <strong>Twilio Phone Number</strong> from the Twilio dashboard.
              </li>
              <li>
                Copy the <strong>Account SID</strong> and <strong>Auth Token</strong> credentials from your Twilio console homepage.
              </li>
              <li>
                Open the <strong>Settings</strong> tab in this app and paste the Twilio credentials, target mobile number, and virtual phone number.
              </li>
              <li>
                Click save. Critical scans will now automatically push alert summaries to your phone!
              </li>
            </ol>
            
            <div style={{
              marginTop: 20,
              padding: 14,
              background: 'rgba(255, 90, 31, 0.03)',
              border: '1px dashed var(--accent-orange-glow)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12.5,
              color: 'var(--text-secondary)'
            }}>
              💡 <strong>Prototype Notice:</strong> If Twilio settings are left blank, SMS notifications will be outputted to the Django backend shell terminal in simulated developer mock mode.
            </div>
          </div>

        </div>

        {/* Right Column — Quick Reference Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Quick Stats Card */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
              🚩 THREAT RED FLAGS
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>1. High Urgency</strong>
                <div style={{ marginTop: 4, lineHeight: 1.5 }}>Demands immediate action with account termination threats.</div>
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>2. Character Spoofing</strong>
                <div style={{ marginTop: 4, lineHeight: 1.5 }}>Using lookalike letters (homoglyphs) like <code>paypa1</code> instead of <code>paypal</code>.</div>
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>3. Sender Mismatch</strong>
                <div style={{ marginTop: 4, lineHeight: 1.5 }}>Email claiming to be from Amazon but sent from <code>alert-ops@web-verification.info</code>.</div>
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>4. Attachment Danger</strong>
                <div style={{ marginTop: 4, lineHeight: 1.5 }}>Unusual files (<code>.exe</code>, <code>.html</code>, <code>.zip</code>) claiming to be receipts.</div>
              </div>
            </div>
          </div>

          {/* Quick FAQ */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <HelpCircle size={15} style={{ color: 'var(--accent-orange)' }} /> FAQ
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <div>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>Is my data secure?</strong>
                All network requests are encrypted and authenticated via Token authorization. Saved scan records are restricted strictly to your account profile.
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>Are the AI models local?</strong>
                Yes, the NLP heuristic engines run directly inside the Python backend, ensuring rapid responses without external privacy leaks.
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
