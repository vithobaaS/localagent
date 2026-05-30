import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/apiClient';
import { fmt, statusBadge } from '../../utils/helpers';
import { toast } from '../../components/common/ToastContainer';
import { PageHeader, TableCard } from '../../components/common/PageComponents';

export default function TestSuiteListView() {
  const [data, setData] = useState([]); const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(''); const [entries, setEntries] = useState(10); const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null); const [expandedDetail, setExpandedDetail] = useState(null);

  useEffect(() => { api('/api/test-suites').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const toggle = (id) => { if (expanded === id) { setExpanded(null); setExpandedDetail(null); return; } setExpanded(id); setExpandedDetail(null); api(`/api/test-suites/${id}`).then(r => r.json()).then(setExpandedDetail); };
  const remove = (id) => { api(`/api/test-suites/${id}`, { method: 'DELETE' }).then(r => { if (r.ok) { setData(p => p.filter(s => s.id !== id)); toast('success', 'Deleted'); } }); };
  const runSuite = (id, name) => {
    api(`/api/test-suites/${id}/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      .then(r => { if (r.ok) toast('success', 'Suite Queued! 🚀', `"${name}" scheduled for immediate execution.`); else toast('error', 'Failed', 'Could not trigger execution.'); });
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
                  <button className="act-btn view" style={{background:'var(--green-bg)',borderColor:'var(--green)',color:'var(--green)'}} title="Run Now" onClick={() => runSuite(s.id, s.name)}>▶️</button>
                  <button className="act-btn view" onClick={() => toggle(s.id)}>{expanded === s.id ? '▲' : '👁️'}</button>
                  <Link to={`/test-suites/edit/${s.id}`} className="act-btn view" title="Edit">✏️</Link>
                  <button className="act-btn delete" onClick={() => remove(s.id)}>🗑️</button>
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
    </div>
  );
}
