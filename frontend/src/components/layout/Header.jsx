import { toast } from '../common/ToastContainer';
import { useNavigate } from 'react-router-dom';

export default function Header({ user, profileOpen, setProfileOpen, setSidebarOpen, setShowOnboarding, setShowPairing, logout }) {
  const navigate = useNavigate();
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
                <button className="profile-dropdown-item" onClick={() => { setProfileOpen(false); navigate('/settings'); }}>⚙️ Settings</button>
                <button className="profile-dropdown-item" onClick={() => { setProfileOpen(false); setShowOnboarding(true); }}>⬇️ Install Agent</button>
                <button className="profile-dropdown-item" onClick={() => { setProfileOpen(false); setShowPairing(true); }}>🔗 Pair Agent</button>
                <button className="profile-dropdown-item text-danger" onClick={logout}>⎋ Sign Out</button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
