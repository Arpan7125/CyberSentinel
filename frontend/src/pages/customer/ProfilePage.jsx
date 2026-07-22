import React, { useState } from 'react';
import { useAuth } from '../../AuthContext';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [personalForm, setPersonalForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: '+1 (555) 019-2834',
    company: user?.company || 'IndieSec',
    title: 'Security Analyst'
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [pwdStatus, setPwdStatus] = useState({ type: '', message: '' });

  const handlePersonalSubmit = (e) => {
    e.preventDefault();
    setStatus({ type: 'success', message: 'Profile details successfully updated.' });
    setUser(prev => ({
      ...prev,
      fullName: personalForm.fullName,
      email: personalForm.email,
      company: personalForm.company
    }));
    setTimeout(() => setStatus({ type: '', message: '' }), 4000);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPwdStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    setPwdStatus({ type: 'success', message: 'Password updated successfully.' });
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setPwdStatus({ type: '', message: '' }), 4000);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800 }}>
      <div>
        <h1 className="page-title">Profile Settings</h1>
        <p className="page-subtitle">Manage personal node data credentials and verification metrics</p>
      </div>

      {status.message && (
        <div className={`form-status form-status-${status.type}`}>
          {status.message}
        </div>
      )}

      {/* Personal Info Card */}
      <div className="glass-card" style={{ padding: 28 }}>
        <h3 className="section-title" style={{ marginBottom: 20 }}>Personal Node Information</h3>
        <form onSubmit={handlePersonalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 8 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: 'white'
            }}>
              {getInitials(personalForm.fullName)}
            </div>
            <div>
              <h4 style={{ fontSize: 16, fontWeight: 700 }}>Profile Avatar</h4>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Standard generated cryptographic profile avatar badge</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label-pub">Full Name</label>
              <input
                type="text"
                className="form-input-pub"
                value={personalForm.fullName}
                onChange={e => setPersonalForm(p => ({ ...p, fullName: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label-pub">Email Address</label>
              <input
                type="email"
                className="form-input-pub"
                value={personalForm.email}
                onChange={e => setPersonalForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label-pub">Phone Number</label>
              <input
                type="text"
                className="form-input-pub"
                value={personalForm.phone}
                onChange={e => setPersonalForm(p => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label-pub">Organization</label>
              <input
                type="text"
                className="form-input-pub"
                value={personalForm.company}
                onChange={e => setPersonalForm(p => ({ ...p, company: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <button type="submit" className="btn-pub btn-pub-primary btn-pub-sm">
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Password Security Card */}
      {pwdStatus.message && (
        <div className={`form-status form-status-${pwdStatus.type}`}>
          {pwdStatus.message}
        </div>
      )}

      <div className="glass-card" style={{ padding: 28 }}>
        <h3 className="section-title" style={{ marginBottom: 20 }}>Modify Credentials</h3>
        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label-pub">Current Password</label>
            <input
              type="password"
              className="form-input-pub"
              placeholder="••••••••"
              value={passwordForm.currentPassword}
              onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label-pub">New Password</label>
              <input
                type="password"
                className="form-input-pub"
                placeholder="••••••••"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label-pub">Confirm New Password</label>
              <input
                type="password"
                className="form-input-pub"
                placeholder="••••••••"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                required
              />
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <button type="submit" className="btn-pub btn-pub-primary btn-pub-sm">
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Multi-Factor Authentication Card */}
      <div className="glass-card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="section-title">Two-Factor Authentication (2FA)</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Secure login steps using standard authenticator app codes (Google Authenticator, Authy, etc.)
            </p>
          </div>
          <div>
            <button
              className={`btn-pub btn-pub-sm ${mfaEnabled ? 'btn-pub-danger' : 'btn-pub-primary'}`}
              onClick={() => setMfaEnabled(!mfaEnabled)}
            >
              {mfaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
