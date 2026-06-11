import { useState, useEffect } from 'react';
import { api } from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Card } from '../../components/common/PageComponents';
import { toast } from '../../components/common/ToastContainer';
import { fmt } from '../../utils/helpers';
import { Trash2, Copy, CheckCircle } from 'lucide-react';

export default function SettingsView() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState('org');
  const [users, setUsers] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [tokenLabel, setTokenLabel] = useState('');
  const [copiedPwd, setCopiedPwd] = useState('');
  const [newInvite, setNewInvite] = useState(null); // {email, temporaryPassword}

  const tabStyle = (t) => ({
    background: 'none', border: 'none',
    color: tab === t ? 'var(--brand)' : 'var(--txt-muted)',
    padding: '12px 16px', cursor: 'pointer',
    borderBottom: tab === t ? '2px solid var(--brand)' : '2px solid transparent',
    fontWeight: 500, fontSize: '14px', transition: 'var(--t)'
  });

  const fetchUsers = () => {
    setLoading(true);
    api('/api/auth/users').then(r => r.json()).then(d => { setUsers(d); setLoading(false); }).catch(() => setLoading(false));
  };

  const fetchTokens = () => {
    setLoading(true);
    api('/api/auth/agent-tokens').then(r => r.json()).then(d => { setTokens(d); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'tokens') fetchTokens();
  }, [tab]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      const res = await api('/api/auth/users/invite', { method: 'POST', body: JSON.stringify({ email: inviteEmail, fullName: inviteName }) });
      const data = await res.json();
      if (res.ok) {
        setNewInvite({ email: inviteEmail, temporaryPassword: data.temporaryPassword });
        toast('success', 'User invited successfully');
        setInviteEmail(''); setInviteName('');
        fetchUsers();
      } else {
        toast('error', data.error || 'Failed to invite user');
      }
    } catch { toast('error', 'Network error'); }
  };

  const handleCreateToken = async (e) => {
    e.preventDefault();
    try {
      const res = await api('/api/auth/agent-tokens', { method: 'POST', body: JSON.stringify({ label: tokenLabel || 'New Agent Token' }) });
      if (res.ok) { toast('success', 'Agent token generated'); setTokenLabel(''); fetchTokens(); }
    } catch { toast('error', 'Network error'); }
  };

  const revokeToken = async (id) => {
    if (!window.confirm('Revoke this token? Agents using it will disconnect immediately.')) return;
    const res = await api(`/api/auth/agent-tokens/${id}`, { method: 'DELETE' });
    if (res.ok) { toast('success', 'Token revoked'); setTokens(p => p.filter(t => t.id !== id)); }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedPwd(text);
      setTimeout(() => setCopiedPwd(''), 2000);
    });
  };

  return (
    <div className="page-view">
      <PageHeader title="Organization Settings" />

      <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '4px' }}>
        {['org', 'users', 'tokens'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={tabStyle(t)}>
            {t === 'org' ? 'Organization' : t === 'users' ? 'Team Members' : 'Agent Tokens'}
          </button>
        ))}
      </div>

      {tab === 'org' && (
        <Card title="Organization Overview">
          <div style={{ display: 'grid', gap: '24px', maxWidth: '600px' }}>
            <div>
              <label className="form-label" style={{ color: 'var(--txt-muted)', marginBottom: '6px', display: 'block' }}>Organization ID</label>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--brand)', letterSpacing: '1px' }}>
                {user?.orgPublicId || `#${user?.orgId}`}
              </div>
            </div>
            <div>
              <label className="form-label" style={{ color: 'var(--txt-muted)', marginBottom: '6px', display: 'block' }}>Organization Name</label>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--txt-h)' }}>{user?.orgName}</div>
            </div>
            <div>
              <label className="form-label" style={{ color: 'var(--txt-muted)', marginBottom: '6px', display: 'block' }}>Workspace URL</label>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--brand)' }}>
                {user?.subdomain ? `https://${user.subdomain}.autopilot.qruize.com` : 'https://app.autopilot.qruize.com'}
              </div>
            </div>
            <div>
              <label className="form-label" style={{ color: 'var(--txt-muted)', marginBottom: '6px', display: 'block' }}>Subscription Plan</label>
              <span className="badge" style={{ background: 'var(--green-bg)', color: 'var(--green-txt)', padding: '5px 12px', borderRadius: '6px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 700 }}>
                {user?.plan}
              </span>
            </div>
            {user?.role && (
              <div>
                <label className="form-label" style={{ color: 'var(--txt-muted)', marginBottom: '6px', display: 'block' }}>Your Role</label>
                <span className="badge" style={{ background: user.role === 'admin' ? 'var(--red-bg)' : 'var(--blue-bg)', color: user.role === 'admin' ? 'var(--red-txt)' : 'var(--blue-txt)', padding: '5px 12px', borderRadius: '6px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 700 }}>
                  {user.role}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {tab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>
          <Card title="Team Directory">
            {loading ? (
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1,2,3].map(i => <div key={i} className="skeleton skeleton-row" />)}
              </div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr className="row-empty"><td colSpan={3}><div className="empty-state"><div className="empty-state-icon">👥</div><h3>No team members</h3><p>Invite colleagues to join your organization.</p></div></td></tr>
                  ) : users.map(u => (
                    <tr key={u.id}>
                      <td><span className="cell-bold">{u.fullName || '—'}</span></td>
                      <td>{u.email}</td>
                      <td><span className="badge" style={{ background: u.role === 'admin' ? 'var(--red-bg)' : 'var(--blue-bg)', color: u.role === 'admin' ? 'var(--red-txt)' : 'var(--blue-txt)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{u.role.toUpperCase()}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isAdmin ? (
              <Card title="Invite Team Member">
                <form onSubmit={handleInvite}>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-input" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required placeholder="colleague@company.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Full Name <span style={{ color: 'var(--txt-muted)', fontWeight: 400 }}>(optional)</span></label>
                    <input type="text" className="form-input" value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Jane Doe" />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Send Invitation</button>
                </form>
              </Card>
            ) : (
              <Card title="Invite Team Member">
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--txt-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔒</div>
                  <p style={{ fontSize: '14px', lineHeight: '1.6' }}>Only <strong>administrators</strong> can invite new team members.</p>
                </div>
              </Card>
            )}

            {/* Temp password reveal after invite */}
            {newInvite && (
              <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green)', borderRadius: 'var(--r-lg)', padding: '16px' }}>
                <div style={{ fontWeight: 700, color: 'var(--green-txt)', marginBottom: '8px' }}>✓ User Invited!</div>
                <div style={{ fontSize: '13px', color: 'var(--txt-muted)', marginBottom: '10px' }}>
                  Share this temporary password with <strong>{newInvite.email}</strong>. They must change it on first login.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface)', borderRadius: 'var(--r-md)', padding: '10px 14px', border: '1px solid var(--border)' }}>
                  <code style={{ flex: 1, fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, letterSpacing: '2px', color: 'var(--brand)' }}>
                    {newInvite.temporaryPassword}
                  </code>
                  <button onClick={() => copyToClipboard(newInvite.temporaryPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedPwd === newInvite.temporaryPassword ? 'var(--green)' : 'var(--txt-muted)' }}>
                    {copiedPwd === newInvite.temporaryPassword ? <CheckCircle size={18} /> : <Copy size={18} />}
                  </button>
                </div>
                <button onClick={() => setNewInvite(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-muted)', fontSize: '12px', marginTop: '8px' }}>Dismiss</button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'tokens' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>
          <Card title="Active Agent Tokens">
            {loading ? (
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1,2,3].map(i => <div key={i} className="skeleton skeleton-row" />)}
              </div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Label</th><th>Token (preview)</th><th>Created</th><th>Actions</th></tr></thead>
                <tbody>
                  {tokens.length === 0 ? (
                    <tr className="row-empty"><td colSpan={4}><div className="empty-state"><div className="empty-state-icon">🤖</div><h3>No agent tokens</h3><p>Generate a token to connect your local agents.</p></div></td></tr>
                  ) : tokens.map(t => (
                    <tr key={t.id}>
                      <td><span className="cell-bold">{t.label}</span></td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--txt-muted)' }}>{t.token.substring(0, 12)}…</td>
                      <td className="text-muted text-sm">{fmt(t.createdAt)}</td>
                      <td>
                        <button className="act-btn kill" style={{ color: 'var(--red)' }} onClick={() => revokeToken(t.id)} title="Revoke">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
          <Card title="Generate New Token">
            <form onSubmit={handleCreateToken}>
              <div className="form-group">
                <label className="form-label">Token Label</label>
                <input type="text" className="form-input" value={tokenLabel} onChange={e => setTokenLabel(e.target.value)} placeholder="e.g. CI/CD Server" required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Generate Token</button>
              <p className="text-muted text-sm" style={{ marginTop: '12px', lineHeight: 1.5 }}>
                Tokens grant full execution access. Never commit them to version control.
              </p>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
