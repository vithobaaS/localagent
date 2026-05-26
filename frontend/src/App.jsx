import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Link, useNavigate, Navigate } from 'react-router-dom';
import './App.css';

function App() {
  const navigate = useNavigate();
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Shared Modal / Lightbox State
  const [selectedExecId, setSelectedExecId] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      {sidebarVisible && (
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="logo">
              <span className="logo-dot"></span>
              <h2>AutoPropel</h2>
            </div>
          </div>

          <nav className="sidebar-nav">
            {/* MAIN NAVIGATION */}
            <div className="nav-section">MAIN NAVIGATION</div>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">📊</span> Dashboard
            </NavLink>

            {/* SCHEDULER */}
            <div className="nav-section">SCHEDULER</div>
            <NavLink to="/scheduler/create" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">📅</span> Create scheduler
            </NavLink>
            <NavLink to="/scheduler" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">📋</span> List scheduler
            </NavLink>

            {/* TEST SUITE */}
            <div className="nav-section">TEST SUITE</div>
            <NavLink to="/stub/create-test-suite" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">📦</span> Create Test Suite
            </NavLink>
            <NavLink to="/stub/test-suite-list" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">👁️</span> Test Suite List
            </NavLink>

            {/* TEST CASE */}
            <div className="nav-section">TEST CASE</div>
            <NavLink to="/stub/create-test-case" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">📝</span> Create Test Case
            </NavLink>
            <NavLink to="/stub/test-case-list" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">🔎</span> Test Case List
            </NavLink>

            {/* GROUPS */}
            <div className="nav-section">GROUPS</div>
            <NavLink to="/groups/create" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">👥</span> Create Groups
            </NavLink>
            <NavLink to="/groups" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">🗺️</span> List Groups
            </NavLink>
          </nav>

          <div className="sidebar-footer">
            <p>Copyright &copy; 2026 AutoPropel.</p>
            <span>Version 1.0 Beta</span>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <button className="menu-toggle" onClick={() => setSidebarVisible(!sidebarVisible)}>☰</button>
          <div className="header-right">
            <button className="header-icon-btn">
              <span className="icon">✉️</span>
              <span className="badge">4</span>
            </button>
            <button className="header-icon-btn">
              <span className="icon">🔔</span>
              <span className="badge warning">10</span>
            </button>
            <div className="header-user">
              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80" alt="Avatar" className="avatar-sm" />
            </div>
          </div>
        </header>

        {/* Dynamic Pages Container */}
        <div className="page-container">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardView onSelectExec={setSelectedExecId} />} />
            <Route path="/scheduler" element={<SchedulerListView />} />
            <Route path="/scheduler/create" element={<CreateSchedulerView navigate={navigate} />} />
            <Route path="/groups" element={<GroupsListView />} />
            <Route path="/groups/create" element={<CreateGroupView navigate={navigate} />} />
            <Route path="/stub/create-test-suite" element={<StubView title="Create Test Suite" breadcrumbs="Home > Create Test Suite" />} />
            <Route path="/stub/test-suite-list" element={<StubView title="Test Suite List" breadcrumbs="Home > Test Suite List" />} />
            <Route path="/stub/create-test-case" element={<StubView title="Create Test Case" breadcrumbs="Home > Create Test Case" />} />
            <Route path="/stub/test-case-list" element={<StubView title="Test Case List" breadcrumbs="Home > Test Case List" />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>

      {/* REPORT DETAILS MODAL */}
      {selectedExecId && (
        <ReportModal 
          execId={selectedExecId} 
          onClose={() => setSelectedExecId(null)} 
          onOpenLightbox={setLightboxSrc} 
        />
      )}

      {/* SCREENSHOT LIGHTBOX */}
      {lightboxSrc && (
        <div className="lightbox active" onClick={() => setLightboxSrc(null)}>
          <span className="lightbox-close" onClick={() => setLightboxSrc(null)}>&times;</span>
          <img src={lightboxSrc} alt="Screenshot" className="lightbox-img" />
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// VIEW: DASHBOARD
// -------------------------------------------------------------
function DashboardView({ onSelectExec }) {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [entriesLimit, setEntriesLimit] = useState(10);

  useEffect(() => {
    setLoading(true);
    fetch('/api/executions')
      .then(res => res.json())
      .then(data => {
        setExecutions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading executions:", err);
        setLoading(false);
      });
  }, []);

  const getTestSuiteName = (exec) => {
    if (exec.environmentJson) {
      try {
        const parsed = JSON.parse(exec.environmentJson);
        if (parsed.referenceId) return parsed.referenceId;
      } catch (e) {}
    }
    return `Execution Run #${exec.id}`;
  };

  const getBrowserType = (exec) => {
    if (exec.environmentJson) {
      try {
        const parsed = JSON.parse(exec.environmentJson);
        if (parsed.browserTypeName) return parsed.browserTypeName.toLowerCase();
      } catch (e) {}
    }
    return 'chrome';
  };

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return '-';
    try {
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) return isoStr;
      return date.getFullYear() + '-' +
             String(date.getMonth() + 1).padStart(2, '0') + '-' +
             String(date.getDate()).padStart(2, '0') + ' ' +
             String(date.getHours()).padStart(2, '0') + ':' +
             String(date.getMinutes()).padStart(2, '0') + ':' +
             String(date.getSeconds()).padStart(2, '0');
    } catch (e) {
      return isoStr;
    }
  };

  const filtered = executions.filter(exec => {
    const name = getTestSuiteName(exec).toLowerCase();
    const status = exec.status.toLowerCase();
    const id = exec.id.toString();
    const query = search.toLowerCase().trim();
    return name.includes(query) || status.includes(query) || id.includes(query);
  });

  return (
    <section className="page-view active">
      <div className="page-header">
        <h1>Dashboard</h1>
        <div className="breadcrumbs">Home &gt; Dashboard</div>
      </div>

      <div className="card card-table">
        <div className="card-header">
          <h2>Recent Test Executions</h2>
          <button className="btn btn-primary" onClick={() => window.print()}>Download Report</button>
        </div>

        <div className="table-toolbar">
          <div className="show-entries">
            Show &nbsp;
            <select value={entriesLimit} onChange={(e) => setEntriesLimit(parseInt(e.target.value))}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            &nbsp; entries
          </div>
          <div className="search-box">
            <label>
              Search: 
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Id</th>
                <th>Test Suit Name</th>
                <th>Browser Type</th>
                <th>Last Run</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="loading-row">
                  <td colSpan={6}>Loading executions...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan={6}>No executions found.</td>
                </tr>
              ) : (
                filtered.slice(0, entriesLimit).map(exec => {
                  const name = getTestSuiteName(exec);
                  const browser = getBrowserType(exec);
                  const statusClass = exec.status.toLowerCase();
                  return (
                    <tr key={exec.id}>
                      <td><strong>{exec.id}</strong></td>
                      <td>{name}</td>
                      <td>
                        <span className="browser-icon">{browser === 'chrome' ? '🌐' : '🦊'}</span> {browser}
                      </td>
                      <td>{formatTimestamp(exec.createdAt)}</td>
                      <td><span className={`status-badge ${statusClass}`}>{exec.status}</span></td>
                      <td>
                        <a className="action-link" onClick={() => onSelectExec(exec.id)}>View</a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="table-pagination-info">
          <div className="pagination-text">
            Showing 1 to {Math.min(filtered.length, entriesLimit)} of {filtered.length} entries
          </div>
          <div className="pagination-buttons">
            <button className="btn btn-pagination" disabled>Previous</button>
            <button className="btn btn-pagination active">1</button>
            <button className="btn btn-pagination" disabled>Next</button>
          </div>
        </div>
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// VIEW: LIST SCHEDULER
// -------------------------------------------------------------
function SchedulerListView() {
  const [schedulers, setSchedulers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [entriesLimit, setEntriesLimit] = useState(10);

  useEffect(() => {
    setLoading(true);
    fetch('/api/schedulers')
      .then(res => res.json())
      .then(data => {
        setSchedulers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading schedulers:", err);
        setLoading(false);
      });
  }, []);

  return (
    <section className="page-view active">
      <div className="page-header">
        <h1>Test Scheduler</h1>
        <div className="breadcrumbs">Home &gt; View Test Scheduler</div>
      </div>

      <div className="card card-table">
        <div className="card-header">
          <h2>All Scheduled Tests</h2>
        </div>
        <div className="table-toolbar">
          <div className="show-entries">
            Show &nbsp;
            <select value={entriesLimit} onChange={(e) => setEntriesLimit(parseInt(e.target.value))}>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
            &nbsp; entries
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Test Suite Name</th>
                <th>Execution Type</th>
                <th>Browser Type</th>
                <th>Report</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="loading-row">
                  <td colSpan={5}>Loading scheduled tests...</td>
                </tr>
              ) : schedulers.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan={5}>No scheduled tests found.</td>
                </tr>
              ) : (
                schedulers.slice(0, entriesLimit).map(sched => (
                  <tr key={sched.id}>
                    <td><strong>{sched.testSuiteName}</strong></td>
                    <td>{sched.executionType}</td>
                    <td><span className="browser-icon">🌐</span> {sched.browserType}</td>
                    <td>-</td>
                    <td><span style={{ fontSize: '16px', cursor: 'pointer' }} title="View Suite">👁️</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// VIEW: CREATE SCHEDULER
// -------------------------------------------------------------
function CreateSchedulerView({ navigate }) {
  const [suiteName, setSuiteName] = useState('');
  const [execType, setExecType] = useState('');
  const [browser, setBrowser] = useState('');
  const [status, setStatus] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    const payload = {
      testSuiteName: suiteName,
      executionType: execType,
      browserType: browser,
      status: status
    };

    fetch('/api/schedulers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (res.ok) {
          navigate('/scheduler');
        } else {
          alert("Failed to save scheduler.");
        }
      })
      .catch(err => {
        console.error("Error creating scheduler:", err);
      });
  };

  return (
    <section className="page-view active">
      <div className="page-header">
        <h1>Request</h1>
        <div className="breadcrumbs">Home &gt; Create Test Case</div>
      </div>

      <div className="card form-card">
        <div className="card-header">
          <h2>Basic Details</h2>
        </div>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="schedTestSuiteName">Test Suit Name</label>
            <select id="schedTestSuiteName" value={suiteName} onChange={(e) => setSuiteName(e.target.value)} required>
              <option value="">Select Suite</option>
              <option value="Boingo Signup Websit">Boingo Signup Websit</option>
              <option value="Boingo Andr Mobil Br">Boingo Andr Mobil Br</option>
              <option value="Quad Project Mgmt">Quad Project Mgmt</option>
              <option value="Boin Test Static Web">Boin Test Static Web</option>
              <option value="Boingo APK Suite">Boingo APK Suite</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="schedExecutionType">Execution Type</label>
            <select id="schedExecutionType" value={execType} onChange={(e) => setExecType(e.target.value)} required>
              <option value="">Select Type</option>
              <option value="now">now</option>
              <option value="scheduled">scheduled</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="schedBrowser">Browser</label>
            <select id="schedBrowser" value={browser} onChange={(e) => setBrowser(e.target.value)} required>
              <option value="">Select Browser</option>
              <option value="chrome">chrome</option>
              <option value="firefox">firefox</option>
              <option value="safari">safari</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="schedStatus">Status</label>
            <select id="schedStatus" value={status} onChange={(e) => setStatus(e.target.value)} required>
              <option value="">Select Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-success">Save</button>
          </div>
        </form>
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// VIEW: LIST GROUPS
// -------------------------------------------------------------
function GroupsListView() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [entriesLimit, setEntriesLimit] = useState(10);

  useEffect(() => {
    setLoading(true);
    fetch('/api/groups')
      .then(res => res.json())
      .then(data => {
        setGroups(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading groups:", err);
        setLoading(false);
      });
  }, []);

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return '-';
    try {
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) return isoStr;
      return date.getFullYear() + '-' +
             String(date.getMonth() + 1).padStart(2, '0') + '-' +
             String(date.getDate()).padStart(2, '0') + ' ' +
             String(date.getHours()).padStart(2, '0') + ':' +
             String(date.getMinutes()).padStart(2, '0') + ':' +
             String(date.getSeconds()).padStart(2, '0');
    } catch (e) {
      return isoStr;
    }
  };

  const filtered = groups.filter(grp => {
    const name = grp.name.toLowerCase();
    const desc = (grp.description || '').toLowerCase();
    const query = search.toLowerCase().trim();
    return name.includes(query) || desc.includes(query);
  });

  return (
    <section className="page-view active">
      <div className="page-header">
        <h1>View Groups <small>All Groups</small></h1>
        <div className="breadcrumbs">Home &gt; View Groups</div>
      </div>

      <div className="card card-table">
        <div className="card-header">
          <h2>Group Directory</h2>
        </div>
        <div className="table-toolbar">
          <div className="show-entries">
            Show &nbsp;
            <select value={entriesLimit} onChange={(e) => setEntriesLimit(parseInt(e.target.value))}>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
            &nbsp; entries
          </div>
          <div className="search-box">
            <label>
              Search: 
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Group Id</th>
                <th>Group Name</th>
                <th>Group Desc</th>
                <th>Group Created at</th>
                <th>View</th>
                <th>Map</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="loading-row">
                  <td colSpan={6}>Loading groups...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan={6}>No groups found.</td>
                </tr>
              ) : (
                filtered.slice(0, entriesLimit).map(grp => (
                  <tr key={grp.id}>
                    <td><strong>{grp.id}</strong></td>
                    <td>{grp.name}</td>
                    <td>{grp.description || '-'}</td>
                    <td>{formatTimestamp(grp.createdAt)}</td>
                    <td><span style={{ fontSize: '16px', cursor: 'pointer' }} title="View Group">👁️</span></td>
                    <td><span style={{ fontSize: '16px', cursor: 'pointer' }} title="Map Group">🗺️</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// VIEW: CREATE GROUP
// -------------------------------------------------------------
function CreateGroupView({ navigate }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    const payload = {
      name: name,
      description: desc
    };

    fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (res.ok) {
          navigate('/groups');
        } else {
          alert("Failed to save group.");
        }
      })
      .catch(err => {
        console.error("Error creating group:", err);
      });
  };

  return (
    <section className="page-view active">
      <div className="page-header">
        <h1>Create Group</h1>
        <div className="breadcrumbs">Home &gt; Create Group</div>
      </div>

      <div className="card form-card">
        <div className="card-header">
          <h2>Group Parameters</h2>
        </div>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="groupName">Group Name</label>
            <input 
              type="text" 
              id="groupName" 
              placeholder="e.g. dfgsdasdf_suresh" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="groupDesc">Group Description</label>
            <textarea 
              id="groupDesc" 
              rows={4} 
              placeholder="e.g. sdfgfdsgdsfgasdf_sureshK" 
              value={desc} 
              onChange={(e) => setDesc(e.target.value)} 
              required
            ></textarea>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-success">Save</button>
          </div>
        </form>
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// VIEW: STUB PAGE
// -------------------------------------------------------------
function StubView({ title, breadcrumbs }) {
  return (
    <section className="page-view active">
      <div className="page-header">
        <h1>{title}</h1>
        <div className="breadcrumbs">{breadcrumbs}</div>
      </div>
      <div className="card">
        <div className="stub-content">
          <span className="stub-icon">🚀</span>
          <h3>Coming Soon!</h3>
          <p>This module is part of the next release sprint and will be fully connected shortly.</p>
        </div>
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// COMPONENT: REPORT MODAL
// -------------------------------------------------------------
function ReportModal({ execId, onClose, onOpenLightbox }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/executions/${execId}`)
      .then(res => res.json())
      .then(data => {
        setDetail(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading execution detail:", err);
        setLoading(false);
      });
  }, [execId]);

  const getTestSuiteName = (exec) => {
    if (exec.environmentJson) {
      try {
        const parsed = JSON.parse(exec.environmentJson);
        if (parsed.referenceId) return parsed.referenceId;
      } catch (e) {}
    }
    return `Execution Run #${exec.id}`;
  };

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return '-';
    try {
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) return isoStr;
      return date.getFullYear() + '-' +
             String(date.getMonth() + 1).padStart(2, '0') + '-' +
             String(date.getDate()).padStart(2, '0') + ' ' +
             String(date.getHours()).padStart(2, '0') + ':' +
             String(date.getMinutes()).padStart(2, '0') + ':' +
             String(date.getSeconds()).padStart(2, '0');
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-card">
        <div className="modal-header">
          <h3>
            {detail ? `Execution Report: ${getTestSuiteName(detail.execution)}` : 'Loading report...'}
          </h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {loading || !detail ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading execution report step details...
            </div>
          ) : (
            <>
              <div className="execution-meta-grid">
                <div className="meta-item">
                  <span className="meta-label">Execution ID</span>
                  <span className="meta-val">{detail.execution.id}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Status</span>
                  <span className={`meta-val status-badge ${detail.execution.status.toLowerCase()}`}>
                    {detail.execution.status}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Started At</span>
                  <span className="meta-val">{formatTimestamp(detail.execution.createdAt)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Finished At</span>
                  <span className="meta-val">
                    {detail.execution.finishedAt ? formatTimestamp(detail.execution.finishedAt) : 'In progress...'}
                  </span>
                </div>
              </div>

              <div className="steps-section">
                <h4>Test Steps Breakdown</h4>
                <div className="table-responsive">
                  <table className="data-table small">
                    <thead>
                      <tr>
                        <th>Index</th>
                        <th>Action Name</th>
                        <th>Executed</th>
                        <th>Result</th>
                        <th>Error / Details</th>
                        <th>Screenshot</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.steps.length === 0 ? (
                        <tr className="empty-row">
                          <td colSpan={6}>No steps registered for this execution.</td>
                        </tr>
                      ) : (
                        detail.steps.map(step => {
                          const matchingScreenshot = detail.screenshots.find(
                            sc => sc.stepResultId === step.id
                          );
                          return (
                            <tr key={step.id}>
                              <td><strong>{step.stepIndex}</strong></td>
                              <td>
                                <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                  {step.actionName}
                                </span>
                              </td>
                              <td>{step.executedStatus === 1 ? '✅ Yes' : '❌ No'}</td>
                              <td>
                                {step.executedStatus === 1 ? (
                                  step.resultStatus === 1 ? (
                                    <span className="status-badge success">PASS</span>
                                  ) : (
                                    <span className="status-badge failed">FAIL</span>
                                  )
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td>
                                <span style={{ fontSize: '11px', color: '#475569' }}>
                                  {step.errorJson || 'No errors'}
                                </span>
                              </td>
                              <td>
                                {matchingScreenshot ? (
                                  <img 
                                    src={`/api/screenshots/${matchingScreenshot.fileName}`} 
                                    className="screenshot-thumb" 
                                    alt="Thumbnail"
                                    onClick={() => onOpenLightbox(`/api/screenshots/${matchingScreenshot.fileName}`)}
                                  />
                                ) : (
                                  '-'
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
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

export default App;
