import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg)', color: 'var(--txt)' }}>
      <header style={{ padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <div className="logo">
          <div className="logo-icon">⚡</div>
          <div className="logo-text">Auto<span>Propel</span></div>
        </div>
        <div>
          <Link to="/login" style={{ marginRight: '16px', color: 'var(--txt-muted)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          <Link to="/register" className="btn btn-primary">Try for free</Link>
        </div>
      </header>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 800, marginBottom: '24px', maxWidth: '800px', lineHeight: 1.2 }}>
          Self-hosted browser automation that scales effortlessly.
        </h1>
        <p style={{ fontSize: '20px', color: 'var(--txt-muted)', maxWidth: '600px', marginBottom: '40px', lineHeight: 1.6 }}>
          Run thousands of Selenium and Puppeteer tests using your own infrastructure. Connect headless agents from any OS and monitor them in one unified dashboard.
        </p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/register" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '18px' }}>Start your free trial 🚀</Link>
        </div>
        <div style={{ marginTop: '64px' }}>
          <img src="/autopropel/screenshot.png" alt="AutoPropel Dashboard" style={{ maxWidth: '1000px', width: '100%', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
               onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
      </main>
      <footer style={{ padding: '24px', textAlign: 'center', color: 'var(--txt-muted)', borderTop: '1px solid var(--border)' }}>
        © {new Date().getFullYear()} AutoPropel Inc. All rights reserved.
      </footer>
    </div>
  );
}
