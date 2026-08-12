import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { User } from 'lucide-react';
import AuthLayout from '../../components/ui/AuthLayout';
import GoogleSignInButton from '../../components/ui/GoogleSignInButton';
import MicrosoftSignInButton from '../../components/ui/MicrosoftSignInButton';

export default function LoginPage() {
  const { login, register, requestOTP, loginWithOTP, googleLogin, microsoftLogin } = useAuth();
  const navigate = useNavigate();
  
  const [loginMode, setLoginMode] = useState('password'); // 'password' | 'otp'
  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // OTP Login state
  const [otpStep, setOtpStep] = useState(1); // 1 = enter email, 2 = enter OTP code
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [devOtpHint, setDevOtpHint] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanEmail = form.email.trim();
    if (!cleanEmail || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setError('');
    try {
      const result = await login(cleanEmail, form.password);
      if (remember) localStorage.setItem('cs_remember', cleanEmail);
      const role = result?.user?.role || 'customer';
      if (role === 'admin' || result?.user?.is_admin || result?.user?.is_superuser) navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid username/email or password. If you don\'t have an account, please sign up below.');
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      try {
        const result = await login('demo_user', 'demopass123');
        navigate('/dashboard');
        return;
      } catch (err) {
        await register('demo_user', 'demo@cybersentinel.io', 'demopass123', 'demopass123', 'customer');
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Could not initiate demo session. Please click Sign up below to create a new account.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!otpEmail.trim()) { setError('Please enter your email or username.'); return; }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await requestOTP(otpEmail);
      setSuccessMsg(res.message || 'OTP verification code sent to your email.');
      if (res.dev_otp) {
        setDevOtpHint(`Dev Code: ${res.dev_otp}`);
      }
      setOtpStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const codeStr = otpCode.join('');
    if (codeStr.length !== 6) { setError('Please enter the 6-digit OTP code.'); return; }
    setLoading(true);
    setError('');
    try {
      const result = await loginWithOTP(otpEmail, codeStr);
      const role = result?.user?.role || 'customer';
      if (role === 'admin' || result?.user?.is_admin) navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid OTP code.');
      setLoading(false);
    }
  };

  const handleOTPChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...otpCode];
    newCode[index] = value.slice(-1);
    setOtpCode(newCode);
    if (value && index < 5) {
      document.getElementById(`login-otp-${index + 1}`)?.focus();
    }
  };

  const handleGoogleCredential = async (credential) => {
    setLoading(true);
    setError('');
    try {
      const result = await googleLogin(credential);
      const role = result?.user?.role || 'customer';
      if (role === 'admin' || result?.user?.is_admin) navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftCredential = async (credential) => {
    setLoading(true);
    setError('');
    try {
      const result = await microsoftLogin(credential);
      const role = result?.user?.role || 'customer';
      if (role === 'admin' || result?.user?.is_admin) navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Microsoft authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout actions={<Link to="/admin-login">Admin Login</Link>}>
          
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                <User size={24} color="var(--text-primary)" />
              </div>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 700 }}>Welcome back</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Sign in to your security dashboard</p>
              </div>
            </div>

            {/* Login Mode Selector: Password vs OTP */}
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: 4, borderRadius: 8, gap: 4, margin: '24px 0 16px', border: '1px solid var(--border-subtle)' }}>
              <button 
                type="button" 
                onClick={() => { setLoginMode('password'); setError(''); setSuccessMsg(''); }} 
                style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 6, background: loginMode === 'password' ? 'var(--accent)' : 'transparent', color: loginMode === 'password' ? 'var(--text-inverse)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Password Login
              </button>
              <button 
                type="button" 
                onClick={() => { setLoginMode('otp'); setError(''); setSuccessMsg(''); setOtpStep(1); }} 
                style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 6, background: loginMode === 'otp' ? 'var(--accent)' : 'transparent', color: loginMode === 'otp' ? 'var(--text-inverse)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                OTP Code Login
              </button>
            </div>

            {error && (
              <div style={{ padding: 14, background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 13.5, fontWeight: 600, marginBottom: 16, lineHeight: 1.5 }}>
                {error}
              </div>
            )}
            {successMsg && <div style={{ padding: 12, background: 'rgba(50,215,75,0.1)', color: '#32D74B', border: '1px solid rgba(50,215,75,0.2)', borderRadius: 6, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>{successMsg}</div>}
            {devOtpHint && <div style={{ padding: 10, background: 'rgba(175,82,222,0.1)', color: '#AF52DE', border: '1px solid rgba(175,82,222,0.2)', borderRadius: 6, fontSize: 12, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>{devOtpHint}</div>}

            {loginMode === 'password' ? (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Email Address or Username</label>
                  <input 
                    type="text" 
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    style={{ width: '100%', padding: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 15, outline: 'none', transition: 'border 0.2s', boxShadow: 'var(--shadow-sm)' }}
                  />
                </div>
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Password</label>
                    <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Forgot?</Link>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPwd ? 'text' : 'password'} 
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      style={{ width: '100%', padding: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 15, outline: 'none', transition: 'border 0.2s', boxShadow: 'var(--shadow-sm)' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPwd(!showPwd)} 
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      {showPwd ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="remember" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ cursor: 'pointer' }} />
                  <label htmlFor="remember" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>Stay signed in</label>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  style={{ width: '100%', padding: 14, background: 'var(--accent)', color: 'var(--text-inverse)', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, transition: 'opacity 0.2s' }}
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>
            ) : (
              <div>
                {otpStep === 1 ? (
                  <form onSubmit={handleRequestOTP} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Email Address or Username</label>
                      <input 
                        type="text" 
                        value={otpEmail}
                        onChange={(e) => { setOtpEmail(e.target.value); setError(''); }}
                        placeholder="you@example.com"
                        style={{ width: '100%', padding: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 15, outline: 'none' }}
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={loading}
                      style={{ width: '100%', padding: 14, background: 'var(--accent)', color: 'var(--text-inverse)', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
                    >
                      {loading ? 'Sending Code...' : 'Send OTP Code'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Enter the 6-digit OTP code sent to <strong>{otpEmail}</strong>:</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      {otpCode.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`login-otp-${idx}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOTPChange(idx, e.target.value)}
                          onPaste={(e) => {
                            e.preventDefault();
                            const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                            const newCode = [...otpCode];
                            text.split('').forEach((c, i) => { if (i < 6) newCode[i] = c; });
                            setOtpCode(newCode);
                          }}
                          autoFocus={idx === 0}
                          style={{ width: '100%', height: 48, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 20, textAlign: 'center', outline: 'none' }}
                        />
                      ))}
                    </div>
                    <button 
                      type="submit" 
                      disabled={loading}
                      style={{ width: '100%', padding: 14, background: 'var(--accent)', color: 'var(--text-inverse)', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
                    >
                      {loading ? 'Verifying...' : 'Verify & Sign In'}
                    </button>
                    <button type="button" onClick={() => setOtpStep(1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
                      Change Email / Resend Code
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Quick Demo Access Button */}
            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                style={{ width: '100%', padding: '12px 0', background: 'var(--bg-secondary)', color: 'var(--accent)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                ⚡ Explore Demo Dashboard (Instant Login)
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0 16px' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Or continue with</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <GoogleSignInButton onCredential={handleGoogleCredential} onError={setError} />
              <MicrosoftSignInButton onCredential={handleMicrosoftCredential} onError={setError} />
            </div>

            <div style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: 'var(--text-secondary)' }}>
              Don't have an account? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Sign up for free</Link>
            </div>
          </div>

    </AuthLayout>
  );
}

