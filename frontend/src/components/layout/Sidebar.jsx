import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

function NavItem({ to, icon, label, active }) {
  return (
    <Link to={to} className={`nav-item${active ? ' active' : ''}`}>
      <span className="nav-icon-wrap">{icon}</span>
      {label}
    </Link>
  );
}

export default function Sidebar({ user, sidebarOpen, path }) {
  const { setShowOnboarding } = useContext(AuthContext);
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

        <div className="nav-section">Executions</div>
        <NavItem to="/scheduler"            icon="📅" label="Scheduled Jobs"    active={is('/scheduler')} />
        <NavItem to="/scheduler/create"     icon="➕" label="New Schedule"      active={is('/scheduler/create')} />

        <div className="nav-section">Test Management</div>
        <NavItem to="/test-suites"          icon="📦" label="Test Suites"       active={is('/test-suites')} />
        <NavItem to="/test-case-groups"     icon="📂" label="Test Groups"       active={is('/test-case-groups')} />
        <NavItem to="/test-cases"           icon="🔍" label="Test Cases"        active={is('/test-cases')} />
        <NavItem to="/variables"            icon="🔧" label="Variables"         active={is('/variables')} />
        <NavItem to="/environments"         icon="🌍" label="Environments"      active={is('/environments')} />

        <div className="nav-section">Agents</div>
        <NavItem to="/groups"               icon="🖥️" label="Agent Groups"      active={is('/groups')} />
        <button className="nav-item" onClick={() => setShowOnboarding(true)} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
          <span className="nav-icon-wrap">⬇️</span>
          Install Agent
        </button>

        <div className="nav-section">Administration</div>
        <NavItem to="/settings"             icon="⚙️" label="Settings"          active={is('/settings')} />
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
