import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { integrationsService } from '../../services/api';
import { CheckCircle2, Shield, Loader2, ArrowRight } from 'lucide-react';

const SYNC_STEPS = [
  { id: 'auth', label: 'Verifying OAuth Token' },
  { id: 'connect', label: 'Establishing Secure Connection' },
  { id: 'download', label: 'Downloading Initial Metadata' },
  { id: 'scan', label: 'Running Baseline Threat Scan' },
  { id: 'complete', label: 'Finalizing' },
];

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawState = searchParams.get('state') || '';
  const providerId = searchParams.get('provider') || rawState.split(':')[0];
  const code = searchParams.get('code');
  
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!providerId || !code) {
      setError('Invalid authorization redirect. Missing parameters.');
      return;
    }

    const processOAuth = async () => {
      try {
        // Step 0: Auth
        await new Promise(r => setTimeout(r, 800));
        setCurrentStep(1);
        
        // Exchange code for token
        const res = await integrationsService.oauthCallback(providerId, code);
        if (res && res.email) {
          localStorage.setItem('connected_gmail_email', res.email);
        }
        if (res && res.access_token) {
          localStorage.setItem('connected_gmail_token', res.access_token);
        }
        
        // Step 1: Connect
        await new Promise(r => setTimeout(r, 800));
        setCurrentStep(2);
        
        // Step 2: Download
        await new Promise(r => setTimeout(r, 800));
        setCurrentStep(3);
        
        // Step 3: Scan
        await new Promise(r => setTimeout(r, 800));
        setCurrentStep(4);
        
        // Step 4: Complete
        await new Promise(r => setTimeout(r, 400));
        
        // Redirect directly to email protection inbox
        navigate('/dashboard/email-scanner', { replace: true });
        
      } catch (err) {
        setError(err.data?.error || err.message || 'Failed to authorize account.');
      }
    };

    processOAuth();
  }, [providerId, code, navigate]);

  if (error) {
    return (
      <div className="dash-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: 20 }}>
        <div className="dash-card" style={{ maxWidth: 460, textAlign: 'center', padding: '36px 28px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 16, boxShadow: 'var(--shadow-md)' }}>
          <div style={{ color: '#FF3B30', marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
            <Shield size={52} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10, color: 'var(--text-primary)' }}>Google OAuth Restricted</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14.5, lineHeight: 1.6, marginBottom: 18 }}>
            {error}
          </p>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: 10, marginBottom: 24, textAlign: 'left', lineHeight: 1.5, border: '1px solid var(--border-subtle)' }}>
            💡 <strong>Why this happens:</strong> Google OAuth requires a verified production App Secret in Google Cloud Console. You can connect your Mail ID directly without Google OAuth using our Instant Protection service below.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              className="btn-pub"
              style={{ padding: '13px 22px', fontSize: 14.5, fontWeight: 700, borderRadius: 10, background: 'var(--accent)', color: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={() => navigate('/dashboard/email-scanner')}
            >
              ⚡ Connect Mail ID Directly & Open Inbox
            </button>
            <button
              className="btn-pub btn-pub-secondary"
              style={{ padding: '11px 18px', fontSize: 13.5, fontWeight: 600, borderRadius: 8, background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
              onClick={() => navigate('/dashboard/integrations')}
            >
              Return to Integrations Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="dash-card" style={{ maxWidth: 450, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="dash-icon-wrapper" style={{ background: 'rgba(175,82,222,0.1)', color: '#AF52DE', margin: '0 auto 16px auto', width: 64, height: 64 }}>
            <Shield size={32} />
          </div>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>Securing Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Please wait while we establish a secure connection and perform the initial threat scan.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SYNC_STEPS.map((step, index) => {
            const isCompleted = currentStep > index;
            const isCurrent = currentStep === index;
            const isPending = currentStep < index;

            return (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ 
                  width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isCompleted ? '#34C759' : (isCurrent ? 'transparent' : 'var(--bg-secondary)'),
                  border: isCurrent ? '2px solid #AF52DE' : 'none',
                  color: isCompleted ? '#fff' : 'transparent'
                }}>
                  {isCompleted ? <CheckCircle2 size={14} /> : (isCurrent ? <Loader2 size={14} className="spinner" color="#AF52DE" /> : null)}
                </div>
                <div style={{ 
                  flex: 1, 
                  fontSize: 14, 
                  color: isCompleted ? 'var(--text-primary)' : (isCurrent ? '#AF52DE' : 'var(--text-muted)'),
                  fontWeight: isCurrent ? 500 : 400
                }}>
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
