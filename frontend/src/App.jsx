import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import './App.css';

import { AuthContext } from './context/AuthContext';
import { getUser } from './api/apiClient';
import { ToastContainer } from './components/common/ToastContainer';
import { PrivateRoute } from './components/common/PrivateRoute';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import { InstallAgentModal } from './components/modals/InstallAgentModal';
import { ExecutionReportModal } from './components/modals/ExecutionReportModal';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardView from './pages/dashboard/DashboardView';
import TestCaseListView from './pages/testcase/TestCaseListView';
import TestCaseFormView from './pages/testcase/TestCaseFormView';
import TestCaseGroupListView from './pages/testcasegroup/TestCaseGroupListView';
import TestCaseGroupFormView from './pages/testcasegroup/TestCaseGroupFormView';
import TestSuiteListView from './pages/testsuite/TestSuiteListView';
import TestSuiteFormView from './pages/testsuite/TestSuiteFormView';
import SchedulerListView from './pages/scheduler/SchedulerListView';
import SchedulerFormView from './pages/scheduler/SchedulerFormView';
import GroupsListView from './pages/agents/GroupsListView';
import CreateGroupView from './pages/agents/CreateGroupView';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [execId, setExecId] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [user, setUser] = useState(getUser);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const location = useLocation();
  const path = location.pathname;
  const navigate = useNavigate();

  const closeOnboarding = () => {
    setShowOnboarding(false);
    if (user) {
      localStorage.setItem(`onboarding_dismissed_${user.email}`, 'true');
    }
  };

  const logout = () => {
    localStorage.removeItem('ap_token');
    localStorage.removeItem('ap_user');
    localStorage.removeItem('onboarding_dismissed');
    setUser(null);
    navigate('/login', { replace: true });
    setTimeout(() => window.location.reload(), 50);
  };

  // Public routes — don't show the shell
  if (path === '/login' || path === '/register' || path === '/') {
    return (
      <AuthContext.Provider value={{ user, setUser }}>
        <Routes>
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
        <ToastContainer />
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, setShowOnboarding }}>
    <div className="app-layout">
      <Sidebar user={user} sidebarOpen={sidebarOpen} path={path} />

      <main className="main-content">
        <Header
          user={user}
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          setSidebarOpen={setSidebarOpen}
          setShowOnboarding={setShowOnboarding}
          logout={logout}
        />

        <div className="page-container">
          <Routes>
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/"                        element={<PrivateRoute><Navigate to="/dashboard" replace /></PrivateRoute>} />
            <Route path="/dashboard"               element={<PrivateRoute><DashboardView onSelectExec={setExecId} /></PrivateRoute>} />
            <Route path="/scheduler"               element={<PrivateRoute><SchedulerListView /></PrivateRoute>} />
            <Route path="/scheduler/create"        element={<PrivateRoute><SchedulerFormView /></PrivateRoute>} />
            <Route path="/scheduler/edit/:id"      element={<PrivateRoute><SchedulerFormView /></PrivateRoute>} />
            <Route path="/groups"                  element={<PrivateRoute><GroupsListView /></PrivateRoute>} />
            <Route path="/groups/create"           element={<PrivateRoute><CreateGroupView /></PrivateRoute>} />
            <Route path="/test-cases"              element={<PrivateRoute><TestCaseListView /></PrivateRoute>} />
            <Route path="/test-cases/create"       element={<PrivateRoute><TestCaseFormView /></PrivateRoute>} />
            <Route path="/test-cases/edit/:id"     element={<PrivateRoute><TestCaseFormView /></PrivateRoute>} />
            <Route path="/test-case-groups"        element={<PrivateRoute><TestCaseGroupListView /></PrivateRoute>} />
            <Route path="/test-case-groups/create" element={<PrivateRoute><TestCaseGroupFormView /></PrivateRoute>} />
            <Route path="/test-case-groups/edit/:id" element={<PrivateRoute><TestCaseGroupFormView /></PrivateRoute>} />
            <Route path="/test-suites"             element={<PrivateRoute><TestSuiteListView /></PrivateRoute>} />
            <Route path="/test-suites/create"      element={<PrivateRoute><TestSuiteFormView /></PrivateRoute>} />
            <Route path="/test-suites/edit/:id"    element={<PrivateRoute><TestSuiteFormView /></PrivateRoute>} />
            <Route path="*"                        element={<PrivateRoute><Navigate to="/dashboard" replace /></PrivateRoute>} />
          </Routes>
        </div>
      </main>

      {showOnboarding && <InstallAgentModal onClose={closeOnboarding} />}

      {execId && <ExecutionReportModal execId={execId} onClose={() => setExecId(null)} onLightbox={setLightbox} />}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <div className="lightbox-close" onClick={() => setLightbox(null)}>✕</div>
          <img src={lightbox} className="lightbox-img" alt="Screenshot" />
        </div>
      )}
      <ToastContainer />
    </div>
    </AuthContext.Provider>
  );
}
