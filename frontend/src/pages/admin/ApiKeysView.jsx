import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/apiClient';
import { toast } from '../../components/common/ToastContainer';
import { Trash2 } from 'lucide-react';
import { fmt } from '../../utils/helpers';

export default function ApiKeysView() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '' });
  const [newKey, setNewKey] = useState(null);

  const load = () => {
    setLoading(true);
    api('/api/apikeys').then(r => r.json()).then(d => { setKeys(d || []); setLoading(false); });
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm({ name: '' }); setNewKey(null); setShowForm(true); };

  const save = async () => {
    if (!form.name.trim()) { toast('error', 'Validation', 'Key name is required.'); return; }
    const r = await api('/api/apikeys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (r.ok) { 
      const data = await r.json();
      toast('success', 'Created', `API Key "${form.name}" generated.`); 
      setNewKey(data.token);
      setShowForm(false);
      load(); 
    }
    else { toast('error', 'Error', 'Failed to generate API key.'); }
  };

  const del = async (id, name) => {
    if (!window.confirm(`Revoke API Key "${name}"? Any systems using this key will immediately stop working.`)) return;
    await api(`/api/apikeys/${id}`, { method: 'DELETE' });
    toast('success', 'Revoked', `"${name}" removed.`); load();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast('success', 'Copied to clipboard');
  };

  return (
    <div className="page-view">
      <div className="page-header">
        <div className="page-header-left">
          <h1>API Keys</h1>
          <div className="breadcrumbs"><Link to="/dashboard">Home</Link><span className="sep">›</span><span>API Keys</span></div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={openCreate}>＋ Generate Key</button>
        </div>
      </div>

      {newKey && (
        <div className="card" style={{ marginBottom: 24, border: '1px solid var(--brand)', background: 'rgba(139, 92, 246, 0.05)' }}>
          <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <div>
              <h2 style={{ color: 'var(--brand)' }}>🎉 Key Generated Successfully!</h2>
              <p>Please copy your API key now. For security reasons, <strong>it will never be shown again</strong>.</p>
            </div>
          </div>
          <div style={{ padding: '0 24px 24px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--bg-body)', padding: '16px', borderRadius: 8, border: '1px solid var(--border)' }}>
              <code style={{ flex: 1, fontSize: '1.2rem', color: 'var(--txt-h)', wordBreak: 'break-all' }}>{newKey}</code>
              <button className="btn btn-ghost" onClick={() => copyToClipboard(newKey)}>📋 Copy</button>
            </div>

            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: 8, color: 'var(--txt-muted)' }}>CI/CD Pipeline Example (cURL)</h3>
              <div style={{ background: '#1e1e1e', padding: 16, borderRadius: 8, overflowX: 'auto', border: '1px solid #333' }}>
                <code style={{ color: '#d4d4d4', whiteSpace: 'pre' }}>
                  <span style={{ color: '#569cd6' }}>curl</span> -X POST "http://13.232.42.59/api/v1/suites/&lt;SUITE_ID&gt;/trigger" \{"\n"}
                  {"     "}-H "Authorization: Bearer <span style={{ color: '#ce9178' }}>{newKey}</span>"
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div><h2>🔑 Active Tokens</h2><p>Manage access tokens for CI/CD pipelines and external integrations.</p></div>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Token Prefix</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={4}><div className="spinner" /></td></tr>
              : keys.length === 0 ? <tr><td colSpan={4}><div className="empty-state"><div className="empty-state-icon">🔑</div><h3>No API keys</h3><p>Generate an API key to connect your CI/CD pipelines.</p></div></td></tr>
              : keys.map(k => (
                <tr key={k.id}>
                  <td><span className="cell-bold">{k.name}</span></td>
                  <td><code style={{ color: 'var(--brand)', fontWeight: 700 }}>ap_live_••••••••••••••••••••</code></td>
                  <td><span className="text-muted text-sm">{fmt(k.createdAt)}</span></td>
                  <td>
                    <div className="action-row">
                      <button className="act-btn kill" style={{ color: '#dc2626' }} onClick={() => del(k.id, k.name)} title="Revoke"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setNewKey(null); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2>＋ Generate New API Key</h2>
              <button className="modal-close" onClick={() => { setShowForm(false); setNewKey(null); }}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="field-label">Token Name *</label>
                <input className="field-input" placeholder="e.g. Jenkins Production Server" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>A descriptive name to help you identify this token later.</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setShowForm(false); setNewKey(null); }}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>🚀 Generate Token</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
