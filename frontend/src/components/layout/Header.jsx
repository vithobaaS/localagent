import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, Settings, Download, Link2, LogOut } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function Header({ user, profileOpen, setProfileOpen, setSidebarOpen, setShowOnboarding, setShowPairing, logout }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="top-header">
      <button className="menu-toggle" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">
        <Menu size={18} />
      </button>
      <div className="header-right">
        {/* Theme Toggle */}
        <button className="theme-toggle-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div className="header-divider" />

        {user && (
          <div className="header-user-pill" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setProfileOpen(!profileOpen)}>
            <div className="header-avatar">
              <span>{(user.fullName || user.email || 'U')[0].toUpperCase()}</span>
            </div>
            <span className="header-user-name">{user.fullName || user.email}</span>
            {profileOpen && (
              <div className="profile-dropdown">
                <button className="profile-dropdown-item" onClick={() => { setProfileOpen(false); navigate('/settings'); }}>
                  <Settings size={14} style={{ marginRight: 8 }} />Settings
                </button>
                <button className="profile-dropdown-item" onClick={() => { setProfileOpen(false); setShowOnboarding(true); }}>
                  <Download size={14} style={{ marginRight: 8 }} />Install Agent
                </button>
                <button className="profile-dropdown-item" onClick={() => { setProfileOpen(false); setShowPairing(true); }}>
                  <Link2 size={14} style={{ marginRight: 8 }} />Pair Agent
                </button>
                <button className="profile-dropdown-item text-danger" onClick={logout}>
                  <LogOut size={14} style={{ marginRight: 8 }} />Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
