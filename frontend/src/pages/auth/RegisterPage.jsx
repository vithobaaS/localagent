import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/common/ToastContainer';

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
      setUser(data);
      toast('success', 'Welcome!', 'Your account has been created.');
      navigate('/dashboard', { replace: true });
      setTimeout(() => window.location.reload(), 500);
    } catch { setError('Network error. Please try again.'); setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon">⚡</div>
          <div className="auth-brand">Auto<span>Propel</span></div>
        </div>
        <h1 className="auth-title">Start your free trial</h1>
        <p className="auth-sub">No credit card required • Cancel anytime</p>
        {error && <div className="auth-error">⚠️ {error}</div>}
        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input id="reg-name" type="text" className="form-input" placeholder="Jane Smith"
              value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Work Email</label>
            <input id="reg-email" type="email" className="form-input" placeholder="you@company.com"
              value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Organisation Name</label>
            <input id="reg-org" type="text" className="form-input" placeholder="Your company"
              value={form.orgName} onChange={e => set('orgName', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="reg-password" type="password" className="form-input" placeholder="Min 8 characters"
              value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} />
          </div>
          <button type="submit" id="reg-submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? '⏳ Creating account…' : '✨ Create Free Account'}
          </button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
