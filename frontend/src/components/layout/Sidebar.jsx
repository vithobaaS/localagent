import { Link } from 'react-router-dom';

function NavItem({ to, icon, label, active }) {
  return (
    <Link to={to} className={`nav-item${active ? ' active' : ''}`}>
      <span className="nav-icon-wrap">{icon}</span>
      {label}
    </Link>
  );
}

export default function Sidebar({ user, sidebarOpen, path }) {
  const is = (p) => path === p;

  if (!sidebarOpen) return null;

  return (
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
            <p>{user?.orgName || 'AutoPropel Cloud'}</p>
            <span>{user?.plan ? `Plan: ${user.plan}` : 'v1.0 Beta — All systems operational'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
