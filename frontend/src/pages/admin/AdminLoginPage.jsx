import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, KeyRound, Smartphone, Lock, UserPlus, CheckCircle } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { authService } from '../../services/api';

export default function AdminLoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'registered'
  
  // Login State
  const [email, setEmail] = useState('');
  const [authKey, setAuthKey] = useState('');
  
  // Register State
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !authKey) {
      setError('Email and Authentication Key are required.');
      return;
    }
    
    setLoading(true);
    try {
      await adminLogin(email, authKey);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  const [devAuthKey, setDevAuthKey] = useState('');

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !regUsername) {
      setError('Email and Username are required.');
      return;
    }
    
    setLoading(true);
    try {
      const res = await authService.adminRegister({
        email,
        username: regUsername,
        first_name: regFirstName,
        last_name: regLastName
      });
      setMessage(res.message);
      if (res.dev_auth_key) {
        setDevAuthKey(res.dev_auth_key);
        setAuthKey(res.dev_auth_key);
      }
      setMode('registered');
    } catch (err) {
      setError(err.message || 'Failed to register admin. An account with this email or username may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      {/* Left side: Branding / Warning */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 64, borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '50%', background: 'var(--accent-muted)', filter: 'blur(150px)', opacity: 0.5 }}></div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'auto' }}>
          <img src="/logo.png" alt="CyberSentinel" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>CyberSentinel</span>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, color: 'var(--accent-red)' }}>
            <ShieldAlert size={48} />
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1, marginBottom: 24, fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>
            RESTRICTED<br/>SYSTEM ACCESS
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 400 }}>
            You are attempting to access the CyberSentinel Enterprise Control Center. 
            All activity is monitored, logged, and audited. Unauthorized access attempts 
            will be reported to the relevant authorities.
          </p>
        </div>

        <div style={{ marginTop: 'auto', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <div>IP: 192.168.1.104</div>
          <div>Location: US-EAST-1</div>
          <div>Session ID: {Math.random().toString(36).substring(7)}</div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 64, position: 'relative' }}>
        
        {/* Top Right Actions */}
        <div style={{ position: 'absolute', top: 32, right: 32, display: 'flex', gap: 16 }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>&larr; Return to Home</Link>
          <Link to="/login" style={{ color: 'var(--accent)', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>User Login</Link>
        </div>

        <div style={{ width: '100%', maxWidth: 420 }}>
          
          {mode === 'login' ? (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Admin Authentication</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 14 }}>Enter your registered email and secure authentication key to proceed.</p>
              
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {error && <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>{error}</div>}
                
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>Administrator Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@cybersentinel.com"
                    style={{ width: '100%', padding: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 15, outline: 'none', boxShadow: 'var(--shadow-sm)' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>Authentication Key</label>
                  <input 
                    type="password" 
                    value={authKey}
                    onChange={e => setAuthKey(e.target.value)}
                    placeholder="CS-ADMIN-XXXXXXXX"
                    style={{ width: '100%', padding: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 15, outline: 'none', boxShadow: 'var(--shadow-sm)', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  style={{ width: '100%', padding: 16, background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {loading ? 'Authenticating...' : <><KeyRound size={18} /> Continue</>}
                </button>
              </form>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, fontSize: 13 }}>
                <a href="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>&larr; Return to Customer Portal</a>
                <button type="button" onClick={() => { setError(''); setMode('register'); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>Request Access</button>
              </div>
            </div>
          ) : mode === 'register' ? (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Request Admin Access</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 14 }}>Register your details. An authentication key will be sent to your email.</p>
              
              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>{error}</div>}
                
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>First Name</label>
                    <input type="text" value={regFirstName} onChange={e => setRegFirstName(e.target.value)} style={{ width: '100%', padding: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>Last Name</label>
                    <input type="text" value={regLastName} onChange={e => setRegLastName(e.target.value)} style={{ width: '100%', padding: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>Username *</label>
                  <input type="text" value={regUsername} onChange={e => setRegUsername(e.target.value)} required style={{ width: '100%', padding: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none' }} />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>Email *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none' }} />
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{ width: '100%', padding: 16, background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {loading ? 'Processing...' : <><UserPlus size={18} /> Request Key</>}
                </button>
              </form>
              
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                <button type="button" onClick={() => { setError(''); setMode('login'); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>&larr; Back to Login</button>
              </div>
            </div>
          ) : (
             <div style={{ animation: 'fadeIn 0.3s', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', padding: 24, background: 'rgba(62,182,73,0.1)', borderRadius: '50%', color: 'var(--accent-green)', marginBottom: 24 }}>
                <CheckCircle size={48} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Registration Complete</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 15, lineHeight: 1.6 }}>
                {message || "Your Authentication Key has been sent to your email. (If SMTP is not configured, please check the server terminal for your key)."}
              </p>
              
              <button 
                onClick={() => setMode('login')}
                style={{ padding: '16px 32px', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
              >
                Go to Login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
