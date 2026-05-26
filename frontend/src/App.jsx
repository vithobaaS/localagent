import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import './App.css';

function App() {
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Shared Modal / Lightbox State
  const [selectedExecId, setSelectedExecId] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const currentPath = window.location.pathname;
  const isTabActive = (path) => {
    const fullPath = `/autopropel${path}`;
    return currentPath === fullPath;
  };

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
            <a href="/autopropel/dashboard" className={`nav-item ${isTabActive('/dashboard') ? 'active' : ''}`}>
              <span className="nav-icon">📊</span> Dashboard
            </a>

            {/* SCHEDULER */}
            <div className="nav-section">SCHEDULER</div>
            <a href="/autopropel/scheduler/create" className={`nav-item ${isTabActive('/scheduler/create') ? 'active' : ''}`}>
              <span className="nav-icon">📅</span> Create Scheduler
            </a>
            <a href="/autopropel/scheduler" className={`nav-item ${isTabActive('/scheduler') ? 'active' : ''}`}>
              <span className="nav-icon">📋</span> List Scheduler
            </a>

            {/* TEST SUITE */}
            <div className="nav-section">TEST SUITE</div>
            <a href="/autopropel/test-suites/create" className={`nav-item ${isTabActive('/test-suites/create') ? 'active' : ''}`}>
              <span className="nav-icon">🗂️</span> Create Test Suite
            </a>
            <a href="/autopropel/test-suites" className={`nav-item ${isTabActive('/test-suites') ? 'active' : ''}`}>
              <span className="nav-icon">📦</span> Test Suite List
            </a>

            {/* TEST CASE GROUP */}
            <div className="nav-section">TEST CASE GROUP</div>
            <a href="/autopropel/test-case-groups/create" className={`nav-item ${isTabActive('/test-case-groups/create') ? 'active' : ''}`}>
              <span className="nav-icon">📁</span> Create Group
            </a>
            <a href="/autopropel/test-case-groups" className={`nav-item ${isTabActive('/test-case-groups') ? 'active' : ''}`}>
              <span className="nav-icon">📂</span> Group List
            </a>

            {/* TEST CASE */}
            <div className="nav-section">TEST CASE</div>
            <a href="/autopropel/test-cases/create" className={`nav-item ${isTabActive('/test-cases/create') ? 'active' : ''}`}>
              <span className="nav-icon">📝</span> Create Test Case
            </a>
            <a href="/autopropel/test-cases" className={`nav-item ${isTabActive('/test-cases') ? 'active' : ''}`}>
              <span className="nav-icon">🔎</span> Test Case List
            </a>

            {/* GROUPS */}
            <div className="nav-section">GROUPS</div>
            <a href="/autopropel/groups/create" className={`nav-item ${isTabActive('/groups/create') ? 'active' : ''}`}>
              <span className="nav-icon">👥</span> Create Groups
            </a>
            <a href="/autopropel/groups" className={`nav-item ${isTabActive('/groups') ? 'active' : ''}`}>
              <span className="nav-icon">🗺️</span> List Groups
            </a>
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
            <Route path="/scheduler/create" element={<CreateSchedulerView />} />
            <Route path="/groups" element={<GroupsListView />} />
            <Route path="/groups/create" element={<CreateGroupView />} />
            <Route path="/test-cases" element={<TestCaseListView />} />
            <Route path="/test-cases/create" element={<CreateTestCaseView />} />
            <Route path="/test-case-groups" element={<TestCaseGroupListView />} />
            <Route path="/test-case-groups/create" element={<CreateTestCaseGroupView />} />
            <Route path="/test-suites" element={<TestSuiteListView />} />
            <Route path="/test-suites/create" element={<CreateTestSuiteView />} />
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

// =============================================================================
// SHARED UTILITIES
// =============================================================================
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

// =============================================================================
// VIEW: DASHBOARD
// =============================================================================
function DashboardView({ onSelectExec }) {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [entriesLimit, setEntriesLimit] = useState(10);

  useEffect(() => {
    setLoading(true);
    fetch('/api/executions')
      .then(res => res.json())
      .then(data => { setExecutions(data); setLoading(false); })
      .catch(err => { console.error("Error loading executions:", err); setLoading(false); });
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
                <tr className="loading-row"><td colSpan={6}>Loading executions...</td></tr>
              ) : filtered.length === 0 ? (
                <tr className="empty-row"><td colSpan={6}>No executions found.</td></tr>
              ) : (
                filtered.slice(0, entriesLimit).map(exec => {
                  const name = getTestSuiteName(exec);
                  const browser = getBrowserType(exec);
                  const statusClass = exec.status.toLowerCase();
                  return (
                    <tr key={exec.id}>
                      <td><strong>{exec.id}</strong></td>
                      <td>{name}</td>
                      <td><span className="browser-icon">{browser === 'chrome' ? '🌐' : '🦊'}</span> {browser}</td>
                      <td>{formatTimestamp(exec.createdAt)}</td>
                      <td><span className={`status-badge ${statusClass}`}>{exec.status}</span></td>
                      <td><a className="action-link" onClick={() => onSelectExec(exec.id)}>View</a></td>
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

// =============================================================================
// VIEW: LIST SCHEDULER
// =============================================================================
function SchedulerListView() {
  const [schedulers, setSchedulers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [entriesLimit, setEntriesLimit] = useState(10);

  useEffect(() => {
    setLoading(true);
    fetch('/api/schedulers')
      .then(res => res.json())
      .then(data => { setSchedulers(data); setLoading(false); })
      .catch(err => { console.error("Error loading schedulers:", err); setLoading(false); });
  }, []);

  const handleDelete = (id) => {
    if (!confirm('Are you sure you want to delete this scheduler?')) return;
    fetch(`/api/schedulers/${id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) setSchedulers(prev => prev.filter(s => s.id !== id));
        else alert('Failed to delete scheduler.');
      })
      .catch(err => console.error('Error deleting scheduler:', err));
  };

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
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="loading-row"><td colSpan={6}>Loading scheduled tests...</td></tr>
              ) : schedulers.length === 0 ? (
                <tr className="empty-row"><td colSpan={6}>No scheduled tests found.</td></tr>
              ) : (
                schedulers.slice(0, entriesLimit).map(sched => (
                  <tr key={sched.id}>
                    <td><strong>{sched.testSuiteName}</strong></td>
                    <td><span className={`status-badge ${sched.executionType === 'now' ? 'running' : 'queued'}`}>{sched.executionType}</span></td>
                    <td><span className="browser-icon">🌐</span> {sched.browserType}</td>
                    <td><span className={`status-badge ${sched.status === 'active' ? 'success' : 'failed'}`}>{sched.status}</span></td>
                    <td>{formatTimestamp(sched.createdAt)}</td>
                    <td>
                      <span className="action-link danger" onClick={() => handleDelete(sched.id)} title="Delete">🗑️</span>
                    </td>
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

// =============================================================================
// VIEW: CREATE SCHEDULER (now fetches test suites dynamically)
// =============================================================================
function CreateSchedulerView() {
  const [suites, setSuites] = useState([]);
  const [suiteId, setSuiteId] = useState('');
  const [suiteName, setSuiteName] = useState('');
  const [execType, setExecType] = useState('');
  const [browser, setBrowser] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/test-suites')
      .then(res => res.json())
      .then(data => setSuites(data))
      .catch(err => console.error("Error loading suites:", err));
  }, []);

  const handleSuiteChange = (e) => {
    const selectedId = e.target.value;
    setSuiteId(selectedId);
    const found = suites.find(s => s.id.toString() === selectedId);
    setSuiteName(found ? found.name : '');
  };

  const handleSave = (e) => {
    e.preventDefault();
    const payload = {
      testSuiteName: suiteName,
      testSuiteId: suiteId ? parseInt(suiteId) : null,
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
        if (res.ok) window.location.href = '/autopropel/scheduler';
        else alert("Failed to save scheduler.");
      })
      .catch(err => console.error("Error creating scheduler:", err));
  };

  return (
    <section className="page-view active">
      <div className="page-header">
        <h1>Create Scheduler</h1>
        <div className="breadcrumbs">Home &gt; Create Scheduler</div>
      </div>

      <div className="card form-card">
        <div className="card-header">
          <h2>Scheduler Details</h2>
        </div>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="schedTestSuite">Test Suite</label>
            <select id="schedTestSuite" value={suiteId} onChange={handleSuiteChange} required>
              <option value="">Select Test Suite</option>
              {suites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="schedExecutionType">Execution Type</label>
            <select id="schedExecutionType" value={execType} onChange={(e) => setExecType(e.target.value)} required>
              <option value="">Select Type</option>
              <option value="now">Now</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="schedBrowser">Browser</label>
            <select id="schedBrowser" value={browser} onChange={(e) => setBrowser(e.target.value)} required>
              <option value="">Select Browser</option>
              <option value="chrome">Chrome</option>
              <option value="firefox">Firefox</option>
              <option value="edge">Edge</option>
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

// =============================================================================
// VIEW: LIST GROUPS
// =============================================================================
function GroupsListView() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [entriesLimit, setEntriesLimit] = useState(10);

  useEffect(() => {
    setLoading(true);
    fetch('/api/groups')
      .then(res => res.json())
      .then(data => { setGroups(data); setLoading(false); })
      .catch(err => { console.error("Error loading groups:", err); setLoading(false); });
  }, []);

  const handleDelete = (id) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    fetch(`/api/groups/${id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) setGroups(prev => prev.filter(g => g.id !== id));
        else alert('Failed to delete group.');
      })
      .catch(err => console.error('Error deleting group:', err));
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
        <div className="card-header"><h2>Group Directory</h2></div>
        <div className="table-toolbar">
          <div className="show-entries">
            Show &nbsp;
            <select value={entriesLimit} onChange={(e) => setEntriesLimit(parseInt(e.target.value))}>
              <option value={10}>10</option><option value={25}>25</option>
            </select>
            &nbsp; entries
          </div>
          <div className="search-box">
            <label>Search: <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead><tr><th>Id</th><th>Name</th><th>Description</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr className="loading-row"><td colSpan={5}>Loading groups...</td></tr>
              ) : filtered.length === 0 ? (
                <tr className="empty-row"><td colSpan={5}>No groups found.</td></tr>
              ) : (
                filtered.slice(0, entriesLimit).map(grp => (
                  <tr key={grp.id}>
                    <td><strong>{grp.id}</strong></td>
                    <td>{grp.name}</td>
                    <td>{grp.description || '-'}</td>
                    <td>{formatTimestamp(grp.createdAt)}</td>
                    <td><span className="action-link danger" onClick={() => handleDelete(grp.id)} title="Delete">🗑️</span></td>
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

// =============================================================================
// VIEW: CREATE GROUP
// =============================================================================
function CreateGroupView() {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description: desc })
    })
      .then(res => { if (res.ok) window.location.href = '/autopropel/groups'; else alert("Failed to save group."); })
      .catch(err => console.error("Error creating group:", err));
  };

  return (
    <section className="page-view active">
      <div className="page-header">
        <h1>Create Group</h1>
        <div className="breadcrumbs">Home &gt; Create Group</div>
      </div>
      <div className="card form-card">
        <div className="card-header"><h2>Group Parameters</h2></div>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="groupName">Group Name</label>
            <input type="text" id="groupName" placeholder="Enter group name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="groupDesc">Group Description</label>
            <textarea id="groupDesc" rows={4} placeholder="Enter description" value={desc} onChange={(e) => setDesc(e.target.value)} required></textarea>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-success">Save</button>
          </div>
        </form>
      </div>
    </section>
  );
}

// =============================================================================
// VIEW: TEST CASE LIST
// =============================================================================
function TestCaseListView() {
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [entriesLimit, setEntriesLimit] = useState(10);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState([]);

  useEffect(() => {
    setLoading(true);
    fetch('/api/test-cases')
      .then(res => res.json())
      .then(data => { setTestCases(data); setLoading(false); })
      .catch(err => { console.error("Error loading test cases:", err); setLoading(false); });
  }, []);

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedSteps([]);
      return;
    }
    setExpandedId(id);
    fetch(`/api/test-cases/${id}`)
      .then(res => res.json())
      .then(data => setExpandedSteps(data.steps || []))
      .catch(err => console.error("Error loading steps:", err));
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this test case and all its steps?')) return;
    fetch(`/api/test-cases/${id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) setTestCases(prev => prev.filter(tc => tc.id !== id));
        else alert('Failed to delete test case.');
      })
      .catch(err => console.error('Error:', err));
  };

  const filtered = testCases.filter(tc => {
    const query = search.toLowerCase().trim();
    return tc.name.toLowerCase().includes(query) || (tc.description || '').toLowerCase().includes(query);
  });

  return (
    <section className="page-view active">
      <div className="page-header">
        <h1>Test Cases</h1>
        <div className="breadcrumbs">Home &gt; Test Case List</div>
      </div>

      <div className="card card-table">
        <div className="card-header">
          <h2>All Test Cases</h2>
          <a href="/autopropel/test-cases/create" className="btn btn-primary">+ New Test Case</a>
        </div>
        <div className="table-toolbar">
          <div className="show-entries">
            Show &nbsp;
            <select value={entriesLimit} onChange={(e) => setEntriesLimit(parseInt(e.target.value))}>
              <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
            </select>
            &nbsp; entries
          </div>
          <div className="search-box">
            <label>Search: <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead><tr><th>Id</th><th>Name</th><th>Description</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr className="loading-row"><td colSpan={6}>Loading test cases...</td></tr>
              ) : filtered.length === 0 ? (
                <tr className="empty-row"><td colSpan={6}>No test cases found. <a href="/autopropel/test-cases/create" className="action-link">Create one</a></td></tr>
              ) : (
                filtered.slice(0, entriesLimit).map(tc => (
                  <>
                    <tr key={tc.id} className={expandedId === tc.id ? 'row-expanded' : ''}>
                      <td><strong>{tc.id}</strong></td>
                      <td>{tc.name}</td>
                      <td>{tc.description || '-'}</td>
                      <td><span className={`status-badge ${tc.status === 'active' ? 'success' : 'failed'}`}>{tc.status}</span></td>
                      <td>{formatTimestamp(tc.createdAt)}</td>
                      <td className="actions-cell">
                        <span className="action-link" onClick={() => toggleExpand(tc.id)} title="View Steps">👁️</span>
                        <span className="action-link danger" onClick={() => handleDelete(tc.id)} title="Delete">🗑️</span>
                      </td>
                    </tr>
                    {expandedId === tc.id && (
                      <tr key={`${tc.id}-steps`} className="expanded-detail-row">
                        <td colSpan={6}>
                          <div className="expanded-steps">
                            <h4>Test Steps ({expandedSteps.length})</h4>
                            {expandedSteps.length === 0 ? (
                              <p className="empty-text">No steps defined for this test case.</p>
                            ) : (
                              <table className="data-table small nested-table">
                                <thead><tr><th>#</th><th>Action</th><th>Locator</th><th>Value</th><th>Test Data</th><th>Description</th></tr></thead>
                                <tbody>
                                  {expandedSteps.map(step => (
                                    <tr key={step.id}>
                                      <td>{step.stepOrder}</td>
                                      <td><span className="action-badge">{step.actionName}</span></td>
                                      <td>{step.locatorType || '-'}</td>
                                      <td className="code-cell">{step.locatorValue || '-'}</td>
                                      <td>{step.testData || '-'}</td>
                                      <td>{step.description || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// VIEW: CREATE TEST CASE (with inline step builder)
// =============================================================================
function CreateTestCaseView() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState([{ actionName: '', locatorType: '', locatorValue: '', testData: '', description: '' }]);
  const [saving, setSaving] = useState(false);

  const actionOptions = [
    'navigate', 'click', 'type', 'clear', 'select', 'wait', 'assert',
    'hover', 'doubleClick', 'rightClick', 'scrollTo', 'switchFrame',
    'switchWindow', 'acceptAlert', 'dismissAlert', 'screenshot', 'executeScript'
  ];

  const locatorOptions = ['id', 'name', 'xpath', 'css', 'linkText', 'partialLinkText', 'className', 'tagName'];

  const addStep = () => {
    setSteps(prev => [...prev, { actionName: '', locatorType: '', locatorValue: '', testData: '', description: '' }]);
  };

  const removeStep = (index) => {
    if (steps.length <= 1) return;
    setSteps(prev => prev.filter((_, i) => i !== index));
  };

  const updateStep = (index, field, value) => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name,
      description,
      steps: steps.map((s, i) => ({ ...s, stepOrder: i + 1 }))
    };

    fetch('/api/test-cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (res.ok) window.location.href = '/autopropel/test-cases';
        else { alert("Failed to save test case."); setSaving(false); }
      })
      .catch(err => { console.error("Error:", err); setSaving(false); });
  };

  return (
    <section className="page-view active">
      <div className="page-header">
        <h1>Create Test Case</h1>
        <div className="breadcrumbs">Home &gt; Create Test Case</div>
      </div>

      <div className="card form-card form-card-wide">
        <div className="card-header"><h2>Test Case Details</h2></div>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="tcName">Test Case Name</label>
            <input type="text" id="tcName" placeholder="e.g. Login Flow" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="tcDesc">Description</label>
            <textarea id="tcDesc" rows={3} placeholder="What does this test case verify?" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
          </div>

          <div className="step-builder-section">
            <div className="step-builder-header">
              <h3>Test Steps</h3>
              <button type="button" className="btn btn-primary btn-sm" onClick={addStep}>+ Add Step</button>
            </div>

            {steps.map((step, index) => (
              <div key={index} className="step-row">
                <div className="step-number">{index + 1}</div>
                <div className="step-fields">
                  <select value={step.actionName} onChange={(e) => updateStep(index, 'actionName', e.target.value)} required>
                    <option value="">Action *</option>
                    {actionOptions.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <select value={step.locatorType} onChange={(e) => updateStep(index, 'locatorType', e.target.value)}>
                    <option value="">Locator Type</option>
                    {locatorOptions.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <input type="text" placeholder="Locator Value" value={step.locatorValue} onChange={(e) => updateStep(index, 'locatorValue', e.target.value)} />
                  <input type="text" placeholder="Test Data" value={step.testData} onChange={(e) => updateStep(index, 'testData', e.target.value)} />
                  <input type="text" placeholder="Step Description" value={step.description} onChange={(e) => updateStep(index, 'description', e.target.value)} />
                </div>
                <button type="button" className="step-remove" onClick={() => removeStep(index)} disabled={steps.length <= 1}>✕</button>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-success" disabled={saving}>{saving ? 'Saving...' : 'Save Test Case'}</button>
          </div>
        </form>
      </div>
    </section>
  );
}

// =============================================================================
// VIEW: TEST CASE GROUP LIST
// =============================================================================
function TestCaseGroupListView() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [entriesLimit, setEntriesLimit] = useState(10);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedCases, setExpandedCases] = useState([]);

  useEffect(() => {
    setLoading(true);
    fetch('/api/test-case-groups')
      .then(res => res.json())
      .then(data => { setGroups(data); setLoading(false); })
      .catch(err => { console.error("Error:", err); setLoading(false); });
  }, []);

  const toggleExpand = (id) => {
    if (expandedId === id) { setExpandedId(null); setExpandedCases([]); return; }
    setExpandedId(id);
    fetch(`/api/test-case-groups/${id}`)
      .then(res => res.json())
      .then(data => setExpandedCases(data.testCases || []))
      .catch(err => console.error("Error:", err));
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this test case group?')) return;
    fetch(`/api/test-case-groups/${id}`, { method: 'DELETE' })
      .then(res => { if (res.ok) setGroups(prev => prev.filter(g => g.id !== id)); else alert('Failed to delete.'); })
      .catch(err => console.error('Error:', err));
  };

  const filtered = groups.filter(g => {
    const query = search.toLowerCase().trim();
    return g.name.toLowerCase().includes(query) || (g.description || '').toLowerCase().includes(query);
  });

  return (
    <section className="page-view active">
      <div className="page-header">
        <h1>Test Case Groups</h1>
        <div className="breadcrumbs">Home &gt; Test Case Group List</div>
      </div>

      <div className="card card-table">
        <div className="card-header">
          <h2>All Test Case Groups</h2>
          <a href="/autopropel/test-case-groups/create" className="btn btn-primary">+ New Group</a>
        </div>
        <div className="table-toolbar">
          <div className="show-entries">
            Show &nbsp;
            <select value={entriesLimit} onChange={(e) => setEntriesLimit(parseInt(e.target.value))}>
              <option value={10}>10</option><option value={25}>25</option>
            </select>
            &nbsp; entries
          </div>
          <div className="search-box">
            <label>Search: <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead><tr><th>Id</th><th>Name</th><th>Description</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr className="loading-row"><td colSpan={6}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr className="empty-row"><td colSpan={6}>No test case groups found. <a href="/autopropel/test-case-groups/create" className="action-link">Create one</a></td></tr>
              ) : (
                filtered.slice(0, entriesLimit).map(g => (
                  <>
                    <tr key={g.id} className={expandedId === g.id ? 'row-expanded' : ''}>
                      <td><strong>{g.id}</strong></td>
                      <td>{g.name}</td>
                      <td>{g.description || '-'}</td>
                      <td><span className={`status-badge ${g.status === 'active' ? 'success' : 'failed'}`}>{g.status}</span></td>
                      <td>{formatTimestamp(g.createdAt)}</td>
                      <td className="actions-cell">
                        <span className="action-link" onClick={() => toggleExpand(g.id)} title="View Cases">👁️</span>
                        <span className="action-link danger" onClick={() => handleDelete(g.id)} title="Delete">🗑️</span>
                      </td>
                    </tr>
                    {expandedId === g.id && (
                      <tr key={`${g.id}-detail`} className="expanded-detail-row">
                        <td colSpan={6}>
                          <div className="expanded-steps">
                            <h4>Test Cases in Group ({expandedCases.length})</h4>
                            {expandedCases.length === 0 ? (
                              <p className="empty-text">No test cases assigned to this group.</p>
                            ) : (
                              <table className="data-table small nested-table">
                                <thead><tr><th>Order</th><th>Test Case Name</th><th>Steps</th><th>Status</th></tr></thead>
                                <tbody>
                                  {expandedCases.map((item, idx) => (
                                    <tr key={idx}>
                                      <td>{item.caseOrder + 1}</td>
                                      <td><strong>{item.testCase.name}</strong></td>
                                      <td>{(item.steps || []).length} steps</td>
                                      <td><span className={`status-badge ${item.testCase.status === 'active' ? 'success' : 'failed'}`}>{item.testCase.status}</span></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// VIEW: CREATE TEST CASE GROUP
// =============================================================================
function CreateTestCaseGroupView() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [allTestCases, setAllTestCases] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/test-cases')
      .then(res => res.json())
      .then(data => setAllTestCases(data))
      .catch(err => console.error("Error:", err));
  }, []);

  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    fetch('/api/test-case-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, testCaseIds: selectedIds })
    })
      .then(res => {
        if (res.ok) window.location.href = '/autopropel/test-case-groups';
        else { alert("Failed to save."); setSaving(false); }
      })
      .catch(err => { console.error("Error:", err); setSaving(false); });
  };

  return (
    <section className="page-view active">
      <div className="page-header">
        <h1>Create Test Case Group</h1>
        <div className="breadcrumbs">Home &gt; Create Test Case Group</div>
      </div>
      <div className="card form-card form-card-wide">
        <div className="card-header"><h2>Group Details</h2></div>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="tcgName">Group Name</label>
            <input type="text" id="tcgName" placeholder="e.g. Authentication Tests" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="tcgDesc">Description</label>
            <textarea id="tcgDesc" rows={3} placeholder="What test cases does this group contain?" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
          </div>

          <div className="form-group">
            <label>Select Test Cases ({selectedIds.length} selected)</label>
            <div className="checkbox-list">
              {allTestCases.length === 0 ? (
                <p className="empty-text">No test cases available. <a href="/autopropel/test-cases/create" className="action-link">Create one first</a></p>
              ) : (
                allTestCases.map(tc => (
                  <label key={tc.id} className={`checkbox-item ${selectedIds.includes(tc.id) ? 'selected' : ''}`}>
                    <input type="checkbox" checked={selectedIds.includes(tc.id)} onChange={() => toggleSelection(tc.id)} />
                    <span className="checkbox-label">
                      <strong>{tc.name}</strong>
                      <small>{tc.description || 'No description'}</small>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-success" disabled={saving}>{saving ? 'Saving...' : 'Save Group'}</button>
          </div>
        </form>
      </div>
    </section>
  );
}

// =============================================================================
// VIEW: TEST SUITE LIST
// =============================================================================
function TestSuiteListView() {
  const [suites, setSuites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [entriesLimit, setEntriesLimit] = useState(10);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedDetail, setExpandedDetail] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/test-suites')
      .then(res => res.json())
      .then(data => { setSuites(data); setLoading(false); })
      .catch(err => { console.error("Error:", err); setLoading(false); });
  }, []);

  const toggleExpand = (id) => {
    if (expandedId === id) { setExpandedId(null); setExpandedDetail(null); return; }
    setExpandedId(id);
    fetch(`/api/test-suites/${id}`)
      .then(res => res.json())
      .then(data => setExpandedDetail(data))
      .catch(err => console.error("Error:", err));
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this test suite?')) return;
    fetch(`/api/test-suites/${id}`, { method: 'DELETE' })
      .then(res => { if (res.ok) setSuites(prev => prev.filter(s => s.id !== id)); else alert('Failed to delete.'); })
      .catch(err => console.error('Error:', err));
  };

  const filtered = suites.filter(s => {
    const query = search.toLowerCase().trim();
    return s.name.toLowerCase().includes(query) || (s.description || '').toLowerCase().includes(query);
  });

  return (
    <section className="page-view active">
      <div className="page-header">
        <h1>Test Suites</h1>
        <div className="breadcrumbs">Home &gt; Test Suite List</div>
      </div>

      <div className="card card-table">
        <div className="card-header">
          <h2>All Test Suites</h2>
          <a href="/autopropel/test-suites/create" className="btn btn-primary">+ New Suite</a>
        </div>
        <div className="table-toolbar">
          <div className="show-entries">
            Show &nbsp;
            <select value={entriesLimit} onChange={(e) => setEntriesLimit(parseInt(e.target.value))}>
              <option value={10}>10</option><option value={25}>25</option>
            </select>
            &nbsp; entries
          </div>
          <div className="search-box">
            <label>Search: <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead><tr><th>Id</th><th>Name</th><th>Browser</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr className="loading-row"><td colSpan={6}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr className="empty-row"><td colSpan={6}>No test suites found. <a href="/autopropel/test-suites/create" className="action-link">Create one</a></td></tr>
              ) : (
                filtered.slice(0, entriesLimit).map(s => (
                  <>
                    <tr key={s.id} className={expandedId === s.id ? 'row-expanded' : ''}>
                      <td><strong>{s.id}</strong></td>
                      <td>{s.name}</td>
                      <td><span className="browser-icon">🌐</span> {s.browserType}</td>
                      <td><span className={`status-badge ${s.status === 'active' ? 'success' : 'failed'}`}>{s.status}</span></td>
                      <td>{formatTimestamp(s.createdAt)}</td>
                      <td className="actions-cell">
                        <span className="action-link" onClick={() => toggleExpand(s.id)} title="View Details">👁️</span>
                        <span className="action-link danger" onClick={() => handleDelete(s.id)} title="Delete">🗑️</span>
                      </td>
                    </tr>
                    {expandedId === s.id && expandedDetail && (
                      <tr key={`${s.id}-detail`} className="expanded-detail-row">
                        <td colSpan={6}>
                          <div className="expanded-steps">
                            <h4>Test Suite Structure</h4>
                            {(expandedDetail.groups || []).length === 0 ? (
                              <p className="empty-text">No groups assigned to this suite.</p>
                            ) : (
                              expandedDetail.groups.map((grpItem, gi) => (
                                <div key={gi} className="suite-group-block">
                                  <div className="suite-group-header">
                                    <span className="suite-group-order">{grpItem.groupOrder + 1}</span>
                                    <strong>{grpItem.group.name}</strong>
                                    <span className="suite-group-count">{(grpItem.testCases || []).length} test cases</span>
                                  </div>
                                  {(grpItem.testCases || []).map((tcItem, tci) => (
                                    <div key={tci} className="suite-case-item">
                                      <span className="suite-case-order">{tcItem.caseOrder + 1}.</span>
                                      <span>{tcItem.testCase.name}</span>
                                      <small className="suite-case-steps">{(tcItem.steps || []).length} steps</small>
                                    </div>
                                  ))}
                                </div>
                              ))
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// VIEW: CREATE TEST SUITE
// =============================================================================
function CreateTestSuiteView() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [browserType, setBrowserType] = useState('chrome');
  const [allGroups, setAllGroups] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/test-case-groups')
      .then(res => res.json())
      .then(data => setAllGroups(data))
      .catch(err => console.error("Error:", err));
  }, []);

  const toggleGroup = (id) => {
    setSelectedGroupIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    fetch('/api/test-suites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, browserType, testCaseGroupIds: selectedGroupIds })
    })
      .then(res => {
        if (res.ok) window.location.href = '/autopropel/test-suites';
        else { alert("Failed to save."); setSaving(false); }
      })
      .catch(err => { console.error("Error:", err); setSaving(false); });
  };

  return (
    <section className="page-view active">
      <div className="page-header">
        <h1>Create Test Suite</h1>
        <div className="breadcrumbs">Home &gt; Create Test Suite</div>
      </div>
      <div className="card form-card form-card-wide">
        <div className="card-header"><h2>Suite Details</h2></div>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="tsName">Suite Name</label>
            <input type="text" id="tsName" placeholder="e.g. Regression Suite" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="tsDesc">Description</label>
            <textarea id="tsDesc" rows={3} placeholder="What does this suite test?" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="tsBrowser">Browser Type</label>
            <select id="tsBrowser" value={browserType} onChange={(e) => setBrowserType(e.target.value)}>
              <option value="chrome">Chrome</option>
              <option value="firefox">Firefox</option>
              <option value="edge">Edge</option>
            </select>
          </div>

          <div className="form-group">
            <label>Select Test Case Groups ({selectedGroupIds.length} selected)</label>
            <div className="checkbox-list">
              {allGroups.length === 0 ? (
                <p className="empty-text">No test case groups available. <a href="/autopropel/test-case-groups/create" className="action-link">Create one first</a></p>
              ) : (
                allGroups.map(g => (
                  <label key={g.id} className={`checkbox-item ${selectedGroupIds.includes(g.id) ? 'selected' : ''}`}>
                    <input type="checkbox" checked={selectedGroupIds.includes(g.id)} onChange={() => toggleGroup(g.id)} />
                    <span className="checkbox-label">
                      <strong>{g.name}</strong>
                      <small>{g.description || 'No description'}</small>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-success" disabled={saving}>{saving ? 'Saving...' : 'Save Suite'}</button>
          </div>
        </form>
      </div>
    </section>
  );
}

// =============================================================================
// COMPONENT: REPORT MODAL
// =============================================================================
function ReportModal({ execId, onClose, onOpenLightbox }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/executions/${execId}`)
      .then(res => res.json())
      .then(data => { setDetail(data); setLoading(false); })
      .catch(err => { console.error("Error loading execution detail:", err); setLoading(false); });
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

  return (
    <div className="modal-overlay active">
      <div className="modal-card">
        <div className="modal-header">
          <h3>{detail ? `Execution Report: ${getTestSuiteName(detail.execution)}` : 'Loading report...'}</h3>
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
                  <span className={`meta-val status-badge ${detail.execution.status.toLowerCase()}`}>{detail.execution.status}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Started At</span>
                  <span className="meta-val">{formatTimestamp(detail.execution.createdAt)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Finished At</span>
                  <span className="meta-val">{detail.execution.finishedAt ? formatTimestamp(detail.execution.finishedAt) : 'In progress...'}</span>
                </div>
              </div>

              <div className="steps-section">
                <h4>Test Steps Breakdown</h4>
                <div className="table-responsive">
                  <table className="data-table small">
                    <thead>
                      <tr><th>Index</th><th>Action Name</th><th>Executed</th><th>Result</th><th>Error / Details</th><th>Screenshot</th></tr>
                    </thead>
                    <tbody>
                      {detail.steps.length === 0 ? (
                        <tr className="empty-row"><td colSpan={6}>No steps registered for this execution.</td></tr>
                      ) : (
                        detail.steps.map(step => {
                          const matchingScreenshot = detail.screenshots.find(sc => sc.stepResultId === step.id);
                          return (
                            <tr key={step.id}>
                              <td><strong>{step.stepIndex}</strong></td>
                              <td><span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{step.actionName}</span></td>
                              <td>{step.executedStatus === 1 ? '✅ Yes' : '❌ No'}</td>
                              <td>
                                {step.executedStatus === 1 ? (
                                  step.resultStatus === 1 ? <span className="status-badge success">PASS</span> : <span className="status-badge failed">FAIL</span>
                                ) : '-'}
                              </td>
                              <td><span style={{ fontSize: '11px', color: '#475569' }}>{step.errorJson || 'No errors'}</span></td>
                              <td>
                                {matchingScreenshot ? (
                                  <img src={`/api/screenshots/${matchingScreenshot.fileName}`} className="screenshot-thumb" alt="Thumbnail"
                                    onClick={() => onOpenLightbox(`/api/screenshots/${matchingScreenshot.fileName}`)} />
                                ) : '-'}
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
