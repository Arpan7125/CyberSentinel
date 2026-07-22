import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { Shield, Lock, Activity, User, KeyRound, Smartphone, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { login, requestOTP, loginWithOTP, googleLogin } = useAuth();
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
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setError('');
    try {
      const result = await login(form.email, form.password);
      if (remember) localStorage.setItem('cs_remember', form.email);
      const role = result?.user?.role || 'customer';
      if (role === 'admin' || result?.user?.is_admin || result?.user?.is_superuser) navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid username/email or password.');
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

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    setError('');
    try {
      const result = await googleLogin('mock_google_id_token', `${provider}_user@gmail.com`, 'Google Account User');
      const role = result?.user?.role || 'customer';
      if (role === 'admin' || result?.user?.is_admin) navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      {/* Left side: Premium Branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 64, borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '50%', height: '50%', background: 'var(--accent-muted)', filter: 'blur(100px)', opacity: 0.5 }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '50%', height: '50%', background: 'var(--accent-muted)', filter: 'blur(100px)', opacity: 0.5 }}></div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'auto', zIndex: 10 }}>
          <img src="/logo.png" alt="CyberSentinel" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>CyberSentinel</span>
        </div>

        <div style={{ zIndex: 10, maxWidth: 500 }}>
          <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Your Digital Life, Secured.
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 40 }}>
            Access your Personal Security Hub. Monitor connected accounts, check email breaches, analyze suspicious messages, and manage your cyber posture from a single interface.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ background: 'rgba(59,130,246,0.1)', padding: 10, borderRadius: 10, color: 'var(--accent)' }}>
                <Shield size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Real-time Threat Monitoring</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>Active scanning of URLs, emails, and SMS against our global threat database.</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ background: 'rgba(139,92,246,0.1)', padding: 10, borderRadius: 10, color: 'var(--accent-purple)' }}>
                <Activity size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Identity Protection</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>Monitor data breaches and secure your connected OAuth accounts instantly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 64, position: 'relative' }}>
        
        {/* Top Right Actions */}
        <div style={{ position: 'absolute', top: 32, right: 32, display: 'flex', gap: 16 }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>&larr; Return to Home</Link>
          <Link to="/admin-login" style={{ color: 'var(--accent)', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>Admin Login</Link>
        </div>

        <div style={{ width: '100%', maxWidth: 400 }}>
          
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

            {error && <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>{error}</div>}
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
                  style={{ width: '100%', padding: 14, background: 'var(--accent)', color: 'var(--text-inverse)', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8, transition: 'opacity 0.2s' }}
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
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '32px 0 20px' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Or continue with</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => handleSocialLogin('google')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: 16, height: 16 }} /> Google Sign-In
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 32, fontSize: 14, color: 'var(--text-secondary)' }}>
              Don't have an account? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

