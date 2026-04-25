import React, { useEffect } from 'react';

export default function About({ cartOpen, setCartOpen }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="page-fade" style={{ paddingTop: '5rem', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <style>{`
        @media (max-width: 768px) {
          .about-hero-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .about-values-grid { grid-template-columns: 1fr !important; }
          .about-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .about-mission-box { padding: 1.5rem !important; }
          .about-mission-number { font-size: 2.5rem !important; }
          .about-section-wrap { padding: 2.5rem 1rem !important; }
        }
      `}</style>

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '5rem 1rem' }} className="about-section-wrap">
        <div className="about-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', marginBottom: '5rem' }}>
          <div>
            <h2 className="font-orbitron" style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              OUR <span style={{ color: '#0066FF' }}>DNA</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: '1.5rem', lineHeight: 1.75 }}>
              Founded in 2024, Race District was built for those who see cars as more than machines. We translate automotive design, performance, and culture into pieces that belong in your space — not just on the road.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: '1.5rem', lineHeight: 1.75 }}>
              Every piece in our collection is designed with the same attention to aerodynamics, materials science, and aesthetic boldness that defines modern racing.
            </p>
            <div className="about-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
              <div style={{ borderLeft: '4px solid #0066FF', paddingLeft: '1rem' }}>
                <div className="font-orbitron" style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>50+</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Designs</div>
              </div>
              <div style={{ borderLeft: '4px solid #0066FF', paddingLeft: '1rem' }}>
                <div className="font-orbitron" style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>10,000+</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Enthusiasts</div>
              </div>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: '#0066FF', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.1 }} />
            <div className="about-mission-box" style={{ position: 'relative', background: 'var(--bg-card)', border: '1px solid rgba(59,130,246,0.2)', padding: '2rem', borderRadius: '0.5rem' }}>
              <div className="about-mission-number font-orbitron" style={{ fontSize: '3.75rem', fontWeight: 900, color: 'rgba(0,102,255,0.2)', position: 'absolute', top: '1rem', right: '1rem' }}>01</div>
              <h3 className="font-orbitron" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>THE MISSION</h3>
              <p style={{ color: 'var(--text-secondary)' }}>To bring automotive culture into everyday spaces. We create pieces that reflect the mindset of performance — clean, intentional, and built to stand out.</p>
            </div>
          </div>
        </div>

        <div className="about-values-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '2rem' }}>
          {[
            { icon: '⚡', title: 'VELOCITY', desc: "Speed is more than motion. It's clarity, control, and staying ahead — built into every design." },
            { icon: '🎯', title: 'PRECISION', desc: 'Every detail matters. From layout to finish, each piece is designed with intention and accuracy.' },
            { icon: '🚀', title: 'INNOVATION', desc: 'We evolve with design and culture — blending modern aesthetics with timeless automotive inspiration.' }
          ].map(v => (
            <div key={v.title} style={{ background: 'var(--bg-card)', border: '1px solid rgba(59,130,246,0.1)', padding: '2rem', borderRadius: '0.5rem', transition: 'border-color 0.3s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.1)'}>
              <div style={{ width: '4rem', height: '4rem', background: 'rgba(0,102,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1.5rem' }}>{v.icon}</div>
              <h3 className="font-orbitron" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>{v.title}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}