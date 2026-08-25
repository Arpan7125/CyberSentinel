import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { authService } from '../../services/api';
import { validateEmail, validatePhone, validateMaxLength } from '../../utils/validation';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [personalForm, setPersonalForm] = useState({
    fullName: user?.fullName || user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || '',
    title: user?.title || 'Security Analyst'
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [status, setStatus] = useState({ type: '', message: '' });
  const [pwdStatus, setPwdStatus] = useState({ type: '', message: '' });

  // Per-field messages, so an error appears next to the input that caused it
  // rather than only as one banner at the top of the page.
  const [fieldErrors, setFieldErrors] = useState({});

  /** Mirrors the server's rules. The server re-checks and remains the authority. */
  const validatePersonal = () => {
    const errors = {};

    if (!personalForm.fullName.trim()) {
      errors.fullName = 'Enter your name.';
    } else {
      const tooLong = validateMaxLength(personalForm.fullName, 150, 'Your name');
      if (tooLong) errors.fullName = tooLong;
    }

    const emailError = validateEmail(personalForm.email);
    if (emailError) errors.email = emailError;

    // Optional: an empty phone clears the stored value.
    const phoneError = validatePhone(personalForm.phone, { required: false });
    if (phoneError) errors.phone = phoneError;

    const companyError = validateMaxLength(personalForm.company, 150, 'Organization');
    if (companyError) errors.company = companyError;

    return errors;
  };

  const clearFieldError = (name) =>
    setFieldErrors(prev => (prev[name] ? { ...prev, [name]: undefined } : prev));

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.profile();
        if (data) {
          setPersonalForm(p => ({
            ...p,
            fullName: data.full_name || data.username || p.fullName,
            email: data.email || p.email,
            company: data.company || p.company,
            phone: data.phone || p.phone,
          }));
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handlePersonalSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    const errors = validatePersonal();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setStatus({ type: 'error', message: 'Fix the highlighted fields and try again.' });
      return;
    }
    setFieldErrors({});

    try {
      const res = await authService.updateProfile({
        full_name: personalForm.fullName,
        email: personalForm.email,
        company: personalForm.company,
        // `phone` was missing here, so anything typed into the Phone Number
        // input was silently discarded on save.
        phone: personalForm.phone,
      });
      setStatus({ type: 'success', message: res.message || 'Profile details successfully updated.' });
      if (res.user) {
        setPersonalForm(p => ({
          ...p,
          phone: res.user.phone ?? p.phone,
          company: res.user.company ?? p.company,
        }));
        setUser(prev => ({
          ...prev,
          fullName: res.user.full_name,
          email: res.user.email,
        }));
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'Failed to update profile.' });
    }
    setTimeout(() => setStatus({ type: '', message: '' }), 4000);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdStatus({ type: '', message: '' });

    // Mirror the server's rules so an obviously-bad password is caught before a
    // round-trip. The server still re-checks with Django's full validator set —
    // this is a convenience, never the enforcement point.
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPwdStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPwdStatus({ type: 'error', message: 'New password must be at least 8 characters.' });
      return;
    }

    if (passwordForm.newPassword === passwordForm.currentPassword) {
      setPwdStatus({ type: 'error', message: 'New password must be different from your current password.' });
      return;
    }

    try {
      const res = await authService.changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
        confirm_password: passwordForm.confirmPassword,
      });
      setPwdStatus({ type: 'success', message: res.message || 'Password updated successfully.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error(err);
      setPwdStatus({ type: 'error', message: err.message || 'Failed to update password.' });
    }
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
              <label className="form-label-pub" htmlFor="profile-name">Full Name</label>
              <input
                id="profile-name"
                type="text"
                className="form-input-pub"
                value={personalForm.fullName}
                onChange={e => { setPersonalForm(p => ({ ...p, fullName: e.target.value })); clearFieldError('fullName'); }}
                maxLength={150}
                aria-invalid={fieldErrors.fullName ? 'true' : undefined}
                aria-describedby={fieldErrors.fullName ? 'profile-name-error' : undefined}
                required
              />
              {fieldErrors.fullName && (
                <p id="profile-name-error" className="field-error" role="alert">
                  <AlertTriangle size={14} aria-hidden="true" /><span>{fieldErrors.fullName}</span>
                </p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label-pub" htmlFor="profile-email">Email Address</label>
              <input
                id="profile-email"
                type="email"
                className="form-input-pub"
                value={personalForm.email}
                onChange={e => { setPersonalForm(p => ({ ...p, email: e.target.value })); clearFieldError('email'); }}
                aria-invalid={fieldErrors.email ? 'true' : undefined}
                aria-describedby={fieldErrors.email ? 'profile-email-error' : undefined}
                required
              />
              {fieldErrors.email && (
                <p id="profile-email-error" className="field-error" role="alert">
                  <AlertTriangle size={14} aria-hidden="true" /><span>{fieldErrors.email}</span>
                </p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label-pub" htmlFor="profile-phone">Phone Number</label>
              <input
                id="profile-phone"
                type="tel"
                className="form-input-pub"
                placeholder="+1 415 555 2671"
                value={personalForm.phone}
                onChange={e => { setPersonalForm(p => ({ ...p, phone: e.target.value })); clearFieldError('phone'); }}
                maxLength={32}
                aria-invalid={fieldErrors.phone ? 'true' : undefined}
                aria-describedby={fieldErrors.phone ? 'profile-phone-error' : undefined}
              />
              {fieldErrors.phone && (
                <p id="profile-phone-error" className="field-error" role="alert">
                  <AlertTriangle size={14} aria-hidden="true" /><span>{fieldErrors.phone}</span>
                </p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label-pub" htmlFor="profile-company">Organization</label>
              <input
                id="profile-company"
                type="text"
                className="form-input-pub"
                value={personalForm.company}
                onChange={e => { setPersonalForm(p => ({ ...p, company: e.target.value })); clearFieldError('company'); }}
                maxLength={150}
                aria-invalid={fieldErrors.company ? 'true' : undefined}
                aria-describedby={fieldErrors.company ? 'profile-company-error' : undefined}
              />
              {fieldErrors.company && (
                <p id="profile-company-error" className="field-error" role="alert">
                  <AlertTriangle size={14} aria-hidden="true" /><span>{fieldErrors.company}</span>
                </p>
              )}
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

      {/* The Two-Factor Authentication card that used to sit here was removed.
          Its button only ran setMfaEnabled(!mfaEnabled) — it flipped a local
          React state flag and nothing else. There is no TOTP library, no enrol
          or verify endpoint, and nothing ever wrote UserProfile.mfa_enabled, so
          a user who clicked "Enable 2FA" saw the button say "Disable 2FA" and
          believed their account was protected when it was not. A security
          control that only pretends to be on is worse than none at all.
          Sign-in is hardened instead through Google / Microsoft OAuth and the
          one-time-code login. */}
    </div>
  );
}
