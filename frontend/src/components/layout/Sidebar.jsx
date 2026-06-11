import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import {
  LayoutDashboard, Play, History, CalendarClock,
  PackageOpen, FlaskConical, SlidersHorizontal, Database, Globe,
  MonitorDot, Users2, Download,
  BarChart2, Eye, Share2,
  Settings, Users, ShieldCheck, KeyRound, Bell, ScrollText, Trash2, LogOut
} from 'lucide-react';

function NavItem({ to, icon: Icon, label, active, onClick }) {
  if (onClick) {
    return (
      <button className={`nav-item${active ? ' active' : ''}`} onClick={onClick} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
        <span className="nav-icon-wrap"><Icon size={16} /></span>
        {label}
      </button>
    );
  }
  return (
    <Link to={to} className={`nav-item${active ? ' active' : ''}`}>
      <span className="nav-icon-wrap"><Icon size={16} /></span>
      {label}
    </Link>
  );
}

export default function Sidebar({ user, sidebarOpen, path }) {
  const { setShowOnboarding, logout } = useContext(AuthContext);
  const is = (p) => path === p;

  if (!sidebarOpen) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L14.5 9H22L16 13.5L18.5 20.5L12 16L5.5 20.5L8 13.5L2 9H9.5L12 2Z"
                fill="white" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
            </svg>
          </div>
          <div className="logo-text">Auto<span>Pilot</span></div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">Dashboard</div>
        <NavItem to="/dashboard"           icon={LayoutDashboard} label="Dashboard"        active={is('/dashboard')} />

        <div className="nav-section">Executions</div>
        <NavItem to="/executions/running"  icon={Play}            label="Running"          active={is('/executions/running')} />
        <NavItem to="/executions/history"  icon={History}         label="History"          active={is('/executions/history')} />
        <NavItem to="/scheduler"           icon={CalendarClock}   label="Scheduled"        active={is('/scheduler') || is('/scheduler/create')} />

        <div className="nav-section">Test Management</div>
        <NavItem to="/test-suites"         icon={PackageOpen}     label="Suites"           active={is('/test-suites')} />
        <NavItem to="/test-cases"          icon={FlaskConical}    label="Test Cases"       active={is('/test-cases') || is('/test-case-groups')} />
        <NavItem to="/variables"           icon={SlidersHorizontal} label="Variables"      active={is('/variables')} />
        <NavItem to="/datasets"            icon={Database}        label="Datasets"         active={is('/datasets')} />
        <NavItem to="/environments"        icon={Globe}           label="Environments"     active={is('/environments')} />

        <div className="nav-section">Agents</div>
        <NavItem to="/agents"              icon={MonitorDot}      label="Agent Directory"  active={is('/agents')} />
        <NavItem to="/groups"              icon={Users2}          label="Agent Pools"      active={path.startsWith('/groups')} />
        <NavItem                           icon={Download}        label="Install Agent"    onClick={() => setShowOnboarding(true)} />

        <div className="nav-section">Reports</div>
        <NavItem to="/reports/executions"  icon={BarChart2}       label="Executions"       active={is('/reports/executions')} />
        <NavItem to="/reports/visual"      icon={Eye}             label="Visual Regression" active={is('/reports/visual')} />
        <NavItem to="/reports/shared"      icon={Share2}          label="Shared Reports"   active={is('/reports/shared')} />

        <div className="nav-section">Administration</div>
        <NavItem to="/settings"            icon={Settings}        label="Settings"         active={is('/settings')} />
        <NavItem to="/admin/users"         icon={Users}           label="Users"            active={is('/admin/users')} />
        <NavItem to="/admin/roles"         icon={ShieldCheck}     label="Roles"            active={is('/admin/roles')} />
        <NavItem to="/admin/api-keys"      icon={KeyRound}        label="API Keys"         active={is('/admin/api-keys')} />
        <NavItem to="/admin/notifications" icon={Bell}            label="Notifications"    active={is('/admin/notifications')} />
        <NavItem to="/admin/audit-logs"    icon={ScrollText}      label="Audit Logs"       active={is('/admin/audit-logs')} />
        <NavItem to="/admin/retention"     icon={Trash2}          label="Retention Policies" active={is('/admin/retention')} />
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-inner" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 8px'}}>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <div className="footer-dot" style={{width: 8, height: 8, borderRadius: '50%', background: '#059669', marginRight: 10}} />
            <div className="footer-text">
              <p style={{color: '#fff', fontWeight: 600, fontSize: '13px', margin: 0, textTransform: 'lowercase'}}>{user?.fullName || user?.email || 'User'}</p>
              <span style={{color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block'}}>{user?.plan ? `Plan: ${user.plan}` : 'Plan: trial'}</span>
            </div>
          </div>
          <button onClick={logout} style={{background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center'}} title="Log Out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
