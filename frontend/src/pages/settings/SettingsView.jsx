import { useState, useEffect } from 'react';
import { api } from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Card } from '../../components/common/PageComponents';
import { toast } from '../../components/common/ToastContainer';
import { fmt } from '../../utils/helpers';

export default function SettingsView() {
  const { user } = useAuth();
  const [tab, setTab] = useState('org');

  const [users, setUsers] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');

  // Token state
  const [tokenLabel, setTokenLabel] = useState('');

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'tokens') fetchTokens();
  }, [tab]);

  const fetchUsers = () => {
    setLoading(true);
    api('/api/auth/users').then(r => r.json()).then(d => { setUsers(d); setLoading(false); }).catch(() => setLoading(false));
  };

  const fetchTokens = () => {
    setLoading(true);
    api('/api/auth/agent-tokens').then(r => r.json()).then(d => { setTokens(d); setLoading(false); }).catch(() => setLoading(false));
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      const res = await api('/api/auth/users/invite', { method: 'POST', body: JSON.stringify({ email: inviteEmail, fullName: inviteName }) });
      if (res.ok) {
        toast('success', 'User invited successfully');
        setInviteEmail(''); setInviteName('');
        fetchUsers();
      } else {
        const data = await res.json();
        toast('error', data.error || 'Failed to invite user');
      }
    } catch { toast('error', 'Network error'); }
  };

  const handleCreateToken = async (e) => {
    e.preventDefault();
    try {
      const res = await api('/api/auth/agent-tokens', { method: 'POST', body: JSON.stringify({ label: tokenLabel || 'New Agent Token' }) });
      if (res.ok) {
        toast('success', 'Agent token generated');
        setTokenLabel('');
        fetchTokens();
      }
    } catch { toast('error', 'Network error'); }
  };

  const revokeToken = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this token? Agents using it will instantly disconnect.')) return;
    const res = await api(`/api/auth/agent-tokens/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast('success', 'Token revoked');
      setTokens(p => p.filter(t => t.id !== id));
    }
  };

  return (
    <div className="page-view">
      <PageHeader title="Organization Settings" />
      
      <div className="tabs" style={{ marginBottom: '24px', borderBottom: '1px solid #334155', display: 'flex', gap: '16px' }}>
        <button className={`tab-btn ${tab === 'org' ? 'active' : ''}`} onClick={() => setTab('org')} style={{ background: 'none', border: 'none', color: tab === 'org' ? '#3b82f6' : '#94a3b8', padding: '12px 16px', cursor: 'pointer', borderBottom: tab === 'org' ? '2px solid #3b82f6' : '2px solid transparent', fontWeight: 500 }}>Organization Profile</button>
        <button className={`tab-btn ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')} style={{ background: 'none', border: 'none', color: tab === 'users' ? '#3b82f6' : '#94a3b8', padding: '12px 16px', cursor: 'pointer', borderBottom: tab === 'users' ? '2px solid #3b82f6' : '2px solid transparent', fontWeight: 500 }}>Team Members</button>
        <button className={`tab-btn ${tab === 'tokens' ? 'active' : ''}`} onClick={() => setTab('tokens')} style={{ background: 'none', border: 'none', color: tab === 'tokens' ? '#3b82f6' : '#94a3b8', padding: '12px 16px', cursor: 'pointer', borderBottom: tab === 'tokens' ? '2px solid #3b82f6' : '2px solid transparent', fontWeight: 500 }}>Agent API Tokens</button>
      </div>

      {tab === 'org' && (
        <Card title="Organization Overview">
          <div style={{ display: 'grid', gap: '20px', maxWidth: '600px' }}>
            <div><label className="form-label text-muted">Organization ID</label><div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>#{user?.orgId}</div></div>
            <div><label className="form-label text-muted">Organization Name</label><div style={{ fontSize: '1.2rem' }}>{user?.orgName}</div></div>
            <div>
              <label className="form-label text-muted">Subscription Plan</label>
              <div><span className="badge" style={{ background: '#22c55e20', color: '#4ade80', padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600 }}>{user?.plan}</span></div>
            </div>
          </div>
        </Card>
      )}

      {tab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
          <Card title="Team Directory">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={3}>Loading...</td></tr> : users.map(u => (
                  <tr key={u.id}>
                    <td><span className="cell-bold">{u.fullName || '—'}</span></td>
                    <td>{u.email}</td>
                    <td><span className="badge" style={{ background: u.role === 'admin' ? '#ef444420' : '#3b82f620', color: u.role === 'admin' ? '#f87171' : '#60a5fa', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>{u.role.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card title="Invite Team Member">
            <form onSubmit={handleInvite}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required placeholder="colleague@company.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Send Invitation</button>
            </form>
          </Card>
        </div>
      )}

      {tab === 'tokens' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
          <Card title="Active Agent Tokens">
            <table className="data-table">
              <thead><tr><th>Label</th><th>Token</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={4}>Loading...</td></tr> : tokens.map(t => (
                  <tr key={t.id}>
                    <td><span className="cell-bold">{t.label}</span></td>
                    <td style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{t.token.substring(0, 10)}...</td>
                    <td className="text-muted text-sm">{fmt(t.createdAt)}</td>
                    <td><button className="act-btn delete" onClick={() => revokeToken(t.id)}>🗑️ Revoke</button></td>
                  </tr>
                ))}
                {tokens.length === 0 && !loading && <tr><td colSpan={4}>No tokens generated.</td></tr>}
              </tbody>
            </table>
          </Card>
          <Card title="Generate New Token">
            <form onSubmit={handleCreateToken}>
              <div className="form-group">
                <label className="form-label">Token Label</label>
                <input type="text" className="form-input" value={tokenLabel} onChange={e => setTokenLabel(e.target.value)} placeholder="e.g. CI/CD Server" required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Generate Token</button>
              <p className="text-muted text-sm" style={{ marginTop: '12px', lineHeight: 1.5 }}>
                Tokens grant full execution access to your organization. Never commit them to version control.
              </p>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
