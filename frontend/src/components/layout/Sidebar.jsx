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
        <div className="nav-section">Dashboard</div>
        <NavItem to="/dashboard"            icon="📊" label="Dashboard"         active={is('/dashboard')} />

        <div className="nav-section">Executions</div>
        <NavItem to="/executions/running"   icon="▶️" label="Running"           active={is('/executions/running')} />
        <NavItem to="/executions/history"   icon="🕒" label="History"           active={is('/executions/history')} />
        <NavItem to="/scheduler"            icon="📅" label="Scheduled"         active={is('/scheduler') || is('/scheduler/create')} />

        <div className="nav-section">Test Management</div>
        <NavItem to="/test-suites"          icon="📦" label="Suites"            active={is('/test-suites')} />
        <NavItem to="/test-cases"           icon="🔍" label="Test Cases"        active={is('/test-cases') || is('/test-case-groups')} />
        <NavItem to="/variables"            icon="🔧" label="Variables"         active={is('/variables')} />
        <NavItem to="/datasets"             icon="🗄️" label="Datasets"          active={is('/datasets')} />
        <NavItem to="/environments"         icon="🌍" label="Environments"      active={is('/environments')} />

        <div className="nav-section">Agents</div>
        <NavItem to="/agents"               icon="🖥️" label="Agent Directory"   active={is('/agents')} />
        <NavItem to="/groups"               icon="🏊" label="Agent Pools"       active={path.startsWith('/groups')} />
        <button className="nav-item" onClick={() => setShowOnboarding(true)} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
          <span className="nav-icon-wrap">⬇️</span>
          Install Agent
        </button>

        <div className="nav-section">Reports</div>
        <NavItem to="/reports/executions"   icon="📈" label="Executions"        active={is('/reports/executions')} />
        <NavItem to="/reports/visual"       icon="👁️" label="Visual Regression"   active={is('/reports/visual')} />
        <NavItem to="/reports/shared"       icon="🔗" label="Shared Reports"    active={is('/reports/shared')} />

        <div className="nav-section">Administration</div>
        <NavItem to="/settings"             icon="⚙️" label="Settings"          active={is('/settings')} />
        <NavItem to="/admin/users"          icon="👥" label="Users"             active={is('/admin/users')} />
        <NavItem to="/admin/roles"          icon="🛡️" label="Roles"             active={is('/admin/roles')} />
        <NavItem to="/admin/api-keys"       icon="🔑" label="API Keys"          active={is('/admin/api-keys')} />
        <NavItem to="/admin/notifications"  icon="🔔" label="Notifications"     active={is('/admin/notifications')} />
        <NavItem to="/admin/audit-logs"     icon="📜" label="Audit Logs"        active={is('/admin/audit-logs')} />
        <NavItem to="/admin/retention"      icon="🗑️" label="Retention Policies" active={is('/admin/retention')} />
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
