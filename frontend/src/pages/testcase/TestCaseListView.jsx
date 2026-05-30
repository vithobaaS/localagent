import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/apiClient';
import { fmt, statusBadge } from '../../utils/helpers';
import { toast } from '../../components/common/ToastContainer';
import { PageHeader, TableCard } from '../../components/common/PageComponents';

export default function TestCaseListView() {
  const [data, setData] = useState([]); const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(''); const [entries, setEntries] = useState(10); const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null); const [expandedSteps, setExpandedSteps] = useState([]);

  useEffect(() => { api('/api/test-cases').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const toggle = (id) => { if (expanded === id) { setExpanded(null); return; } setExpanded(id); api(`/api/test-cases/${id}`).then(r => r.json()).then(d => setExpandedSteps(d.steps || [])); };
  const remove = (id) => { api(`/api/test-cases/${id}`, { method: 'DELETE' }).then(r => { if (r.ok) { setData(p => p.filter(t => t.id !== id)); toast('success', 'Deleted'); } }); };

  const filtered = data.filter(t => { const q = search.toLowerCase(); return t.name.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q); });
  const paged = filtered.slice(page * entries, (page + 1) * entries);

  return (
    <div className="page-view">
      <PageHeader title="Test Cases" actions={<Link to="/test-cases/create" className="btn btn-primary">➕ New Test Case</Link>} />
      <TableCard title="Test Case Library" total={filtered.length} search={search} onSearch={s => { setSearch(s); setPage(0); }} entries={entries} onEntries={n => { setEntries(n); setPage(0); }} page={page} onPage={setPage}>
        <table className="data-table"><thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>{loading ? <tr className="row-loading"><td colSpan={6}><div className="spinner"/></td></tr>
            : paged.length === 0 ? <tr className="row-empty"><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">📝</div><h3>No test cases yet</h3><p><Link to="/test-cases/create" style={{color:'var(--brand)'}}>Create one</Link></p></div></td></tr>
            : paged.map(t => (<>
              <tr key={t.id} className={expanded === t.id ? 'row-expanded' : ''}>
                <td><span className="cell-bold">#{t.id}</span></td><td><span className="cell-bold">{t.name}</span></td><td className="text-muted text-sm">{t.description || '—'}</td>
                <td><span className={`badge ${statusBadge(t.status)}`}>{t.status}</span></td><td className="text-muted text-sm">{fmt(t.createdAt)}</td>
                <td><div className="action-row">
                  <button className="act-btn view" onClick={() => toggle(t.id)}>{expanded === t.id ? '▲' : '👁️'}</button>
                  <Link to={`/test-cases/edit/${t.id}`} className="act-btn view" title="Edit">✏️</Link>
                  <button className="act-btn delete" onClick={() => remove(t.id)}>🗑️</button>
                </div></td>
              </tr>
              {expanded === t.id && <tr key={`${t.id}-exp`} className="expand-panel"><td colSpan={6}><div className="expand-panel-inner">
                <div className="expand-panel-title">🔬 Test Steps ({expandedSteps.length})</div>
                {expandedSteps.length === 0 ? <p className="text-muted text-sm" style={{fontStyle:'italic'}}>No steps defined.</p> : (
                  <div className="nested-table"><table className="data-table"><thead><tr><th>#</th><th>Action</th><th>Locator</th><th>Value</th><th>Data</th><th>Description</th></tr></thead>
                    <tbody>{expandedSteps.map(s => (<tr key={s.id}><td className="cell-bold">{s.stepOrder}</td><td><span className="action-tag">{s.actionName}</span></td><td><span className="badge badge-neutral">{s.locatorType || '—'}</span></td><td><code style={{fontSize:'11px',background:'var(--bg)',padding:'2px 6px',borderRadius:'4px',color:'var(--brand)'}}>{s.locatorValue || '—'}</code></td><td className="text-sm">{s.testData || '—'}</td><td className="text-muted text-sm">{s.description || '—'}</td></tr>))}</tbody>
                  </table></div>
                )}
              </div></td></tr>}
            </>))}</tbody>
        </table>
      </TableCard>
    </div>
  );
}
