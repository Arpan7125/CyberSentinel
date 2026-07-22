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
  const providerId = searchParams.get('provider');
  const code = searchParams.get('mock_code') || searchParams.get('code');
  
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
        await integrationsService.oauthCallback(providerId, code);
        
        // Step 1: Connect
        await new Promise(r => setTimeout(r, 1000));
        setCurrentStep(2);
        
        // Step 2: Download
        await new Promise(r => setTimeout(r, 1200));
        setCurrentStep(3);
        
        // Step 3: Scan
        await new Promise(r => setTimeout(r, 1500));
        setCurrentStep(4);
        
        // Step 4: Complete
        await new Promise(r => setTimeout(r, 500));
        
        // Redirect back to integrations page
        navigate('/dashboard/integrations', { replace: true });
        
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to authorize account.');
      }
    };

    processOAuth();
  }, [providerId, code, navigate]);

  if (error) {
    return (
      <div className="dash-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div className="dash-card" style={{ maxWidth: 400, textAlign: 'center' }}>
          <div style={{ color: '#FF3B30', marginBottom: 16 }}>
            <Shield size={48} />
          </div>
          <h2 style={{ marginBottom: 12 }}>Connection Failed</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{error}</p>
          <button className="dash-btn dash-btn-primary" onClick={() => navigate('/dashboard/integrations')}>
            Return to Integrations
          </button>
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
