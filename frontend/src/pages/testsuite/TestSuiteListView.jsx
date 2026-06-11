import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/apiClient';
import { fmt, statusBadge } from '../../utils/helpers';
import { toast } from '../../components/common/ToastContainer';
import { PageHeader, TableCard } from '../../components/common/PageComponents';
import { Play, Plug, Eye, ChevronUp, Pencil, Trash2 } from 'lucide-react';

export default function TestSuiteListView() {
  const [data, setData] = useState([]); const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(''); const [entries, setEntries] = useState(10); const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null); const [expandedDetail, setExpandedDetail] = useState(null);
  
  const [envs, setEnvs] = useState([]);
  const [pools, setPools] = useState([]);
  const [runModalSuite, setRunModalSuite] = useState(null);
  const [snippetSuite, setSnippetSuite] = useState(null);
  const [selectedEnvId, setSelectedEnvId] = useState('');
  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [selectedBrowserVersion, setSelectedBrowserVersion] = useState('');

  useEffect(() => { 
    api('/api/test-suites').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false)); 
    api('/api/environments').then(r => r.json()).then(d => setEnvs(d || []));
    api('/api/groups').then(r => r.json()).then(d => setPools(d || []));
  }, []);

  const toggle = (id) => { if (expanded === id) { setExpanded(null); setExpandedDetail(null); return; } setExpanded(id); setExpandedDetail(null); api(`/api/test-suites/${id}`).then(r => r.json()).then(setExpandedDetail); };
  const remove = (id) => { api(`/api/test-suites/${id}`, { method: 'DELETE' }).then(r => { if (r.ok) { setData(p => p.filter(s => s.id !== id)); toast('success', 'Deleted'); } }); };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast('success', 'Copied to clipboard');
  };
  
  const confirmRunSuite = () => {
    if (!runModalSuite) return;
    const reqBody = {};
    if (selectedEnvId) reqBody.environmentId = Number(selectedEnvId);
    if (selectedPoolId) reqBody.targetGroupId = Number(selectedPoolId);
    if (selectedBrowserVersion) reqBody.browserVersion = selectedBrowserVersion;
    
    api(`/api/test-suites/${runModalSuite.id}/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reqBody) })
      .then(r => { 
        if (r.ok) toast('success', 'Suite Queued! 🚀', `"${runModalSuite.name}" scheduled for immediate execution.`); 
        else toast('error', 'Failed', 'Could not trigger execution.'); 
        setRunModalSuite(null);
        setSelectedEnvId('');
        setSelectedPoolId('');
        setSelectedBrowserVersion('');
      });
  };

  const filtered = data.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const paged = filtered.slice(page * entries, (page + 1) * entries);

  return (
    <div className="page-view">
      <PageHeader title="Test Suites" actions={<Link to="/test-suites/create" className="btn btn-primary">➕ New Suite</Link>} />
      <TableCard title="All Test Suites" total={filtered.length} search={search} onSearch={s => { setSearch(s); setPage(0); }} entries={entries} onEntries={n => { setEntries(n); setPage(0); }} page={page} onPage={setPage}>
        <table className="data-table"><thead><tr><th>ID</th><th>Suite Name</th><th>Browser</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>{loading ? <tr className="row-loading"><td colSpan={6}><div className="spinner"/></td></tr>
            : paged.length === 0 ? <tr className="row-empty"><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">📦</div><h3>No suites yet</h3></div></td></tr>
            : paged.map(s => (<>
              <tr key={s.id} className={expanded === s.id ? 'row-expanded' : ''}>
                <td><span className="cell-bold">#{s.id}</span></td><td><span className="cell-bold">{s.name}</span></td>
                <td><span className={`badge ${statusBadge(s.browserType)}`}>{s.browserType}</span></td>
                <td><span className={`badge ${statusBadge(s.status)}`}>{s.status}</span></td>
                <td className="text-muted text-sm">{fmt(s.createdAt)}</td>
                <td><div className="action-row">
                  <button className="act-btn view" style={{background:'var(--green-bg)',borderColor:'var(--green)',color:'var(--green)'}} title="Run Now" onClick={() => setRunModalSuite(s)}><Play size={16} /></button>
                  <button className="act-btn view" title="CI/CD Snippet" onClick={() => setSnippetSuite(s)}><Plug size={16} /></button>
                  <button className="act-btn view" onClick={() => toggle(s.id)}>{expanded === s.id ? <ChevronUp size={16} /> : <Eye size={16} />}</button>
                  <Link to={`/test-suites/edit/${s.id}`} className="act-btn view" title="Edit"><Pencil size={16} /></Link>
                  <button className="act-btn delete" onClick={() => remove(s.id)}><Trash2 size={16} /></button>
                </div></td>
              </tr>
              {expanded === s.id && <tr key={`${s.id}-exp`} className="expand-panel"><td colSpan={6}><div className="expand-panel-inner">
                <div className="expand-panel-title">🗂️ Suite Structure</div>
                {!expandedDetail ? <div className="spinner" /> : (expandedDetail.groups || []).length === 0 ? <p className="text-muted text-sm" style={{fontStyle:'italic'}}>No groups assigned.</p> : (
                  <div className="suite-groups">{expandedDetail.groups.map((gi, idx) => (
                    <div key={idx} className="suite-group-card">
                      <div className="suite-group-head"><div className="suite-group-num">{gi.groupOrder + 1}</div><span className="suite-group-name">{gi.group.name}</span><span className="suite-group-badge">{(gi.testCases || []).length} cases</span></div>
                      {(gi.testCases || []).map((tc, ti) => (<div key={ti} className="suite-case-row"><span className="suite-case-order">{tc.caseOrder + 1}.</span><span className="suite-case-name">{tc.testCase.name}</span><span className="suite-case-steps">{(tc.steps || []).length} steps</span></div>))}
                    </div>
                  ))}</div>
                )}
              </div></td></tr>}
            </>))}</tbody>
        </table>
      </TableCard>

      {/* Run Suite Modal */}
      {runModalSuite && (
        <div className="modal-overlay" onClick={() => setRunModalSuite(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2>🚀 Run Test Suite</h2>
              <button className="modal-close" onClick={() => setRunModalSuite(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p>You are about to run <strong>{runModalSuite.name}</strong>.</p>
              <div>
                <label className="field-label">Target Environment</label>
                <select className="field-input" value={selectedEnvId} onChange={e => setSelectedEnvId(e.target.value)}>
                  <option value="">Default (No Environment)</option>
                  {envs.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <div className="field-hint">Select an environment to inject its scoped variables.</div>
              </div>
              <div>
                <label className="field-label">Agent Pool</label>
                <select className="field-input" value={selectedPoolId} onChange={e => setSelectedPoolId(e.target.value)}>
                  <option value="">Default (Any Available Agent)</option>
                  {pools.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="field-hint">Route this execution to a specific network or OS pool.</div>
              </div>
              <div>
                <label className="field-label">Browser Version (Optional)</label>
                <input type="text" className="field-input" placeholder="e.g. 137" value={selectedBrowserVersion} onChange={e => setSelectedBrowserVersion(e.target.value)} />
                <div className="field-hint">Require a specific major browser version for this run.</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setRunModalSuite(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmRunSuite}>▶️ Run Now</button>
            </div>
          </div>
        </div>
      )}

      {/* CI/CD Snippet Modal */}
      {snippetSuite && (
        <div className="modal-overlay" onClick={() => setSnippetSuite(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2>🔌 CI/CD Trigger Snippet</h2>
              <button className="modal-close" onClick={() => setSnippetSuite(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p>Trigger <strong>{snippetSuite.name}</strong> (ID: {snippetSuite.id}) directly from Jenkins, GitHub Actions, or any CI/CD pipeline using the cURL snippet below.</p>
              <div style={{ background: '#1e1e1e', padding: 16, borderRadius: 8, overflowX: 'auto', border: '1px solid #333' }}>
                <code style={{ color: '#d4d4d4', whiteSpace: 'pre' }}>
                  <span style={{ color: '#569cd6' }}>curl</span> -X POST "http://13.232.42.59/api/v1/suites/{snippetSuite.id}/trigger" \{"\n"}
                  {"     "}-H "Authorization: Bearer <span style={{ color: '#ce9178' }}>$AUTOPILOT_API_KEY</span>"
                </code>
              </div>
              <div className="field-hint">Note: You must generate an API key from Administration &gt; API Keys and store it securely in your CI/CD platform as <code>$AUTOPILOT_API_KEY</code>.</div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => {
                copyToClipboard(`curl -X POST "http://13.232.42.59/api/v1/suites/${snippetSuite.id}/trigger" -H "Authorization: Bearer $AUTOPILOT_API_KEY"`);
                setSnippetSuite(null);
              }}>📋 Copy Snippet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
