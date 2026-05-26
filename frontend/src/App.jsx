import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import './App.css';

/* ═══════════════════════════════════════════════════════
   TOAST SYSTEM
═══════════════════════════════════════════════════════ */
let _toastId = 0;
let _setToasts = null;

function toast(type, title, msg) {
  if (!_setToasts) return;
  const id = ++_toastId;
  _setToasts(p => [...p, { id, type, title, msg }]);
  setTimeout(() => _setToasts(p => p.map(t => t.id === id ? { ...t, hide: true } : t)), 3200);
  setTimeout(() => _setToasts(p => p.filter(t => t.id !== id)), 3600);
}

function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  _setToasts = setToasts;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}${t.hide ? ' hide' : ''}`}>
          <div className="toast-icon">{icons[t.type]}</div>
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            {t.msg && <div className="toast-msg">{t.msg}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SHARED UTILITIES
═══════════════════════════════════════════════════════ */
const fmt = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
};

const statusBadge = (s) => {
  const map = {
    active: 'badge-success', inactive: 'badge-danger',
    success: 'badge-success', failed: 'badge-danger', running: 'badge-purple',
    queued: 'badge-neutral', assigned: 'badge-info',
    now: 'badge-info', scheduled: 'badge-warning',
    chrome: 'badge-info', firefox: 'badge-warning', edge: 'badge-purple',
  };
  return map[(s || '').toLowerCase()] || 'badge-neutral';
};

/* ═══════════════════════════════════════════════════════
   SIDEBAR NAV ITEM (uses React Router Link)
═══════════════════════════════════════════════════════ */
function NavItem({ to, icon, label, active }) {
  return (
    <Link to={to} className={`nav-item${active ? ' active' : ''}`}>
      <span className="nav-icon-wrap">{icon}</span>
      {label}
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════
   APP SHELL
═══════════════════════════════════════════════════════ */
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [execId, setExecId] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const location = useLocation();
  const path = location.pathname;
  const is = (p) => path === p;

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="logo">
              <div className="logo-icon">⚡</div>
              <div className="logo-text">Auto<span>Propel</span></div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section">Overview</div>
            <NavItem to="/dashboard"            icon="📊" label="Dashboard"         active={is('/dashboard')} />

            <div className="nav-section">Scheduler</div>
            <NavItem to="/scheduler/create"     icon="➕" label="Create Scheduler"  active={is('/scheduler/create')} />
            <NavItem to="/scheduler"            icon="📅" label="All Schedulers"    active={is('/scheduler')} />

            <div className="nav-section">Test Suite</div>
            <NavItem to="/test-suites/create"   icon="🗂️" label="Create Suite"      active={is('/test-suites/create')} />
            <NavItem to="/test-suites"          icon="📦" label="Suite List"         active={is('/test-suites')} />

            <div className="nav-section">Test Case Group</div>
            <NavItem to="/test-case-groups/create" icon="📁" label="Create Group"   active={is('/test-case-groups/create')} />
            <NavItem to="/test-case-groups"     icon="📂" label="Group List"         active={is('/test-case-groups')} />

            <div className="nav-section">Test Case</div>
            <NavItem to="/test-cases/create"    icon="📝" label="Create Test Case"  active={is('/test-cases/create')} />
            <NavItem to="/test-cases"           icon="🔍" label="Test Case List"     active={is('/test-cases')} />

            <div className="nav-section">Agents</div>
            <NavItem to="/groups/create"        icon="👥" label="Create Group"      active={is('/groups/create')} />
            <NavItem to="/groups"               icon="🖥️" label="Agent Groups"      active={is('/groups')} />
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-footer-inner">
              <div className="footer-dot" />
              <div className="footer-text">
                <p>AutoPropel Cloud</p>
                <span>v1.0 Beta — All systems operational</span>
              </div>
            </div>
          </div>
        </aside>
      )}

      <main className="main-content">
        <header className="top-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(o => !o)}>☰</button>
          <div className="header-right">
            <button className="header-icon-btn">
              <span>✉️</span>
              <span className="header-badge">4</span>
            </button>
            <button className="header-icon-btn">
              <span>🔔</span>
              <span className="header-badge warn">10</span>
            </button>
            <div className="header-divider" />
            <div className="header-avatar">
              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80" alt="User" />
            </div>
          </div>
        </header>

        <div className="page-container">
          <Routes>
            <Route path="/"                        element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"               element={<DashboardView onSelectExec={setExecId} />} />
            <Route path="/scheduler"               element={<SchedulerListView />} />
            <Route path="/scheduler/create"        element={<CreateSchedulerView />} />
            <Route path="/groups"                  element={<GroupsListView />} />
            <Route path="/groups/create"           element={<CreateGroupView />} />
            <Route path="/test-cases"              element={<TestCaseListView />} />
            <Route path="/test-cases/create"       element={<CreateTestCaseView />} />
            <Route path="/test-case-groups"        element={<TestCaseGroupListView />} />
            <Route path="/test-case-groups/create" element={<CreateTestCaseGroupView />} />
            <Route path="/test-suites"             element={<TestSuiteListView />} />
            <Route path="/test-suites/create"      element={<CreateTestSuiteView />} />
            <Route path="*"                        element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>

      {execId && <ReportModal execId={execId} onClose={() => setExecId(null)} onLightbox={setLightbox} />}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <div className="lightbox-close" onClick={() => setLightbox(null)}>✕</div>
          <img src={lightbox} className="lightbox-img" alt="Screenshot" />
        </div>
      )}
      <ToastContainer />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   REUSABLE: PAGE HEADER
═══════════════════════════════════════════════════════ */
function PageHeader({ title, crumb, actions }) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        <h1>{title}</h1>
        <div className="breadcrumbs">
          <Link to="/dashboard">Home</Link>
          <span className="sep">›</span>
          <span>{crumb || title}</span>
        </div>
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   REUSABLE: TABLE WRAPPER
═══════════════════════════════════════════════════════ */
function TableCard({ title, headerRight, search, onSearch, entries, onEntries, children, total, page, onPage }) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>{title}</h2>
          {total !== undefined && <p>{total} record{total !== 1 ? 's' : ''} found</p>}
        </div>
        {headerRight}
      </div>
      <div className="table-toolbar">
        <div className="toolbar-left">
          <div className="entries-select-wrap">
            Show
            <select value={entries} onChange={e => onEntries(+e.target.value)}>
              {[10,25,50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            entries
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
          <span className="pag-info">Showing {Math.min(total, entries)} of {total} entries</span>
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

/* ═══════════════════════════════════════════════════════
   VIEW: DASHBOARD
═══════════════════════════════════════════════════════ */
function DashboardView({ onSelectExec }) {
  const [execs, setExecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetch('/api/executions').then(r => r.json()).then(d => { setExecs(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const getName = (e) => {
    try { const p = JSON.parse(e.environmentJson || '{}'); return p.referenceId || `Run #${e.id}`; } catch { return `Run #${e.id}`; }
  };
  const getBrowser = (e) => {
    try { const p = JSON.parse(e.environmentJson || '{}'); return (p.browserTypeName || 'chrome').toLowerCase(); } catch { return 'chrome'; }
  };

  const filtered = execs.filter(e => {
    const q = search.toLowerCase();
    return getName(e).toLowerCase().includes(q) || e.status.toLowerCase().includes(q) || String(e.id).includes(q);
  });
  const paged = filtered.slice(page * entries, (page + 1) * entries);

  const total  = execs.length;
  const passed = execs.filter(e => e.status?.toLowerCase() === 'success').length;
  const failed = execs.filter(e => e.status?.toLowerCase() === 'failed').length;
  const running= execs.filter(e => e.status?.toLowerCase() === 'running').length;

  return (
    <div className="page-view">
      <PageHeader title="Dashboard" crumb="Overview" />

      <div className="stats-grid">
        {[
          { label: 'Total Runs',    val: total,  icon: '🚀', cls: 'blue',   trend: 'neu', t: 'All time' },
          { label: 'Passed',        val: passed, icon: '✅', cls: 'green',  trend: 'up',  t: `${total ? Math.round(passed/total*100) : 0}% pass rate` },
          { label: 'Failed',        val: failed, icon: '❌', cls: 'yellow', trend: failed > 0 ? 'down' : 'neu', t: failed > 0 ? 'Needs attention' : 'All clear' },
          { label: 'Running',       val: running,icon: '⚡', cls: 'purple', trend: 'neu', t: 'In progress' },
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

      <TableCard
        title="Recent Test Executions"
        total={filtered.length}
        search={search} onSearch={s => { setSearch(s); setPage(0); }}
        entries={entries} onEntries={n => { setEntries(n); setPage(0); }}
        page={page} onPage={setPage}
        headerRight={<button className="btn btn-ghost btn-sm" onClick={() => window.print()}>⬇️ Export</button>}
      >
        <table className="data-table">
          <thead><tr>
            <th>#</th><th>Test Suite Name</th><th>Browser</th><th>Started</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr className="row-loading"><td colSpan={6}><div className="spinner" /></td></tr>
            ) : paged.length === 0 ? (
              <tr className="row-empty"><td colSpan={6}>
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <h3>No executions found</h3>
                  <p>Run a test suite to see results here.</p>
                </div>
              </td></tr>
            ) : paged.map(e => (
              <tr key={e.id}>
                <td><span className="cell-bold">#{e.id}</span></td>
                <td><span className="cell-bold">{getName(e)}</span></td>
                <td><span className={`badge ${statusBadge(getBrowser(e))}`}>{getBrowser(e)}</span></td>
                <td><span className="text-muted text-sm">{fmt(e.createdAt)}</span></td>
                <td><span className={`badge ${statusBadge(e.status)}`}>{e.status}</span></td>
                <td>
                  <div className="action-row">
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

/* ═══════════════════════════════════════════════════════
   VIEW: SCHEDULER LIST
═══════════════════════════════════════════════════════ */
function SchedulerListView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetch('/api/schedulers').then(r => r.json()).then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const remove = (id) => {
    fetch(`/api/schedulers/${id}`, { method: 'DELETE' }).then(r => {
      if (r.ok) { setData(p => p.filter(s => s.id !== id)); toast('success', 'Deleted', 'Scheduler removed.'); }
      else toast('error', 'Error', 'Failed to delete scheduler.');
    });
  };

  const paged = data.slice(page * entries, (page + 1) * entries);

  return (
    <div className="page-view">
      <PageHeader title="Schedulers" crumb="All Schedulers"
        actions={<Link to="/scheduler/create" className="btn btn-primary">➕ New Scheduler</Link>} />
      <TableCard title="All Scheduled Tests" total={data.length}
        entries={entries} onEntries={n => { setEntries(n); setPage(0); }}
        page={page} onPage={setPage}>
        <table className="data-table">
          <thead><tr>
            <th>Suite Name</th><th>Type</th><th>Browser</th><th>Status</th><th>Created</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr className="row-loading"><td colSpan={6}><div className="spinner"/></td></tr>
            ) : paged.length === 0 ? (
              <tr className="row-empty"><td colSpan={6}>
                <div className="empty-state">
                  <div className="empty-state-icon">📅</div>
                  <h3>No schedulers yet</h3>
                  <p><Link to="/scheduler/create" style={{color:'var(--brand)'}}>Create your first scheduler</Link></p>
                </div>
              </td></tr>
            ) : paged.map(s => (
              <tr key={s.id}>
                <td><span className="cell-bold">{s.testSuiteName}</span></td>
                <td><span className={`badge ${statusBadge(s.executionType)}`}>{s.executionType}</span></td>
                <td><span className={`badge ${statusBadge(s.browserType)}`}>{s.browserType}</span></td>
                <td><span className={`badge ${statusBadge(s.status)}`}>{s.status}</span></td>
                <td><span className="text-muted text-sm">{fmt(s.createdAt)}</span></td>
                <td>
                  <div className="action-row">
                    <button className="act-btn delete" title="Delete" onClick={() => remove(s.id)}>🗑️</button>
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

/* ═══════════════════════════════════════════════════════
   VIEW: CREATE SCHEDULER
═══════════════════════════════════════════════════════ */
function CreateSchedulerView() {
  const navigate = useNavigate();
  const [suites, setSuites] = useState([]);
  const [form, setForm] = useState({ testSuiteId: '', executionType: '', browserType: '', status: 'active' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    fetch('/api/test-suites').then(r => r.json()).then(setSuites).catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const suite = suites.find(s => String(s.id) === String(form.testSuiteId));
    const payload = { ...form, testSuiteName: suite?.name || '', testSuiteId: form.testSuiteId ? +form.testSuiteId : null };
    const r = await fetch('/api/schedulers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (r.ok) { toast('success', 'Scheduler created!', 'It will run as configured.'); setTimeout(() => navigate('/scheduler'), 800); }
    else { toast('error', 'Failed', 'Could not save scheduler.'); setSaving(false); }
  };

  return (
    <div className="page-view">
      <PageHeader title="Create Scheduler" crumb="New Scheduler"
        actions={<Link to="/scheduler" className="btn btn-ghost">← Back</Link>} />
      <div className="card form-card">
        <div className="card-header"><h2>⚙️ Scheduler Configuration</h2></div>
        <form onSubmit={save}>
          <div className="form-section">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Test Suite <span className="req">*</span></label>
                <select className="form-select" value={form.testSuiteId} onChange={e => set('testSuiteId', e.target.value)} required>
                  <option value="">Select a test suite…</option>
                  {suites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <span className="form-hint">Choose which suite to schedule</span>
              </div>
              <div className="form-group">
                <label className="form-label">Execution Type <span className="req">*</span></label>
                <select className="form-select" value={form.executionType} onChange={e => set('executionType', e.target.value)} required>
                  <option value="">Select type…</option>
                  <option value="now">▶ Run Now</option>
                  <option value="scheduled">🕐 Scheduled</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Browser <span className="req">*</span></label>
                <select className="form-select" value={form.browserType} onChange={e => set('browserType', e.target.value)} required>
                  <option value="">Select browser…</option>
                  <option value="chrome">🌐 Chrome</option>
                  <option value="firefox">🦊 Firefox</option>
                  <option value="edge">🔷 Edge</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="active">✅ Active</option>
                  <option value="inactive">⏸ Inactive</option>
                </select>
              </div>
            </div>
          </div>
          <div className="form-actions">
            <Link to="/scheduler" className="btn btn-ghost">Cancel</Link>
            <button type="submit" className="btn btn-success" disabled={saving}>
              {saving ? '⏳ Saving…' : '💾 Save Scheduler'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VIEW: AGENT GROUPS LIST
═══════════════════════════════════════════════════════ */
function GroupsListView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetch('/api/groups').then(r => r.json()).then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const remove = (id) => {
    fetch(`/api/groups/${id}`, { method: 'DELETE' }).then(r => {
      if (r.ok) { setData(p => p.filter(g => g.id !== id)); toast('success', 'Deleted', 'Agent group removed.'); }
      else toast('error', 'Error', 'Failed to delete group.');
    });
  };

  const filtered = data.filter(g => g.name.toLowerCase().includes(search.toLowerCase()) || (g.description || '').toLowerCase().includes(search.toLowerCase()));
  const paged = filtered.slice(page * entries, (page + 1) * entries);

  return (
    <div className="page-view">
      <PageHeader title="Agent Groups" crumb="All Groups"
        actions={<Link to="/groups/create" className="btn btn-primary">➕ New Group</Link>} />
      <TableCard title="Agent Group Directory" total={filtered.length}
        search={search} onSearch={s => { setSearch(s); setPage(0); }}
        entries={entries} onEntries={n => { setEntries(n); setPage(0); }}
        page={page} onPage={setPage}>
        <table className="data-table">
          <thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr className="row-loading"><td colSpan={5}><div className="spinner"/></td></tr>
            : paged.length === 0 ? <tr className="row-empty"><td colSpan={5}>
                <div className="empty-state"><div className="empty-state-icon">👥</div><h3>No groups yet</h3><p><Link to="/groups/create" style={{color:'var(--brand)'}}>Create your first group</Link></p></div>
              </td></tr>
            : paged.map(g => (
              <tr key={g.id}>
                <td><span className="cell-bold">#{g.id}</span></td>
                <td><span className="cell-bold">{g.name}</span></td>
                <td><span className="text-muted">{g.description || '—'}</span></td>
                <td><span className="text-muted text-sm">{fmt(g.createdAt)}</span></td>
                <td><div className="action-row"><button className="act-btn delete" onClick={() => remove(g.id)}>🗑️</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VIEW: CREATE GROUP
═══════════════════════════════════════════════════════ */
function CreateGroupView() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const r = await fetch('/api/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description: desc }) });
    if (r.ok) { toast('success', 'Group created!'); setTimeout(() => navigate('/groups'), 800); }
    else { toast('error', 'Failed', 'Could not save group.'); setSaving(false); }
  };

  return (
    <div className="page-view">
      <PageHeader title="Create Agent Group" crumb="New Group"
        actions={<Link to="/groups" className="btn btn-ghost">← Back</Link>} />
      <div className="card form-card">
        <div className="card-header"><h2>👥 Group Details</h2></div>
        <form onSubmit={save}>
          <div className="form-section">
            <div className="form-grid cols-1">
              <div className="form-group">
                <label className="form-label">Group Name <span className="req">*</span></label>
                <input className="form-input" placeholder="e.g. QA Team Alpha" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="Describe what this group does…" value={desc} onChange={e => setDesc(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="form-actions">
            <Link to="/groups" className="btn btn-ghost">Cancel</Link>
            <button type="submit" className="btn btn-success" disabled={saving}>{saving ? '⏳ Saving…' : '💾 Save Group'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VIEW: TEST CASE LIST
═══════════════════════════════════════════════════════ */
function TestCaseListView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState([]);

  useEffect(() => {
    fetch('/api/test-cases').then(r => r.json()).then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (id) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    fetch(`/api/test-cases/${id}`).then(r => r.json()).then(d => setExpandedSteps(d.steps || []));
  };

  const remove = (id) => {
    fetch(`/api/test-cases/${id}`, { method: 'DELETE' }).then(r => {
      if (r.ok) { setData(p => p.filter(t => t.id !== id)); toast('success', 'Deleted', 'Test case removed.'); }
      else toast('error', 'Error', 'Failed to delete.');
    });
  };

  const filtered = data.filter(t => {
    const q = search.toLowerCase();
    return t.name.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
  });
  const paged = filtered.slice(page * entries, (page + 1) * entries);

  return (
    <div className="page-view">
      <PageHeader title="Test Cases" crumb="All Test Cases"
        actions={<Link to="/test-cases/create" className="btn btn-primary">➕ New Test Case</Link>} />
      <TableCard title="Test Case Library" total={filtered.length}
        search={search} onSearch={s => { setSearch(s); setPage(0); }}
        entries={entries} onEntries={n => { setEntries(n); setPage(0); }}
        page={page} onPage={setPage}>
        <table className="data-table">
          <thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr className="row-loading"><td colSpan={6}><div className="spinner"/></td></tr>
            : paged.length === 0 ? <tr className="row-empty"><td colSpan={6}>
                <div className="empty-state"><div className="empty-state-icon">📝</div><h3>No test cases yet</h3><p><Link to="/test-cases/create" style={{color:'var(--brand)'}}>Create your first test case</Link></p></div>
              </td></tr>
            : paged.map(t => (
              <>
                <tr key={t.id} className={expanded === t.id ? 'row-expanded' : ''}>
                  <td><span className="cell-bold">#{t.id}</span></td>
                  <td><span className="cell-bold">{t.name}</span></td>
                  <td><span className="text-muted text-sm">{t.description || '—'}</span></td>
                  <td><span className={`badge ${statusBadge(t.status)}`}>{t.status}</span></td>
                  <td><span className="text-muted text-sm">{fmt(t.createdAt)}</span></td>
                  <td>
                    <div className="action-row">
                      <button className="act-btn view" title="View Steps" onClick={() => toggle(t.id)}>{expanded === t.id ? '▲' : '👁️'}</button>
                      <button className="act-btn delete" title="Delete" onClick={() => remove(t.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
                {expanded === t.id && (
                  <tr key={`${t.id}-exp`} className="expand-panel">
                    <td colSpan={6}>
                      <div className="expand-panel-inner">
                        <div className="expand-panel-title">🔬 Test Steps ({expandedSteps.length})</div>
                        {expandedSteps.length === 0 ? (
                          <p className="text-muted text-sm" style={{fontStyle:'italic'}}>No steps defined for this test case.</p>
                        ) : (
                          <div className="nested-table">
                            <table className="data-table">
                              <thead><tr><th>#</th><th>Action</th><th>Locator Type</th><th>Locator Value</th><th>Test Data</th><th>Description</th></tr></thead>
                              <tbody>
                                {expandedSteps.map(s => (
                                  <tr key={s.id}>
                                    <td><span className="cell-bold">{s.stepOrder}</span></td>
                                    <td><span className="action-tag">{s.actionName}</span></td>
                                    <td><span className={`badge ${statusBadge(s.locatorType)}`}>{s.locatorType || '—'}</span></td>
                                    <td><code style={{fontSize:'11px',background:'var(--bg)',padding:'2px 6px',borderRadius:'4px',color:'var(--brand)'}}>{s.locatorValue || '—'}</code></td>
                                    <td><span className="text-sm">{s.testData || '—'}</span></td>
                                    <td><span className="text-muted text-sm">{s.description || '—'}</span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VIEW: CREATE TEST CASE (premium step builder)
═══════════════════════════════════════════════════════ */
const ACTION_OPTIONS = [
  'navigate','click','type','clear','select','wait','assert',
  'hover','doubleClick','rightClick','scrollTo','switchFrame',
  'switchWindow','acceptAlert','dismissAlert','screenshot','executeScript','dragAndDrop','waitForElement'
];
const LOCATOR_OPTIONS = ['id','name','xpath','css','linkText','partialLinkText','className','tagName'];

function CreateTestCaseView() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [steps, setSteps] = useState([{ actionName: '', locatorType: '', locatorValue: '', testData: '', description: '' }]);
  const [saving, setSaving] = useState(false);

  const addStep = () => setSteps(p => [...p, { actionName: '', locatorType: '', locatorValue: '', testData: '', description: '' }]);
  const removeStep = (i) => { if (steps.length > 1) setSteps(p => p.filter((_, j) => j !== i)); };
  const updateStep = (i, k, v) => setSteps(p => p.map((s, j) => j === i ? { ...s, [k]: v } : s));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { name, description: desc, steps: steps.map((s, i) => ({ ...s, stepOrder: i + 1 })) };
    const r = await fetch('/api/test-cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (r.ok) { toast('success', 'Test Case created!', `"${name}" saved with ${steps.length} step(s).`); setTimeout(() => navigate('/test-cases'), 900); }
    else { toast('error', 'Failed', 'Could not save test case.'); setSaving(false); }
  };

  return (
    <div className="page-view">
      <PageHeader title="Create Test Case" crumb="New Test Case"
        actions={<Link to="/test-cases" className="btn btn-ghost">← Back</Link>} />
      <div className="card form-card-wide">
        <div className="card-header">
          <div><h2>📝 Test Case Details</h2><p>Define the test scenario and its ordered steps</p></div>
        </div>
        <form onSubmit={save}>
          <div className="form-section">
            <div className="form-section-title">Basic Info</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Test Case Name <span className="req">*</span></label>
                <input className="form-input" placeholder="e.g. Login with valid credentials" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" placeholder="What does this test verify?" value={desc} onChange={e => setDesc(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="step-builder">
            <div className="step-builder-header">
              <div className="step-builder-title">
                🔬 Test Steps
                <span className="step-count-pill">{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
              </div>
              <button type="button" className="btn btn-primary btn-sm" onClick={addStep}>➕ Add Step</button>
            </div>

            <div className="step-list">
              {steps.map((s, i) => (
                <div key={i} className="step-card">
                  <div className="step-num">{i + 1}</div>
                  <div className="step-body">
                    <div className="step-field">
                      <span className="step-field-label">Action *</span>
                      <select value={s.actionName} onChange={e => updateStep(i, 'actionName', e.target.value)} required>
                        <option value="">Select…</option>
                        {ACTION_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div className="step-field">
                      <span className="step-field-label">Locator Type</span>
                      <select value={s.locatorType} onChange={e => updateStep(i, 'locatorType', e.target.value)}>
                        <option value="">None</option>
                        {LOCATOR_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="step-field">
                      <span className="step-field-label">Locator Value</span>
                      <input placeholder="#submit-btn or //button" value={s.locatorValue} onChange={e => updateStep(i, 'locatorValue', e.target.value)} />
                    </div>
                    <div className="step-field">
                      <span className="step-field-label">Test Data</span>
                      <input placeholder="e.g. admin@test.com" value={s.testData} onChange={e => updateStep(i, 'testData', e.target.value)} />
                    </div>
                    <div className="step-field">
                      <span className="step-field-label">Description</span>
                      <input placeholder="What does this step do?" value={s.description} onChange={e => updateStep(i, 'description', e.target.value)} />
                    </div>
                  </div>
                  <button type="button" className="step-remove-btn" onClick={() => removeStep(i)} disabled={steps.length <= 1} title="Remove step">✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <Link to="/test-cases" className="btn btn-ghost">Cancel</Link>
            <button type="submit" className="btn btn-success" disabled={saving}>
              {saving ? '⏳ Saving…' : `💾 Save Test Case (${steps.length} steps)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VIEW: TEST CASE GROUP LIST
═══════════════════════════════════════════════════════ */
function TestCaseGroupListView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [expandedCases, setExpandedCases] = useState([]);

  useEffect(() => {
    fetch('/api/test-case-groups').then(r => r.json()).then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (id) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    fetch(`/api/test-case-groups/${id}`).then(r => r.json()).then(d => setExpandedCases(d.testCases || []));
  };

  const remove = (id) => {
    fetch(`/api/test-case-groups/${id}`, { method: 'DELETE' }).then(r => {
      if (r.ok) { setData(p => p.filter(g => g.id !== id)); toast('success', 'Deleted', 'Group removed.'); }
      else toast('error', 'Error', 'Failed to delete group.');
    });
  };

  const filtered = data.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
  const paged = filtered.slice(page * entries, (page + 1) * entries);

  return (
    <div className="page-view">
      <PageHeader title="Test Case Groups" crumb="All Groups"
        actions={<Link to="/test-case-groups/create" className="btn btn-primary">➕ New Group</Link>} />
      <TableCard title="All Test Case Groups" total={filtered.length}
        search={search} onSearch={s => { setSearch(s); setPage(0); }}
        entries={entries} onEntries={n => { setEntries(n); setPage(0); }}
        page={page} onPage={setPage}>
        <table className="data-table">
          <thead><tr><th>ID</th><th>Group Name</th><th>Description</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr className="row-loading"><td colSpan={6}><div className="spinner"/></td></tr>
            : paged.length === 0 ? <tr className="row-empty"><td colSpan={6}>
                <div className="empty-state"><div className="empty-state-icon">📁</div><h3>No groups yet</h3><p><Link to="/test-case-groups/create" style={{color:'var(--brand)'}}>Create your first group</Link></p></div>
              </td></tr>
            : paged.map(g => (
              <>
                <tr key={g.id} className={expanded === g.id ? 'row-expanded' : ''}>
                  <td><span className="cell-bold">#{g.id}</span></td>
                  <td><span className="cell-bold">{g.name}</span></td>
                  <td><span className="text-muted text-sm">{g.description || '—'}</span></td>
                  <td><span className={`badge ${statusBadge(g.status)}`}>{g.status}</span></td>
                  <td><span className="text-muted text-sm">{fmt(g.createdAt)}</span></td>
                  <td>
                    <div className="action-row">
                      <button className="act-btn view" title="View Cases" onClick={() => toggle(g.id)}>{expanded === g.id ? '▲' : '👁️'}</button>
                      <button className="act-btn delete" title="Delete" onClick={() => remove(g.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
                {expanded === g.id && (
                  <tr key={`${g.id}-exp`} className="expand-panel">
                    <td colSpan={6}>
                      <div className="expand-panel-inner">
                        <div className="expand-panel-title">📋 Test Cases in this Group ({expandedCases.length})</div>
                        {expandedCases.length === 0 ? (
                          <p className="text-muted text-sm" style={{fontStyle:'italic'}}>No test cases assigned to this group.</p>
                        ) : (
                          <div className="nested-table">
                            <table className="data-table">
                              <thead><tr><th>Order</th><th>Test Case Name</th><th>Steps</th><th>Status</th></tr></thead>
                              <tbody>
                                {expandedCases.map((item, idx) => (
                                  <tr key={idx}>
                                    <td><span className="cell-bold">{item.caseOrder + 1}</span></td>
                                    <td><span className="cell-bold">{item.testCase.name}</span></td>
                                    <td><span className="badge badge-info">{(item.steps || []).length} steps</span></td>
                                    <td><span className={`badge ${statusBadge(item.testCase.status)}`}>{item.testCase.status}</span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   REUSABLE: ITEM PICKER (checkboxes)
═══════════════════════════════════════════════════════ */
function ItemPicker({ items, selected, onToggle, getLabel, getSub, getMeta }) {
  return (
    <div className="picker-wrap">
      <div className="picker-header">
        <span className="picker-header-left">{items.length} available</span>
        <span className="picker-selected-count">{selected.length} selected</span>
      </div>
      <div className="picker-list">
        {items.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--txt-muted)', fontSize: '13px', fontStyle: 'italic' }}>
            No items available yet.
          </div>
        ) : items.map(item => {
          const checked = selected.includes(item.id);
          return (
            <div key={item.id} className={`picker-item ${checked ? 'checked' : ''}`} onClick={() => onToggle(item.id)}>
              <div className="picker-checkbox">
                <span className="picker-checkmark">✓</span>
              </div>
              <div className="picker-info">
                <strong>{getLabel(item)}</strong>
                {getSub && <small>{getSub(item)}</small>}
              </div>
              {getMeta && <div className="picker-meta">{getMeta(item)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VIEW: CREATE TEST CASE GROUP
═══════════════════════════════════════════════════════ */
function CreateTestCaseGroupView() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [allCases, setAllCases] = useState([]);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/test-cases').then(r => r.json()).then(setAllCases).catch(() => {});
  }, []);

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const r = await fetch('/api/test-case-groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description: desc, testCaseIds: selected }) });
    if (r.ok) { toast('success', 'Group created!', `"${name}" with ${selected.length} test case(s).`); setTimeout(() => navigate('/test-case-groups'), 900); }
    else { toast('error', 'Failed', 'Could not save group.'); setSaving(false); }
  };

  return (
    <div className="page-view">
      <PageHeader title="Create Test Case Group" crumb="New Group"
        actions={<Link to="/test-case-groups" className="btn btn-ghost">← Back</Link>} />
      <div className="card form-card">
        <div className="card-header"><div><h2>📁 Group Details</h2><p>Group related test cases together</p></div></div>
        <form onSubmit={save}>
          <div className="form-section">
            <div className="form-grid cols-1">
              <div className="form-group">
                <label className="form-label">Group Name <span className="req">*</span></label>
                <input className="form-input" placeholder="e.g. Authentication Tests" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="What test cases does this group contain?" value={desc} onChange={e => setDesc(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Assign Test Cases</label>
                <ItemPicker
                  items={allCases}
                  selected={selected}
                  onToggle={toggle}
                  getLabel={tc => tc.name}
                  getSub={tc => tc.description || 'No description'}
                  getMeta={tc => <span className={`badge ${statusBadge(tc.status)}`}>{tc.status}</span>}
                />
                {allCases.length === 0 && (
                  <span className="form-hint">No test cases yet — <Link to="/test-cases/create" style={{color:'var(--brand)'}}>create one first</Link></span>
                )}
              </div>
            </div>
          </div>
          <div className="form-actions">
            <Link to="/test-case-groups" className="btn btn-ghost">Cancel</Link>
            <button type="submit" className="btn btn-success" disabled={saving}>
              {saving ? '⏳ Saving…' : `💾 Save Group (${selected.length} cases)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VIEW: TEST SUITE LIST
═══════════════════════════════════════════════════════ */
function TestSuiteListView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [expandedDetail, setExpandedDetail] = useState(null);

  useEffect(() => {
    fetch('/api/test-suites').then(r => r.json()).then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (id) => {
    if (expanded === id) { setExpanded(null); setExpandedDetail(null); return; }
    setExpanded(id);
    setExpandedDetail(null);
    fetch(`/api/test-suites/${id}`).then(r => r.json()).then(setExpandedDetail);
  };

  const remove = (id) => {
    fetch(`/api/test-suites/${id}`, { method: 'DELETE' }).then(r => {
      if (r.ok) { setData(p => p.filter(s => s.id !== id)); toast('success', 'Deleted', 'Test suite removed.'); }
      else toast('error', 'Error', 'Failed to delete suite.');
    });
  };

  const filtered = data.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const paged = filtered.slice(page * entries, (page + 1) * entries);

  return (
    <div className="page-view">
      <PageHeader title="Test Suites" crumb="All Suites"
        actions={<Link to="/test-suites/create" className="btn btn-primary">➕ New Suite</Link>} />
      <TableCard title="All Test Suites" total={filtered.length}
        search={search} onSearch={s => { setSearch(s); setPage(0); }}
        entries={entries} onEntries={n => { setEntries(n); setPage(0); }}
        page={page} onPage={setPage}>
        <table className="data-table">
          <thead><tr><th>ID</th><th>Suite Name</th><th>Browser</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr className="row-loading"><td colSpan={6}><div className="spinner"/></td></tr>
            : paged.length === 0 ? <tr className="row-empty"><td colSpan={6}>
                <div className="empty-state"><div className="empty-state-icon">📦</div><h3>No test suites yet</h3><p><Link to="/test-suites/create" style={{color:'var(--brand)'}}>Create your first suite</Link></p></div>
              </td></tr>
            : paged.map(s => (
              <>
                <tr key={s.id} className={expanded === s.id ? 'row-expanded' : ''}>
                  <td><span className="cell-bold">#{s.id}</span></td>
                  <td><span className="cell-bold">{s.name}</span></td>
                  <td><span className={`badge ${statusBadge(s.browserType)}`}>{s.browserType}</span></td>
                  <td><span className={`badge ${statusBadge(s.status)}`}>{s.status}</span></td>
                  <td><span className="text-muted text-sm">{fmt(s.createdAt)}</span></td>
                  <td>
                    <div className="action-row">
                      <button className="act-btn view" title="View Structure" onClick={() => toggle(s.id)}>{expanded === s.id ? '▲' : '👁️'}</button>
                      <button className="act-btn delete" title="Delete" onClick={() => remove(s.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
                {expanded === s.id && (
                  <tr key={`${s.id}-exp`} className="expand-panel">
                    <td colSpan={6}>
                      <div className="expand-panel-inner">
                        <div className="expand-panel-title">🗂️ Suite Structure</div>
                        {!expandedDetail ? (
                          <div className="spinner" />
                        ) : (expandedDetail.groups || []).length === 0 ? (
                          <p className="text-muted text-sm" style={{fontStyle:'italic'}}>No groups assigned to this suite.</p>
                        ) : (
                          <div className="suite-groups">
                            {expandedDetail.groups.map((grpItem, gi) => (
                              <div key={gi} className="suite-group-card">
                                <div className="suite-group-head">
                                  <div className="suite-group-num">{grpItem.groupOrder + 1}</div>
                                  <span className="suite-group-name">{grpItem.group.name}</span>
                                  <span className="suite-group-badge">{(grpItem.testCases || []).length} cases</span>
                                </div>
                                {(grpItem.testCases || []).map((tcItem, ti) => (
                                  <div key={ti} className="suite-case-row">
                                    <span className="suite-case-order">{tcItem.caseOrder + 1}.</span>
                                    <span className="suite-case-name">{tcItem.testCase.name}</span>
                                    <span className="suite-case-steps">{(tcItem.steps || []).length} steps</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VIEW: CREATE TEST SUITE
═══════════════════════════════════════════════════════ */
function CreateTestSuiteView() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [browser, setBrowser] = useState('chrome');
  const [allGroups, setAllGroups] = useState([]);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/test-case-groups').then(r => r.json()).then(setAllGroups).catch(() => {});
  }, []);

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const r = await fetch('/api/test-suites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description: desc, browserType: browser, testCaseGroupIds: selected }) });
    if (r.ok) { toast('success', 'Suite created!', `"${name}" with ${selected.length} group(s).`); setTimeout(() => navigate('/test-suites'), 900); }
    else { toast('error', 'Failed', 'Could not save suite.'); setSaving(false); }
  };

  return (
    <div className="page-view">
      <PageHeader title="Create Test Suite" crumb="New Suite"
        actions={<Link to="/test-suites" className="btn btn-ghost">← Back</Link>} />
      <div className="card form-card">
        <div className="card-header"><div><h2>🗂️ Suite Details</h2><p>Configure the top-level test suite</p></div></div>
        <form onSubmit={save}>
          <div className="form-section">
            <div className="form-grid cols-1">
              <div className="form-group">
                <label className="form-label">Suite Name <span className="req">*</span></label>
                <input className="form-input" placeholder="e.g. Full Regression Suite" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={3} placeholder="What does this suite test end-to-end?" value={desc} onChange={e => setDesc(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Browser <span className="req">*</span></label>
                <select className="form-select" value={browser} onChange={e => setBrowser(e.target.value)}>
                  <option value="chrome">🌐 Chrome</option>
                  <option value="firefox">🦊 Firefox</option>
                  <option value="edge">🔷 Edge</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assign Test Case Groups</label>
                <ItemPicker
                  items={allGroups}
                  selected={selected}
                  onToggle={toggle}
                  getLabel={g => g.name}
                  getSub={g => g.description || 'No description'}
                  getMeta={g => <span className={`badge ${statusBadge(g.status)}`}>{g.status}</span>}
                />
                {allGroups.length === 0 && (
                  <span className="form-hint">No groups yet — <Link to="/test-case-groups/create" style={{color:'var(--brand)'}}>create one first</Link></span>
                )}
              </div>
            </div>
          </div>
          <div className="form-actions">
            <Link to="/test-suites" className="btn btn-ghost">Cancel</Link>
            <button type="submit" className="btn btn-success" disabled={saving}>
              {saving ? '⏳ Saving…' : `💾 Save Suite (${selected.length} groups)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   COMPONENT: REPORT MODAL
═══════════════════════════════════════════════════════ */
function ReportModal({ execId, onClose, onLightbox }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/executions/${execId}`).then(r => r.json()).then(d => { setDetail(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [execId]);

  const getName = (e) => {
    try { const p = JSON.parse(e.environmentJson || '{}'); return p.referenceId || `Run #${e.id}`; } catch { return `Run #${e.id}`; }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-head">
          <h3>{loading ? 'Loading report…' : `📊 Execution Report — ${getName(detail.execution)}`}</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px' }}><div className="spinner" /></div>
          ) : detail && (
            <>
              <div className="exec-meta">
                {[
                  { l: 'Execution ID', v: `#${detail.execution.id}` },
                  { l: 'Status', v: <span className={`badge ${statusBadge(detail.execution.status)}`}>{detail.execution.status}</span> },
                  { l: 'Started',  v: fmt(detail.execution.createdAt) },
                  { l: 'Finished', v: detail.execution.finishedAt ? fmt(detail.execution.finishedAt) : '⏳ In progress' },
                ].map(m => (
                  <div key={m.l} className="exec-meta-item">
                    <div className="exec-meta-label">{m.l}</div>
                    <div className="exec-meta-val">{m.v}</div>
                  </div>
                ))}
              </div>

              <div className="steps-section">
                <h4>🔬 Step-by-Step Results ({detail.steps.length} steps)</h4>
                <div className="nested-table">
                  <table className="data-table">
                    <thead><tr><th>#</th><th>Action</th><th>Executed</th><th>Result</th><th>Error</th><th>Screenshot</th></tr></thead>
                    <tbody>
                      {detail.steps.length === 0 ? (
                        <tr className="row-empty"><td colSpan={6}>No steps recorded for this execution.</td></tr>
                      ) : detail.steps.map(step => {
                        const ss = detail.screenshots.find(sc => sc.stepResultId === step.id);
                        return (
                          <tr key={step.id}>
                            <td><span className="cell-bold">{step.stepIndex}</span></td>
                            <td><span className="action-tag">{step.actionName}</span></td>
                            <td>{step.executedStatus === 1 ? <span className="badge badge-success">Yes</span> : <span className="badge badge-neutral">No</span>}</td>
                            <td>
                              {step.executedStatus === 1
                                ? step.resultStatus === 1
                                  ? <span className="badge badge-success">PASS</span>
                                  : <span className="badge badge-danger">FAIL</span>
                                : '—'}
                            </td>
                            <td><span className="text-sm text-muted">{step.errorJson || '—'}</span></td>
                            <td>
                              {ss ? (
                                <img src={`/api/screenshots/${ss.fileName}`} className="screenshot-thumb" alt="ss"
                                  onClick={() => onLightbox(`/api/screenshots/${ss.fileName}`)} />
                              ) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
