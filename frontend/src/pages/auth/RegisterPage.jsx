import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/common/ToastContainer';

const LogoSVG = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="url(#regGrad)" />
    <path d="M20 8L23.5 17H33L25.5 22.5L28 31.5L20 26.5L12 31.5L14.5 22.5L7 17H16.5L20 8Z"
      fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="20" cy="20" r="3" fill="white" />
    <defs>
      <linearGradient id="regGrad" x1="0" y1="0" x2="40" y2="40">
        <stop offset="0%" stopColor="#7c3aed" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
  </svg>
);

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', orgName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed'); setLoading(false); return; }
      localStorage.setItem('ap_token', data.token);
      localStorage.setItem('ap_user', JSON.stringify(data));
      sessionStorage.setItem('ap_show_splash', '1');
      setUser(data);
      toast('success', 'Welcome!', 'Your account has been created.');
      navigate('/dashboard', { replace: true });
      setTimeout(() => window.location.reload(), 50);
    } catch { setError('Network error. Please try again.'); setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <LogoSVG />
          <div className="auth-brand">Auto<span>Pilot</span></div>
        </div>
        <h1 className="auth-title">Start free trial</h1>
        <p className="auth-sub">No credit card required · Cancel anytime</p>
        {error && <div className="auth-error">⚠ {error}</div>}
        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input id="reg-name" type="text" className="form-input" placeholder="Jane Smith"
              value={form.fullName} onChange={e => set('fullName', e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Work Email</label>
            <input id="reg-email" type="email" className="form-input" placeholder="you@company.com"
              value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Organization Name <span style={{ color: 'var(--txt-muted)', fontWeight: 400 }}>(optional)</span></label>
            <input id="reg-org" type="text" className="form-input" placeholder="Your company"
              value={form.orgName} onChange={e => set('orgName', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="reg-password" type="password" className="form-input" placeholder="Min 8 characters"
              value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} />
          </div>
          <button type="submit" id="reg-submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Free Account'}
          </button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
