import React, { useState } from 'react';
import { X, ChevronRight, Shield, Search, ScrollText, Users } from 'lucide-react';

const STEPS = [
  {
    title: 'Welcome to CyberSentinel SOC',
    desc: 'Your command center for enterprise security. Let\'s take a quick tour of your new administrative powers.',
    icon: <Shield size={48} color="var(--accent)" />
  },
  {
    title: 'Unified Operations',
    desc: 'Manage your organization\'s users, review subscription billing, and monitor system health from the Core Operations panel on the left.',
    icon: <Users size={48} color="var(--accent-green)" />
  },
  {
    title: 'Universal AI Search',
    desc: 'Press Ctrl+K anywhere to bring up the AI Copilot. You can search across all users, tickets, and audit logs instantly using natural language.',
    icon: <Search size={48} color="var(--accent-purple)" />
  },
  {
    title: 'Total Transparency',
    desc: 'Every action taken by users or admins is immutably recorded in the Global Audit Logs. You have full visibility into the security posture.',
    icon: <ScrollText size={48} color="var(--accent-yellow)" />
  }
];

export default function AdminWelcomeGuide({ onClose }) {
  const [step, setStep] = useState(0);

  const nextStep = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 24,
        width: 480,
        maxWidth: '90%',
        padding: 40,
        boxShadow: 'var(--shadow-xl)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        border: '1px solid var(--border-subtle)',
        animation: 'slideUp 0.3s ease-out forwards'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ marginBottom: 24, padding: 24, background: 'var(--bg-tertiary)', borderRadius: '50%' }}>
          {STEPS[step].icon}
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
          {STEPS[step].title}
        </h2>
        
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
          {STEPS[step].desc}
        </p>

        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === step ? 'var(--accent)' : 'var(--bg-tertiary)',
                transition: 'all 0.3s ease'
              }} />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={onClose}
              style={{ padding: '10px 16px', background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}
            >
              Skip
            </button>
            <button 
              onClick={nextStep}
              className="btn-pub btn-pub-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {step === STEPS.length - 1 ? 'Get Started' : 'Next'} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
