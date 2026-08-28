import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import AuthLayout from '../../components/ui/AuthLayout';
import PasswordStrength, { generatePassword } from '../../components/ui/PasswordStrength';
import GoogleSignInButton from '../../components/ui/GoogleSignInButton';
import MicrosoftSignInButton from '../../components/ui/MicrosoftSignInButton';
import { ShieldCheck, User, Mail, Lock, Eye, EyeOff, KeyRound, CheckCircle2, Shield, Inbox } from 'lucide-react';
import { validateEmail } from '../../utils/validation';

export default function RegisterPage() {
  const navigate = useNavigate();
  // Real account creation (step 1) logs the user in immediately — there is no
  // backend email-verification flow, so step 2 is a genuine "you're set" screen,
  // not a fake "we sent you an email" step that never actually sent anything.
  const [step, setStep] = useState(1); // 1=details, 2=success
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    company: '', role: 'individual', agreeTerms: false,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError('');
  };

  const handleGenerate = () => {
    const pwd = generatePassword(18);
    setForm(prev => ({ ...prev, password: pwd, confirmPassword: pwd }));
    setShowPwd(true);
  };

  const validateStep1 = () => {
    if (!form.fullName.trim()) return 'Full name is required.';
    const emailError = validateEmail(form.email);
    if (emailError) return emailError;
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    if (!form.agreeTerms) return 'You must accept the Terms & Conditions.';
    return null;
  };

  const { register, googleLogin, microsoftLogin } = useAuth();

  const handleStep1 = async (e) => {
    e.preventDefault();
    const err = validateStep1();
    if (err) { setError(err); return; }
    setLoading(true);
    setError('');
    try {
      const cleanEmail = form.email.trim().toLowerCase();
      const username = cleanEmail.replace(/[^a-zA-Z0-9_]/g, '_');
      await register(username, cleanEmail, form.password, form.confirmPassword);
      setStep(2);
    } catch (apiErr) {
      setError(apiErr.message || 'Registration failed. An account with this email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    navigate('/dashboard');
  };

  const handleGoogleCredential = async (credential) => {
    setLoading(true);
    setError('');
    try {
      await googleLogin(credential);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google sign-up failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftCredential = async (credential) => {
    setLoading(true);
    setError('');
    try {
      await microsoftLogin(credential);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Microsoft sign-up failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon" aria-hidden="true"><ShieldCheck size={28} /></div>
            <span className="auth-logo-text">CyberSentinel</span>
          </div>

          {/* Progress Steps */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
            {[1, 2].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  background: step >= s ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                  color: step >= s ? 'white' : 'var(--text-muted)',
                  border: `1px solid ${step >= s ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
                  transition: 'all 0.3s',
                }}>
                  {step > s ? <CheckCircle2 size={16} /> : s}
                </div>
                {s < 2 && <div style={{ width: 40, height: 2, background: step > s ? 'var(--accent)' : 'var(--border-subtle)', borderRadius: 1, transition: 'background 0.3s' }} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <>
              <h1 className="auth-title">Create your account</h1>
              <p className="auth-subtitle">Start protecting your organization in minutes</p>

              {error && <div className="auth-error" role="alert">{error}</div>}

              <form className="auth-form" onSubmit={handleStep1}>
                <div className="auth-input-group">
                  <label htmlFor="register-full-name" className="auth-input-label">Full Name</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon" aria-hidden="true"><User size={16} /></span>
                    <input id="register-full-name" type="text" name="fullName" className="auth-input" placeholder="John Smith" value={form.fullName} onChange={handleChange} autoComplete="name" required />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label htmlFor="register-email" className="auth-input-label">Work Email</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon" aria-hidden="true"><Mail size={16} /></span>
                    <input id="register-email" type="email" name="email" className="auth-input" placeholder="you@company.com" value={form.email} onChange={handleChange} autoComplete="email" required />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label htmlFor="register-password" className="auth-input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    Password
                    <button type="button" onClick={handleGenerate} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <KeyRound size={12} /> Generate
                    </button>
                  </label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon" aria-hidden="true"><Lock size={16} /></span>
                    <input id="register-password" type={showPwd ? 'text' : 'password'} name="password" className="auth-input" aria-describedby="register-password-strength" placeholder="Min. 8 characters" value={form.password} onChange={handleChange} autoComplete="new-password" required />
                    <button
                      type="button"
                      className="auth-input-action"
                      onClick={() => setShowPwd(!showPwd)}
                      aria-label={showPwd ? 'Hide password' : 'Show password'}
                      aria-pressed={showPwd}
                    >
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <PasswordStrength password={form.password} id="register-password-strength" />
                </div>

                <div className="auth-input-group">
                  <label htmlFor="register-confirm-password" className="auth-input-label">Confirm Password</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon" aria-hidden="true"><Lock size={16} /></span>
                    <input id="register-confirm-password" type={showPwd ? 'text' : 'password'} name="confirmPassword" className="auth-input" placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" required />
                  </div>
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <span style={{ fontSize: 12, color: 'var(--accent-red)' }}>Passwords do not match</span>
                  )}
                </div>

                <label htmlFor="register-agree-terms" className="auth-remember" style={{ fontSize: 12 }}>
                  <input id="register-agree-terms" type="checkbox" name="agreeTerms" checked={form.agreeTerms} onChange={handleChange} />
                  I agree to the <Link to="/terms" style={{ color: 'var(--accent)', marginLeft: 3 }}>Terms</Link> & <Link to="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>
                </label>

                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? <><span className="btn-spinner" /> Creating account...</> : 'Create Account'}
                </button>
              </form>

              <div className="auth-divider">
                <div className="auth-divider-line" />
                <span className="auth-divider-text">or sign up with</span>
                <div className="auth-divider-line" />
              </div>

              <div className="auth-social" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <GoogleSignInButton onCredential={handleGoogleCredential} onError={setError} text="signup_with" />
                <MicrosoftSignInButton onCredential={handleMicrosoftCredential} onError={setError} text="Sign up with Microsoft" />
              </div>

              <div className="auth-footer">
                Already have an account? <Link to="/login">Sign in</Link>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="auth-title">You're all set!</h1>
              <p className="auth-subtitle">Your CyberSentinel account is ready. Let's secure your organization.</p>

              <div style={{ textAlign: 'center', margin: '20px 0', color: 'var(--accent-green)' }}>
                <CheckCircle2 size={64} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '20px 0' }}>
                {[
                  { icon: <Shield size={16} />, text: 'Account created successfully' },
                  { icon: <Inbox size={16} />, text: `Signed in as ${form.email}` },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.15)', borderRadius: 'var(--radius-sm)', fontSize: 14, color: 'var(--accent-green)', fontWeight: 500 }}>
                    <span>{item.icon}</span> {item.text}
                  </div>
                ))}
              </div>

              <button className="auth-submit" onClick={handleComplete}>
                Go to Dashboard →
              </button>
            </>
          )}
        </div>
    </AuthLayout>
  );
}
