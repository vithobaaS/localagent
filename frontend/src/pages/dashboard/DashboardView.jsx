import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { fmt, fmtShort, statusBadge } from '../../utils/helpers';
import { toast } from '../../components/common/ToastContainer';

/* ───────────────────────────────────────
   LOCAL REUSABLE COMPONENTS
─────────────────────────────────────── */
function PageHeader({ title, crumb, actions }) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        <h1>{title}</h1>
        <div className="breadcrumbs"><Link to="/dashboard">Home</Link><span className="sep">›</span><span>{crumb || title}</span></div>
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}

function TableCard({ title, headerRight, search, onSearch, entries, onEntries, children, total, page, onPage }) {
  return (
    <div className="card">
      <div className="card-header">
        <div><h2>{title}</h2>{total !== undefined && <p>{total} record{total !== 1 ? 's' : ''} found</p>}</div>
        {headerRight}
      </div>
      <div className="table-toolbar">
        <div className="toolbar-left">
          <div className="entries-select-wrap">
            Show <select value={entries} onChange={e => onEntries(+e.target.value)}>{[10,25,50].map(n => <option key={n} value={n}>{n}</option>)}</select> entries
          </div>
        </div>
        <div className="toolbar-right">
          {onSearch !== undefined && (
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Search…" value={search} onChange={e => onSearch(e.target.value)} />
            </div>
          )}
        </div>
      </div>
      <div className="table-responsive">{children}</div>
      {onPage && (
        <div className="table-footer">
          <span className="pag-info">Showing {Math.min(total, entries)} of {total}</span>
          <div className="pag-btns">
            <button className="pag-btn" disabled={page === 0} onClick={() => onPage(page - 1)}>‹ Prev</button>
            <button className="pag-btn active">{page + 1}</button>
            <button className="pag-btn" disabled={(page + 1) * entries >= total} onClick={() => onPage(page + 1)}>Next ›</button>
          </div>
        </div>
      )}
    </div>
  );
}

function DonutChart({ data, size = 180 }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  if (total === 0) return <div className="chart-empty">No data yet</div>;
  const r = 70, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox="0 0 200 200">
        {data.map((d, i) => {
          const pct = d.value / total;
          const dash = pct * c;
          const gap = c - dash;
          const o = offset;
          offset += dash;
          return <circle key={i} cx="100" cy="100" r={r} fill="none" stroke={d.color} strokeWidth="22"
            strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-o}
            style={{ transition: 'stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease' }} />;
        })}
        <text x="100" y="94" textAnchor="middle" fill="var(--txt-h)" fontSize="28" fontWeight="800" fontFamily="'Plus Jakarta Sans'">{total}</text>
        <text x="100" y="116" textAnchor="middle" fill="var(--txt-muted)" fontSize="11" fontWeight="500">Total Runs</text>
      </svg>
      <div className="donut-legend">
        {data.map((d, i) => (
          <div key={i} className="legend-item">
            <span className="legend-dot" style={{ background: d.color }} />
            <span className="legend-label">{d.label}</span>
            <span className="legend-val">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="bar-chart">
      {data.map((d, i) => (
        <div key={i} className="bar-col">
          <div className="bar-value">{d.value}</div>
          <div className="bar-track">
            <div className="bar-fill" style={{ height: `${(d.value / max) * 100}%`, background: d.value > 0 ? 'var(--brand)' : 'var(--border)', animationDelay: `${i * 0.05}s` }} />
          </div>
          <div className="bar-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────────────────────
   DASHBOARD VIEW
─────────────────────────────────────── */
export default function DashboardView({ onSelectExec }) {
  const [execs, setExecs] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(0);
  const { user, setShowOnboarding } = useAuth();

  useEffect(() => {
    Promise.all([
      api('/api/executions').then(r => r.json()),
      api('/api/agents').then(r => r.json())
    ]).then(([dExecs, dAgents]) => {
      setExecs(dExecs || []);
      setAgents(dAgents || []);
      setLoading(false);
      if ((dAgents || []).length === 0 && user && !localStorage.getItem(`onboarding_dismissed_${user.email}`)) {
        setShowOnboarding(true);
      }
    }).catch(() => setLoading(false));
  }, []);

  const getName = (e) => { try { return JSON.parse(e.environmentJson || '{}').referenceId || `Run #${e.orgExecutionId || e.id}`; } catch { return `Run #${e.orgExecutionId || e.id}`; } };
  const getBrowser = (e) => { try { return (JSON.parse(e.environmentJson || '{}').browserTypeName || 'chrome').toLowerCase(); } catch { return 'chrome'; } };

  const stopExecution = async (id) => {
    if (!window.confirm("Are you sure you want to stop this execution?")) return;
    try {
      const res = await api(`/api/executions/${id}/stop`, { method: 'POST' });
      if (res.ok) {
        setExecs(execs.map(e => e.id === id ? { ...e, status: 'aborted' } : e));
        toast('success', 'Stopped', 'Execution stopped successfully.');
      } else {
        toast('error', 'Error', 'Failed to stop execution.');
      }
    } catch {
      toast('error', 'Error', 'Error connecting to server.');
    }
  };

  const rerunExecution = async (id) => {
    try {
      const res = await api(`/api/executions/${id}/rerun`, { method: 'POST' });
      if (res.ok) {
        toast('success', 'Success', 'Re-run triggered successfully.');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast('error', 'Error', 'Failed to re-run execution.');
      }
    } catch {
      toast('error', 'Error', 'Error connecting to server.');
    }
  };

  const filtered = execs.filter(e => { const q = search.toLowerCase(); return getName(e).toLowerCase().includes(q) || e.status.toLowerCase().includes(q) || String(e.id).includes(q); });
  const paged = filtered.slice(page * entries, (page + 1) * entries);

  const total = execs.length;
  const passed = execs.filter(e => e.status?.toLowerCase() === 'success' || e.status?.toLowerCase() === 'completed').length;
  const failed = execs.filter(e => e.status?.toLowerCase() === 'failed').length;
  const running = execs.filter(e => e.status?.toLowerCase() === 'running').length;

  const donutData = [
    { label: 'Passed', value: passed, color: '#059669' },
    { label: 'Failed', value: failed, color: '#dc2626' },
    { label: 'Running', value: running, color: '#7c3aed' },
    { label: 'Other', value: total - passed - failed - running, color: '#d1d5db' },
  ].filter(d => d.value > 0);

  const barData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const count = execs.filter(e => e.createdAt && e.createdAt.slice(0, 10) === key).length;
      days.push({ label, value: count });
    }
    return days;
  }, [execs]);

  return (
    <div className="page-view">
      <PageHeader title="Dashboard" crumb="Overview" />

      <div className="stats-grid">
        {[
          { label: 'Total Runs', val: total, icon: '🚀', cls: 'blue', trend: 'neu', t: 'All time' },
          { label: 'Passed', val: passed, icon: '✅', cls: 'green', trend: 'up', t: `${total ? Math.round(passed / total * 100) : 0}% pass rate` },
          { label: 'Failed', val: failed, icon: '❌', cls: 'yellow', trend: failed > 0 ? 'down' : 'neu', t: failed > 0 ? 'Needs attention' : 'All clear' },
          { label: 'Running', val: running, icon: '⚡', cls: 'purple', trend: 'neu', t: 'In progress' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
            <div className="stat-body">
              <div className="stat-value">{s.val}</div>
              <div className="stat-label">{s.label}</div>
              <div className={`stat-trend ${s.trend}`}>{s.t}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="card chart-card">
          <div className="card-header"><h2>📊 Pass / Fail Distribution</h2></div>
          <div className="chart-body">
            <DonutChart data={donutData} />
          </div>
        </div>
        <div className="card chart-card">
          <div className="card-header"><h2>📈 Executions — Last 7 Days</h2></div>
          <div className="chart-body">
            <BarChart data={barData} />
          </div>
        </div>
      </div>

      <TableCard title="Recent Test Executions" total={filtered.length}
        search={search} onSearch={s => { setSearch(s); setPage(0); }}
        entries={entries} onEntries={n => { setEntries(n); setPage(0); }}
        page={page} onPage={setPage}
        headerRight={<button className="btn btn-ghost btn-sm" onClick={() => window.print()}>⬇️ Export</button>}>
        <table className="data-table">
          <thead><tr><th>#</th><th>Test Suite Name</th><th>Browser</th><th>Started</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr className="row-loading"><td colSpan={6}><div className="spinner" /></td></tr>
            : paged.length === 0 ? <tr className="row-empty"><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">📭</div><h3>No executions found</h3><p>Run a test suite to see results here.</p></div></td></tr>
            : paged.map(e => (
              <tr key={e.id}>
                <td><span className="cell-bold">#{e.orgExecutionId || e.id}</span></td>
                <td><span className="cell-bold">{getName(e)}</span></td>
                <td><span className={`badge ${statusBadge(getBrowser(e))}`}>{getBrowser(e)}</span></td>
                <td><span className="text-muted text-sm">{fmt(e.createdAt)}</span></td>
                <td><span className={`badge ${statusBadge(e.status)}`}>{e.status}</span></td>
                <td>
                  <div className="action-row">
                    {(e.status === 'running' || e.status === 'queued') && (
                      <button className="act-btn kill" title="Stop Execution" style={{color: '#dc2626'}} onClick={() => stopExecution(e.id)}>🛑</button>
                    )}
                    {(e.status !== 'running' && e.status !== 'queued') && (
                      <button className="act-btn view" title="Re-run Execution" style={{color: '#059669'}} onClick={() => rerunExecution(e.id)}>▶️</button>
                    )}
                    <button className="act-btn view" title="View Report" onClick={() => onSelectExec(e.id)}>👁️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}
