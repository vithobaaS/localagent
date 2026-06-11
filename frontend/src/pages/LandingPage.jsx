import { Link } from 'react-router-dom';
import { Rocket, Activity, BrainCircuit, ShieldCheck, BarChart2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg)', color: 'var(--txt)' }}>
      <header style={{ padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <div className="logo">
          <div className="logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L14.5 9H22L16 13.5L18.5 20.5L12 16L5.5 20.5L8 13.5L2 9H9.5L12 2Z" fill="white" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
            </svg>
          </div>
          <div className="logo-text">Auto<span>Pilot</span></div>
        </div>
        <div>
          <Link to="/login" style={{ marginRight: '24px', color: 'var(--txt-h)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          <Link to="/register" className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: 'var(--r-md)' }}>Get Started</Link>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px', textAlign: 'center' }}>
        
        {/* Hero Section */}
        <div style={{ maxWidth: '900px', marginBottom: '80px' }}>
          <div style={{ display: 'inline-block', marginBottom: '16px', padding: '6px 16px', background: 'var(--brand-subtle)', color: 'var(--brand)', borderRadius: 'var(--r-xl)', fontSize: '14px', fontWeight: 600 }}>
            ✨ The Future of QA is Autonomous
          </div>
          <h1 style={{ fontSize: '56px', fontWeight: 800, color: 'var(--txt-h)', marginBottom: '24px', lineHeight: 1.15, letterSpacing: '-1px' }}>
            The Intelligent Autonomous <br /> Testing Platform
          </h1>
          <p style={{ fontSize: '20px', color: 'var(--txt-muted)', marginBottom: '40px', lineHeight: 1.6, maxWidth: '750px', margin: '0 auto 40px auto' }}>
            Ingest CI/CD test data, automatically predict release risk with our AI Decision Engine, and gate deployments without manual intervention.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Start your free trial <Rocket size={18} />
            </Link>
          </div>
        </div>

        {/* BRD Feature Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', maxWidth: '1200px', width: '100%', marginBottom: '80px', textAlign: 'left' }}>
          
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ background: 'var(--blue-bg)', color: 'var(--blue-txt)', width: '48px', height: '48px', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Activity size={24} />
            </div>
            <h3 style={{ fontSize: '18px', color: 'var(--txt-h)', fontWeight: 700, marginBottom: '12px' }}>Test Data Ingestion</h3>
            <p style={{ color: 'var(--txt-muted)', fontSize: '15px', lineHeight: 1.6 }}>
              Seamlessly connect Jenkins, GitHub Actions, and custom webhooks to stream live execution metrics into one centralized hub.
            </p>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ background: 'var(--indigo-bg)', color: 'var(--indigo-txt)', width: '48px', height: '48px', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <BarChart2 size={24} />
            </div>
            <h3 style={{ fontSize: '18px', color: 'var(--txt-h)', fontWeight: 700, marginBottom: '12px' }}>Analytics & Normalization</h3>
            <p style={{ color: 'var(--txt-muted)', fontSize: '15px', lineHeight: 1.6 }}>
              Unified dashboards normalize pass/fail rates and global coverage metrics, cutting through the noise of raw logs.
            </p>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ background: 'var(--brand-subtle)', color: 'var(--brand)', width: '48px', height: '48px', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <BrainCircuit size={24} />
            </div>
            <h3 style={{ fontSize: '18px', color: 'var(--txt-h)', fontWeight: 700, marginBottom: '12px' }}>AI Decision Engine</h3>
            <p style={{ color: 'var(--txt-muted)', fontSize: '15px', lineHeight: 1.6 }}>
              Our proprietary Rule Engine utilizes AI to predict release risks and automatically gate dangerous deployments.
            </p>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ background: 'var(--green-bg)', color: 'var(--green-txt)', width: '48px', height: '48px', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ fontSize: '18px', color: 'var(--txt-h)', fontWeight: 700, marginBottom: '12px' }}>Governance & Audit</h3>
            <p style={{ color: 'var(--txt-muted)', fontSize: '15px', lineHeight: 1.6 }}>
              Maintain compliance with immutable execution logging and strict tracking of all manual overrides and approvals.
            </p>
          </div>

        </div>

        {/* Dashboard Preview */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '1100px', borderRadius: '16px', padding: '12px', background: 'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)', border: '1px solid var(--border)' }}>
          <img src="/autopilot/screenshot.png" alt="AutoPilot Platform Dashboard" style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)' }} onError={(e) => { e.target.style.display = 'none'; }} />
        </div>

      </main>

      <footer style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--txt-muted)', borderTop: '1px solid var(--border)', fontSize: '14px' }}>
        © {new Date().getFullYear()} AutoPilot Platform. All rights reserved.
      </footer>
    </div>
  );
}
