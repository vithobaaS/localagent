import { toast } from '../common/ToastContainer';

export default function Header({ user, profileOpen, setProfileOpen, setSidebarOpen, setShowOnboarding, logout }) {
  return (
    <header className="top-header">
      <button className="menu-toggle" onClick={() => setSidebarOpen(o => !o)}>☰</button>
      <div className="header-right">
        {user && (
          <div className="header-user-pill" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setProfileOpen(!profileOpen)}>
            <div className="header-avatar">
              <span>{(user.fullName || user.email || 'U')[0].toUpperCase()}</span>
            </div>
            <span className="header-user-name">{user.fullName || user.email}</span>
            {profileOpen && (
              <div className="profile-dropdown">
                <button className="profile-dropdown-item" onClick={() => { setProfileOpen(false); toast('info', 'Settings', 'Settings coming soon!'); }}>⚙️ Settings</button>
                <button className="profile-dropdown-item" onClick={() => { setProfileOpen(false); setShowOnboarding(true); }}>⬇️ Install Agent</button>
                <button className="profile-dropdown-item text-danger" onClick={logout}>⎋ Sign Out</button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
