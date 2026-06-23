import { useState, useEffect } from 'react';
import { getUser } from '../../api/apiClient';
import { toast } from '../common/ToastContainer';
import { Lock } from 'lucide-react';

export function SessionExpiredModal() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const user = getUser();

  useEffect(() => {
    const handleExpired = () => setOpen(true);
    window.addEventListener('ap_session_expired', handleExpired);
    return () => window.removeEventListener('ap_session_expired', handleExpired);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    
    try {
      // Direct fetch to bypass the interceptor and avoid another 401 loop
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, password })
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('ap_token', data.token);
        localStorage.setItem('ap_user', JSON.stringify({ id: data.id, name: data.name, email: data.email, role: data.role }));
        setOpen(false);
        setPassword('');
        toast('success', 'Session Refreshed', 'You are logged in again.');
      } else {
        toast('error', 'Invalid password', 'Please try again.');
      }
    } catch {
      toast('error', 'Network error', 'Could not connect to the server.');
    }
    setLoading(false);
  };

  const forceLogout = () => {
    localStorage.removeItem('ap_token');
    localStorage.removeItem('ap_user');
    window.location.href = '/login';
  };

  if (!open || !user) return null;

  return (
    <div className="modal-backdrop" style={{ zIndex: 99999 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(124,58,237,0.1)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Lock size={24} />
          </div>
          <h2 style={{ marginBottom: '8px' }}>Session Expired</h2>
          <p className="text-muted" style={{ lineHeight: 1.5, fontSize: '0.9rem' }}>
            Your security token has expired. Please enter your password to continue working without losing your unsaved changes.
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={user.email} disabled style={{ opacity: 0.7 }} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required 
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={forceLogout}>
              Sign Out
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Verifying...' : 'Unlock Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
