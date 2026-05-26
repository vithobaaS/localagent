import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [view, setView] = useState('dashboard');
  const [stubTitle, setStubTitle] = useState('');
  const [stubBreadcrumbs, setStubBreadcrumbs] = useState('');

  // Lists State
  const [executions, setExecutions] = useState([]);
  const [schedulers, setSchedulers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter State
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [dashboardEntries, setDashboardEntries] = useState(10);
  const [schedulerEntries, setSchedulerEntries] = useState(10);
  const [groupsSearch, setGroupsSearch] = useState('');
  const [groupEntries, setGroupEntries] = useState(10);

  // Form State
  const [newScheduler, setNewScheduler] = useState({
    testSuiteName: '',
    executionType: '',
    browserType: '',
    status: ''
  });
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: ''
  });

  // Modal / Detail State
  const [selectedExecId, setSelectedExecId] = useState(null);
  const [execDetail, setExecDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  // Sidebar responsive state
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // -------------------------------------------------------------
  // DATA FETCHING
  // -------------------------------------------------------------
  const fetchExecutions = () => {
    setLoading(true);
    fetch('/api/executions')
      .then(res => res.json())
      .then(data => {
        setExecutions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching executions:", err);
        setLoading(false);
      });
  };

  const fetchSchedulers = () => {
    setLoading(true);
    fetch('/api/schedulers')
      .then(res => res.json())
      .then(data => {
        setSchedulers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching schedulers:", err);
        setLoading(false);
      });
  };

  const fetchGroups = () => {
    setLoading(true);
    fetch('/api/groups')
      .then(res => res.json())
      .then(data => {
        setGroups(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching groups:", err);
        setLoading(false);
      });
  };

  const fetchExecutionDetail = (id) => {
    setLoadingDetail(true);
    fetch(`/api/executions/${id}`)
      .then(res => res.json())
      .then(data => {
        setExecDetail(data);
        setLoadingDetail(false);
      })
      .catch(err => {
        console.error("Error fetching execution detail:", err);
        setLoadingDetail(false);
      });
  };

  // Load data based on view
  useEffect(() => {
    if (view === 'dashboard') {
      fetchExecutions();
    } else if (view === 'list-scheduler') {
      fetchSchedulers();
    } else if (view === 'list-groups') {
      fetchGroups();
    }
  }, [view]);

  // Load modal details when selectedExecId changes
  useEffect(() => {
    if (selectedExecId) {
      fetchExecutionDetail(selectedExecId);
    } else {
      setExecDetail(null);
    }
  }, [selectedExecId]);

  // Helper formatting functions
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

  // Navigation handlers
  const handleNavClick = (viewId, isStub = false, title = '', breadcrumb = '') => {
    if (isStub) {
      setStubTitle(title);
      setStubBreadcrumbs(breadcrumb);
      setView('stub');
    } else {
      setView(viewId);
    }
  };

  // Form submits
  const handleCreateScheduler = (e) => {
    e.preventDefault();
    fetch('/api/schedulers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newScheduler)
    })
      .then(res => {
        if (res.ok) {
          setNewScheduler({ testSuiteName: '', executionType: '', browserType: '', status: '' });
          setView('list-scheduler');
        } else {
          alert("Failed to save scheduler. Please check inputs.");
        }
      })
      .catch(err => {
        console.error("Error creating scheduler:", err);
        alert("Connection error saving scheduler.");
      });
  };

  const handleCreateGroup = (e) => {
    e.preventDefault();
    fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGroup)
    })
      .then(res => {
        if (res.ok) {
          setNewGroup({ name: '', description: '' });
          setView('list-groups');
        } else {
          alert("Failed to save group.");
        }
      })
      .catch(err => {
        console.error("Error creating group:", err);
        alert("Connection error saving group.");
      });
  };

  // Filtering Logic
  const filteredExecutions = executions.filter(exec => {
    const name = getTestSuiteName(exec).toLowerCase();
    const status = exec.status.toLowerCase();
    const id = exec.id.toString();
    const query = dashboardSearch.toLowerCase().trim();
    return name.includes(query) || status.includes(query) || id.includes(query);
  });

  const filteredGroups = groups.filter(grp => {
    const name = grp.name.toLowerCase();
    const desc = (grp.description || '').toLowerCase();
    const query = groupsSearch.toLowerCase().trim();
    return name.includes(query) || desc.includes(query);
  });

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
            <a href="#" className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => handleNavClick('dashboard')}>
              <span className="nav-icon">📊</span> Dashboard
            </a>

            {/* SCHEDULER */}
            <div className="nav-section">SCHEDULER</div>
            <a href="#" className={`nav-item ${view === 'create-scheduler' ? 'active' : ''}`} onClick={() => handleNavClick('create-scheduler')}>
              <span className="nav-icon">📅</span> Create scheduler
            </a>
            <a href="#" className={`nav-item ${view === 'list-scheduler' ? 'active' : ''}`} onClick={() => handleNavClick('list-scheduler')}>
              <span className="nav-icon">📋</span> List scheduler
            </a>

            {/* TEST SUITE */}
            <div className="nav-section">TEST SUITE</div>
            <a href="#" className={`nav-item ${stubTitle === 'Create Test Suite' && view === 'stub' ? 'active' : ''}`} 
               onClick={() => handleNavClick('stub', true, 'Create Test Suite', 'Home > Create Test Suite')}>
              <span className="nav-icon">📦</span> Create Test Suite
            </a>
            <a href="#" className={`nav-item ${stubTitle === 'Test Suite List' && view === 'stub' ? 'active' : ''}`} 
               onClick={() => handleNavClick('stub', true, 'Test Suite List', 'Home > Test Suite List')}>
              <span className="nav-icon">👁️</span> Test Suite List
            </a>

            {/* TEST CASE */}
            <div className="nav-section">TEST CASE</div>
            <a href="#" className={`nav-item ${stubTitle === 'Create Test Case' && view === 'stub' ? 'active' : ''}`} 
               onClick={() => handleNavClick('stub', true, 'Create Test Case', 'Home > Create Test Case')}>
              <span className="nav-icon">📝</span> Create Test Case
            </a>
            <a href="#" className={`nav-item ${stubTitle === 'Test Case List' && view === 'stub' ? 'active' : ''}`} 
               onClick={() => handleNavClick('stub', true, 'Test Case List', 'Home > Test Case List')}>
              <span className="nav-icon">🔎</span> Test Case List
            </a>

            {/* GROUPS */}
            <div className="nav-section">GROUPS</div>
            <a href="#" className={`nav-item ${view === 'create-groups' ? 'active' : ''}`} onClick={() => handleNavClick('create-groups')}>
              <span className="nav-icon">👥</span> Create Groups
            </a>
            <a href="#" className={`nav-item ${view === 'list-groups' ? 'active' : ''}`} onClick={() => handleNavClick('list-groups')}>
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
              <span>Suresh Kumar S</span>
            </div>
          </div>
        </header>

        {/* Dynamic Pages Container */}
        <div className="page-container">
          
          {/* VIEW: Dashboard */}
          {view === 'dashboard' && (
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
                    <select value={dashboardEntries} onChange={(e) => setDashboardEntries(parseInt(e.target.value))}>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    &nbsp; entries
                  </div>
                  <div className="search-box">
                    <label>
                      Search: 
                      <input type="text" value={dashboardSearch} onChange={(e) => setDashboardSearch(e.target.value)} />
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
                      ) : filteredExecutions.length === 0 ? (
                        <tr className="empty-row">
                          <td colSpan={6}>No executions found.</td>
                        </tr>
                      ) : (
                        filteredExecutions.slice(0, dashboardEntries).map(exec => {
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
                              <td>
                                <a className="action-link" onClick={() => setSelectedExecId(exec.id)}>View</a>
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
                    Showing 1 to {Math.min(filteredExecutions.length, dashboardEntries)} of {filteredExecutions.length} entries
                  </div>
                  <div className="pagination-buttons">
                    <button className="btn btn-pagination" disabled>Previous</button>
                    <button className="btn btn-pagination active">1</button>
                    <button className="btn btn-pagination" disabled>Next</button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* VIEW: Create Scheduler */}
          {view === 'create-scheduler' && (
            <section className="page-view active">
              <div className="page-header">
                <h1>Request</h1>
                <div className="breadcrumbs">Home &gt; Create Test Case</div>
              </div>

              <div className="card form-card">
                <div className="card-header">
                  <h2>Basic Details</h2>
                </div>
                <form onSubmit={handleCreateScheduler}>
                  <div className="form-group">
                    <label htmlFor="schedTestSuiteName">Test Suit Name</label>
                    <select 
                      id="schedTestSuiteName" 
                      value={newScheduler.testSuiteName}
                      onChange={(e) => setNewScheduler({ ...newScheduler, testSuiteName: e.target.value })}
                      required
                    >
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
                    <select 
                      id="schedExecutionType"
                      value={newScheduler.executionType}
                      onChange={(e) => setNewScheduler({ ...newScheduler, executionType: e.target.value })}
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="now">now</option>
                      <option value="scheduled">scheduled</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="schedBrowser">Browser</label>
                    <select 
                      id="schedBrowser"
                      value={newScheduler.browserType}
                      onChange={(e) => setNewScheduler({ ...newScheduler, browserType: e.target.value })}
                      required
                    >
                      <option value="">Select Browser</option>
                      <option value="chrome">chrome</option>
                      <option value="firefox">firefox</option>
                      <option value="safari">safari</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="schedStatus">Status</label>
                    <select 
                      id="schedStatus"
                      value={newScheduler.status}
                      onChange={(e) => setNewScheduler({ ...newScheduler, status: e.target.value })}
                      required
                    >
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
          )}

          {/* VIEW: List Scheduler */}
          {view === 'list-scheduler' && (
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
                    <select value={schedulerEntries} onChange={(e) => setSchedulerEntries(parseInt(e.target.value))}>
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
                        schedulers.slice(0, schedulerEntries).map(sched => (
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
          )}

          {/* VIEW: Create Groups */}
          {view === 'create-groups' && (
            <section className="page-view active">
              <div className="page-header">
                <h1>Create Group</h1>
                <div className="breadcrumbs">Home &gt; Create Group</div>
              </div>

              <div className="card form-card">
                <div className="card-header">
                  <h2>Group Parameters</h2>
                </div>
                <form onSubmit={handleCreateGroup}>
                  <div className="form-group">
                    <label htmlFor="groupName">Group Name</label>
                    <input 
                      type="text" 
                      id="groupName" 
                      placeholder="e.g. dfgsdasdf_suresh"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="groupDesc">Group Description</label>
                    <textarea 
                      id="groupDesc" 
                      rows={4} 
                      placeholder="e.g. sdfgfdsgdsfgasdf_sureshK"
                      value={newGroup.description}
                      onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-success">Save</button>
                  </div>
                </form>
              </div>
            </section>
          )}

          {/* VIEW: List Groups */}
          {view === 'list-groups' && (
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
                    <select value={groupEntries} onChange={(e) => setGroupEntries(parseInt(e.target.value))}>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                    </select>
                    &nbsp; entries
                  </div>
                  <div className="search-box">
                    <label>
                      Search: 
                      <input type="text" value={groupsSearch} onChange={(e) => setGroupsSearch(e.target.value)} />
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
                      ) : filteredGroups.length === 0 ? (
                        <tr className="empty-row">
                          <td colSpan={6}>No groups found.</td>
                        </tr>
                      ) : (
                        filteredGroups.slice(0, groupEntries).map(grp => (
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
          )}

          {/* VIEW: Stub */}
          {view === 'stub' && (
            <section className="page-view active">
              <div className="page-header">
                <h1>{stubTitle}</h1>
                <div className="breadcrumbs">{stubBreadcrumbs}</div>
              </div>
              <div className="card">
                <div className="stub-content">
                  <span className="stub-icon">🚀</span>
                  <h3>Coming Soon!</h3>
                  <p>This module is part of the next release sprint and will be fully connected shortly.</p>
                </div>
              </div>
            </section>
          )}

        </div>
      </main>

      {/* REPORT DETAILS MODAL */}
      {selectedExecId && (
        <div className="modal-overlay active">
          <div className="modal-card">
            <div className="modal-header">
              <h3>
                {execDetail ? `Execution Report: ${getTestSuiteName(execDetail.execution)}` : 'Loading report...'}
              </h3>
              <button className="modal-close" onClick={() => setSelectedExecId(null)}>&times;</button>
            </div>
            <div className="modal-body">
              {loadingDetail || !execDetail ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Loading execution report step details...
                </div>
              ) : (
                <>
                  <div className="execution-meta-grid">
                    <div className="meta-item">
                      <span className="meta-label">Execution ID</span>
                      <span className="meta-val">{execDetail.execution.id}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Status</span>
                      <span className={`meta-val status-badge ${execDetail.execution.status.toLowerCase()}`}>
                        {execDetail.execution.status}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Started At</span>
                      <span className="meta-val">{formatTimestamp(execDetail.execution.createdAt)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Finished At</span>
                      <span className="meta-val">
                        {execDetail.execution.finishedAt ? formatTimestamp(execDetail.execution.finishedAt) : 'In progress...'}
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
                          {execDetail.steps.length === 0 ? (
                            <tr className="empty-row">
                              <td colSpan={6}>No steps registered for this execution.</td>
                            </tr>
                          ) : (
                            execDetail.steps.map(step => {
                              const matchingScreenshot = execDetail.screenshots.find(
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
                                        onClick={() => setLightboxSrc(`/api/screenshots/${matchingScreenshot.fileName}`)}
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

export default App;
