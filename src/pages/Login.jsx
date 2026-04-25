import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { sanitize } from '../utils/sanitize';

function getStrengthScore(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  const { login, register, loginWithGoogle } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const strengthScore = mode === 'register' ? getStrengthScore(form.password) : 0;

  const startRateLimitTimer = (seconds = 60) => {
    setRateLimited(true);
    setRateLimitCountdown(seconds);
    const interval = setInterval(() => {
      setRateLimitCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); setRateLimited(false); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0.375rem',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    transition: 'all 0.2s'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rateLimited) return;

    const sanitizedForm = {
      name: sanitize(form.name),
      email: sanitize(form.email),
      password: form.password
    };

    setLoading(true);
    try {
      if (mode === 'login') {
        const user = await login(sanitizedForm.email, sanitizedForm.password);
        addToast(`Welcome back, ${user.name.split(' ')[0]}! 🏁`);
        navigate(user.role === 'admin' || user.role === 'superadmin' ? '/admin' : from, { replace: true });
      } else {
        const user = await register(sanitizedForm);
        addToast(`Welcome to Race District, ${user.name.split(' ')[0]}! 🏎️`);
        navigate(from, { replace: true });
      }
    } catch (err) {
      if (err.status === 429 || err.message?.includes('Too many')) {
        startRateLimitTimer(60);
        addToast('Too many attempts. Please wait 1 minute.', 'error');
      } else {
        addToast(err.message || 'Authentication failed', 'error');
      }
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      addToast(`Welcome, ${user.name.split(' ')[0]}! 🏁`);
      navigate(user.role === 'admin' || user.role === 'superadmin' ? '/admin' : from, { replace: true });
    } catch (err) {
      addToast(err.message || 'Google sign-in failed. Check Firebase config.', 'error');
    } finally { setGoogleLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
      backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(0,102,255,0.05) 0%, transparent 60%)' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span className="font-orbitron" style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white', letterSpacing: '0.1em' }}>
              RACE<span style={{ color: '#0066FF' }}>DISTRICT</span>
            </span>
          </Link>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>Built for Speed. Designed for Life.</p>
        </div>

        <div style={{ background: 'rgba(10,10,10,0.9)', border: '1px solid rgba(0,102,255,0.2)', borderRadius: '0.75rem', padding: '2.5rem' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', padding: '4px', marginBottom: '2rem', gap: '4px' }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '0.625rem', border: 'none', cursor: 'pointer', borderRadius: '6px',
                background: mode === m ? '#0066FF' : 'transparent',
                color: mode === m ? 'white' : '#9CA3AF',
                fontFamily: 'Orbitron, sans-serif', fontWeight: 700, fontSize: '0.75rem',
                letterSpacing: '0.08em', transition: 'all 0.2s'
              }}>
                {m === 'login' ? 'SIGN IN' : 'REGISTER'}
              </button>
            ))}
          </div>

          <h2 className="font-orbitron" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.05em', color: 'white' }}>
            {mode === 'login' ? 'WELCOME BACK' : 'JOIN THE RACE'}
          </h2>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
            {mode === 'login' ? 'Sign in to access your garage' : 'Create your account'}
          </p>

          <button onClick={handleGoogle} disabled={googleLoading} style={{
            width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.375rem', color: 'white',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.75rem', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9rem',
            marginBottom: '1.25rem', transition: 'all 0.2s', opacity: googleLoading ? 0.6 : 1
          }}>
            {googleLoading
              ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              : <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
            }
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: '#6B7280', fontSize: '0.8rem' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {rateLimited && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.375rem', padding: '0.75rem', marginBottom: '1rem', color: '#fca5a5', fontSize: '0.85rem', textAlign: 'center' }}>
              Too many attempts. Please wait {rateLimitCountdown}s before trying again.
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#9CA3AF', marginBottom: '0.5rem' }}>Full Name</label>
                <input
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#0066FF'; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                  type="text" required value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Max Verstappen"
                  maxLength={50}
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#9CA3AF', marginBottom: '0.5rem' }}>Email</label>
              <input
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#0066FF'; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                type="email" required value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="pilot@racedistrict.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#9CA3AF', marginBottom: '0.5rem' }}>Password</label>
              <input
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#0066FF'; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                type="password" required value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />

              {mode === 'register' && form.password.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: '3px', borderRadius: '2px',
                        background: i <= strengthScore ? STRENGTH_COLORS[strengthScore] : 'rgba(255,255,255,0.1)',
                        transition: 'background 0.3s'
                      }} />
                    ))}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: STRENGTH_COLORS[strengthScore] || '#6B7280' }}>
                    {STRENGTH_LABELS[strengthScore] || 'Very weak'} password
                  </p>
                  {strengthScore < 4 && (
                    <ul style={{ marginTop: '0.25rem', paddingLeft: '1rem', fontSize: '0.72rem', color: '#6B7280', lineHeight: 1.6 }}>
                      {form.password.length < 8 && <li>At least 8 characters</li>}
                      {!/[A-Z]/.test(form.password) && <li>One uppercase letter</li>}
                      {!/[0-9]/.test(form.password) && <li>One number</li>}
                      {!/[^A-Za-z0-9]/.test(form.password) && <li>One special character (!@#$%)</li>}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading || rateLimited}
              style={{ padding: '0.875rem', background: rateLimited ? '#374151' : '#2563EB', border: '2px solid', borderColor: rateLimited ? '#374151' : '#2563EB', color: 'white', fontWeight: 700, cursor: rateLimited ? 'not-allowed' : 'pointer', fontFamily: 'Orbitron, sans-serif', fontSize: '0.875rem', letterSpacing: '0.08em', borderRadius: '0.375rem', opacity: loading ? 0.6 : 1, marginTop: '0.25rem', transition: 'all 0.2s' }}>
              {loading ? 'LOADING...' : rateLimited ? `WAIT ${rateLimitCountdown}s` : (mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT')}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: '#6B7280' }}>
          <Link to="/" style={{ color: '#6B7280', textDecoration: 'none' }}>← Back to Store</Link>
        </p>
      </div>
    </div>
  );
}