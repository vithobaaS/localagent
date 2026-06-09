import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/common/ToastContainer';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
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
      navigate('/dashboard', { replace: true });
      setTimeout(() => window.location.reload(), 50);
    } catch { setError('Network error. Please try again.'); setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon">⚡</div>
          <div className="auth-brand">{orgData ? orgData.name : <>Auto<span>Propel</span></>}</div>
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">{orgData ? `Sign in to your ${orgData.name} workspace` : 'Sign in to your AutoPropel account'}</p>
        {error && <div className="auth-error">⚠️ {error}</div>}
        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input id="login-email" type="email" className="form-input" placeholder="you@company.com"
              value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="login-password" type="password" className="form-input" placeholder="••••••••"
              value={form.password} onChange={e => set('password', e.target.value)} required />
          </div>
          <button type="submit" id="login-submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? '⏳ Signing in…' : '🚀 Sign In'}
          </button>
        </form>
        <p className="auth-footer">Don't have an account? <Link to="/register">Start free trial</Link></p>
      </div>
    </div>
  );
}
