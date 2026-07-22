import React, { useState, useEffect } from 'react';
import { Shield, Mail, Smartphone, Globe, X, ArrowRight } from 'lucide-react';

export default function WelcomeGuide({ onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay for entrance animation
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onDismiss, 300); // Wait for exit animation
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease', padding: 24
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: 24,
        maxWidth: 600,
        width: '100%',
        boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
        transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
        transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        overflow: 'hidden'
      }}>
        {/* Header Graphic */}
        <div style={{ background: 'var(--bg-secondary)', padding: 32, textAlign: 'center', position: 'relative' }}>
          <button onClick={handleClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 8, borderRadius: '50%' }} className="hover-bg">
            <X size={20} />
          </button>
          <div style={{ background: 'rgba(59,130,246,0.1)', width: 64, height: 64, borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Shield size={32} color="var(--accent)" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Welcome to CyberSentinel</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 15 }}>Your personal command center for digital security.</p>
        </div>

        {/* Content */}
        <div style={{ padding: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ color: 'var(--accent-purple)' }}><Mail size={24} /></div>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px 0' }}>Analyze Threats Instantly</h4>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>Use the scanners to check suspicious emails, URLs, files, and screenshots using our AI vision models.</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ color: 'var(--accent-teal)' }}><Smartphone size={24} /></div>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px 0' }}>Investigate Scammers</h4>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>Look up unknown phone numbers or analyze WhatsApp/SMS messages to identify common fraud patterns.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ color: 'var(--accent-orange)' }}><Globe size={24} /></div>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px 0' }}>Community Driven</h4>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>Report new scams you encounter to protect the global community and view recent scam intel.</p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleClose} 
              className="btn-pub btn-pub-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              Get Started <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
