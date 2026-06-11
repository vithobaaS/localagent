import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LogoSVG = () => (
  <svg className="auth-logo-svg" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="url(#authGrad)" />
    <path d="M20 8L23.5 17H33L25.5 22.5L28 31.5L20 26.5L12 31.5L14.5 22.5L7 17H16.5L20 8Z"
      fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="20" cy="20" r="3" fill="white" />
    <defs>
      <linearGradient id="authGrad" x1="0" y1="0" x2="40" y2="40">
        <stop offset="0%" stopColor="#7c3aed" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser, setShowSplash } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orgData, setOrgData] = useState(null);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    const host = window.location.hostname;
    const isIp = /^[0-9.]+$/.test(host);
    if (!isIp && host !== 'localhost') {
      const parts = host.split('.');
      if (parts.length > 1 && parts[0] !== 'www') {
        fetch(`/api/public/orgs/by-subdomain/${parts[0]}`)
          .then(r => r.ok ? r.json() : null)
          .then(d => { if (d) setOrgData(d); })
          .catch(() => {});
      }
    }
  }, []);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return; }
      localStorage.setItem('ap_token', data.token);
      localStorage.setItem('ap_user', JSON.stringify(data));
      setUser(data);
      if (setShowSplash) setShowSplash(true);
      navigate('/dashboard', { replace: true });
    } catch { setError('Network error. Please try again.'); setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <LogoSVG />
          <div className="auth-brand">
            {orgData ? orgData.name : <><span style={{ color: 'var(--txt-h)' }}>Auto</span><span>Pilot</span></>}
          </div>
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">{orgData ? `Sign in to ${orgData.name}` : 'Sign in to your AutoPilot account'}</p>
        {error && <div className="auth-error">⚠ {error}</div>}
        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input id="login-email" type="email" className="form-input" placeholder="you@company.com"
              value={form.email} onChange={e => set('email', e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="login-password" type="password" className="form-input" placeholder="••••••••"
              value={form.password} onChange={e => set('password', e.target.value)} required />
          </div>
          <button type="submit" id="login-submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="auth-footer">Don&apos;t have an account? <Link to="/register">Start free trial</Link></p>
      </div>
    </div>
  );
}
