import { useEffect, useState } from 'react';

export function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('hold'); // 'hold' | 'out'

  useEffect(() => {
    const t2 = setTimeout(() => setPhase('out'), 1600);
    const t3 = setTimeout(() => onDone(), 2100);
    return () => { clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div className={`splash-screen ${phase}`}>
      <div className="splash-inner">
        <div className="splash-logo-wrap">
          <div className="splash-logo-icon">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <circle cx="28" cy="28" r="28" fill="url(#splashGrad)" />
              <path d="M28 12 L34 24 L46 26 L37 35 L39 47 L28 41 L17 47 L19 35 L10 26 L22 24 Z"
                fill="none" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
              <circle cx="28" cy="28" r="4" fill="white" />
              <defs>
                <linearGradient id="splashGrad" x1="0" y1="0" x2="56" y2="56">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="splash-brand">Auto<span>Pilot</span></div>
        </div>
        <p className="splash-tagline">Autonomous Testing Platform</p>
      </div>
    </div>
  );
}
