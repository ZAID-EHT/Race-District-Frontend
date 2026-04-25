import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import FrameViewer from '../components/common/FrameViewer';

function useTypewriter(phrases) {
  const [text, setText] = useState('');
  useEffect(() => {
    let pi = 0, ci = 0, del = false;
    const tick = () => {
      const cur = phrases[pi];
      if (del) { setText(cur.substring(0, ci - 1)); ci--; }
      else { setText(cur.substring(0, ci + 1)); ci++; }
      let speed = del ? 40 : 90;
      if (!del && ci === cur.length) { speed = 2200; del = true; }
      else if (del && ci === 0) { del = false; pi = (pi + 1) % phrases.length; speed = 400; }
      setTimeout(tick, speed);
    };
    const t = setTimeout(tick, 600);
    return () => clearTimeout(t);
  }, []);
  return text;
}

function useCountUp(target, delay = 1200, duration = 1800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null, raf;
    const t = setTimeout(() => {
      const animate = (ts) => {
        if (!start) start = ts;
        const prog = Math.min((ts - start) / duration, 1);
        const ease = 1 - Math.pow(1 - prog, 3);
        setVal(Math.floor(ease * target));
        if (prog < 1) raf = requestAnimationFrame(animate);
        else setVal(target);
      };
      raf = requestAnimationFrame(animate);
    }, delay);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [target, delay, duration]);
  return val;
}

export function ProductCard({ product, featured = false }) {
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault(); e.stopPropagation();
    addToCart(product);
    setAdded(true);
    addToast(`${product.name} added to cart!`);
    setTimeout(() => setAdded(false), 1200);
  };

  const imageUrl = product.images?.[0]?.url || null;

  return (
    <Link to={`/product/${product._id || product.id}`} className="rd-product-card" style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="rd-card-img">
        {imageUrl
          ? <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hovered ? 'scale(1.07)' : 'scale(1)', transition: 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)' }} onError={e => { e.target.style.display = 'none'; }} />
          : <div style={{ fontSize: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>{product.emoji || '📦'}</div>
        }
        <div className="rd-card-overlay" style={{ opacity: hovered ? 1 : 0 }} />
      </div>
      <div className="rd-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <h3 className="rd-card-title">{product.name}</h3>
          <span className="rd-card-price">LKR {product.price?.toLocaleString()}</span>
        </div>
        <p className="rd-card-desc">{product.shortDescription || product.description}</p>
        <button className={`rd-card-btn ${added ? 'rd-card-btn--added' : ''}`} onClick={handleAdd}>
          {added ? '✓ Added' : 'Add to Garage'}
        </button>
      </div>
    </Link>
  );
}

function CarouselDotSync() {
  useEffect(() => {
    const track = document.querySelector('.rd-carousel-track');
    if (!track) return;
    const slides = track.querySelectorAll('.rd-carousel-slide');
    const dots = document.querySelectorAll('.rd-dot');
    if (!slides.length || !dots.length) return;
    dots[0]?.classList.add('active');
    const onScroll = () => {
      const center = track.scrollLeft + track.clientWidth / 2;
      let closest = 0, minDist = Infinity;
      slides.forEach((s, i) => {
        const d = Math.abs((s.offsetLeft + s.offsetWidth / 2) - center);
        if (d < minDist) { minDist = d; closest = i; }
      });
      dots.forEach((d, i) => d.classList.toggle('active', i === closest));
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, []);
  return null;
}

// ── FIXED: single transform-only cursor, no React state, no double-positioning ──
function useSmoothCursor(enabled) {
  const elRef = useRef(null);
  const rafRef = useRef(null);
  const posRef = useRef({ x: -999, y: -999 });

  useEffect(() => {
    if (!enabled) return;

    const move = (e) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current) return; // one RAF queued at a time
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (elRef.current) {
          const x = posRef.current.x - 120;
          const y = posRef.current.y - 120;
          elRef.current.style.transform = `translate3d(${x}px,${y}px,0)`;
        }
      });
    };

    window.addEventListener('mousemove', move, { passive: true });
    return () => {
      window.removeEventListener('mousemove', move);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled]);

  return elRef; // returns a ref to attach to the blob div
}

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── FIXED: cursorRef is now a DOM ref, not coordinates ──
  const cursorRef = useSmoothCursor(!isMobile);

  const typeText = useTypewriter(['Aero Optimized', 'Built for Car Culture', 'Designed for Your Space', 'Simply Fast']);
  const designCount = useCountUp(50);
  const enthusiastCount = useCountUp(10000);
  const dispatchCount = useCountUp(24);

  useEffect(() => {
    productAPI.getFeatured().then(r => setFeatured(r.data)).catch(() => {});
    productAPI.getAll({ limit: 20 })
      .then(r => setProducts(r.data.products || r.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid rgba(0,102,255,0.2)', borderTop: '3px solid #0066FF', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 1rem' }} />
        <p className="font-orbitron" style={{ color: '#0066FF', fontSize: '0.85rem', letterSpacing: '0.2em' }}>LOADING</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const displayProducts = featured.length ? featured.slice(0, 4) : products.slice(0, 4);

  return (
    <div className="rd-root">
      {/* ── FIXED: ref attached, no left/top, starts offscreen, moves via transform only ── */}
      {!isMobile && (
        <div
          ref={cursorRef}
          className="rd-cursor-blob"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: 240,
            height: 240,
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 9999,
            willChange: 'transform',
            transform: 'translate3d(-999px,-999px,0)',
          }}
        >
          <div className="rd-cursor-dot" />
        </div>
      )}

      <section className="rd-hero">
        <div className="rd-hero-bg" />

        <div className="rd-hero-inner">
          <p className="rd-eyebrow">Premium Motorsport Gear — Designed for Your Space</p>

          <h1 className="rd-headline font-orbitron">
            BUILT FOR<br/>
            <span className="rd-headline-accent">SPEED</span>
          </h1>

          <div className="rd-typewriter-row">
            <span className="rd-typewriter font-orbitron">{typeText}</span>
            <span className="rd-cursor" />
          </div>

          <p className="rd-body">
            Race District is where automotive passion meets interior design. We create premium frames inspired by performance, culture, and iconic engineering — built to elevate your space.
          </p>

          <div className="rd-ctas">
            <button className="rd-btn-primary" onClick={() => navigate('/products')}>
              SHOP NOW
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </button>
            <button className="rd-btn-secondary" onClick={() => navigate('/about')}>OUR STORY</button>
          </div>

          <div className="rd-stats">
            <div className="rd-stat">
              <span className="rd-stat-val font-orbitron">{designCount}+</span>
              <span className="rd-stat-label">Designs</span>
            </div>
            <div className="rd-stat-divider" />
            <div className="rd-stat">
              <span className="rd-stat-val font-orbitron">{enthusiastCount.toLocaleString()}+</span>
              <span className="rd-stat-label">Enthusiasts</span>
            </div>
            <div className="rd-stat-divider" />
            <div className="rd-stat">
              <span className="rd-stat-val font-orbitron">{dispatchCount}h</span>
              <span className="rd-stat-label">Dispatch</span>
            </div>
          </div>
        </div>

        <div className="rd-hero-frame-desktop">
          <div className="rd-frame-glow-desktop" />
          <div className="rd-frame-wrap-desktop">
            <FrameViewer imageSrc={null} />
          </div>
        </div>

        <div className="rd-scroll-arrow">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
        </div>
      </section>

      <section className="rd-frame-section-mobile">
        <div className="rd-frame-section-bg-mobile" />
        <div className="rd-frame-glow-mobile" />
        <div className="rd-frame-wrap-mobile">
          <FrameViewer imageSrc={null} />
        </div>
      </section>

      <section className="rd-featured">
        <div className="rd-section-head">
          <p className="rd-section-eyebrow font-orbitron">Our Collection</p>
          <h2 className="rd-section-title font-orbitron">FEATURED <span style={{ color: '#0066FF' }}>GEAR</span></h2>
          <div className="rd-section-line" />
        </div>

        <div className="rd-grid">
          {displayProducts.map(p => <ProductCard key={p._id || p.id} product={p} featured />)}
        </div>

        <div className="rd-carousel">
          <div className="rd-carousel-track">
            {displayProducts.map(p => (
              <div key={p._id || p.id} className="rd-carousel-slide">
                <ProductCard product={p} featured />
              </div>
            ))}
          </div>
          <div className="rd-dots-row">
            {displayProducts.map((_, i) => <span key={i} className="rd-dot" />)}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
          <button className="rd-btn-outline" onClick={() => navigate('/products')}>VIEW ALL PRODUCTS</button>
        </div>
      </section>

      <CarouselDotSync />

      <style>{`
        .rd-root { overflow-x: hidden; }

        /* ─── CURSOR BLOB ─── */
        .rd-cursor-blob {
          background: radial-gradient(circle, rgba(0,102,255,0.12) 0%, transparent 65%);
          mix-blend-mode: screen;
          transition: none;
        }
        @media (prefers-color-scheme: light) {
          .rd-cursor-blob {
            background: radial-gradient(circle, rgba(0,102,255,0.18) 0%, rgba(0,102,255,0.06) 50%, transparent 65%);
            mix-blend-mode: normal;
          }
        }
        .light-mode .rd-cursor-blob {
          background: radial-gradient(circle, rgba(0,102,255,0.18) 0%, rgba(0,102,255,0.06) 50%, transparent 65%) !important;
          mix-blend-mode: normal !important;
        }

        .rd-cursor-dot {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #0066FF;
          box-shadow: 0 0 12px rgba(0,102,255,0.5), 0 0 24px rgba(0,102,255,0.2);
          will-change: transform;
        }

        /* ─── HERO ─── */
        .rd-hero {
          position: relative;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          grid-template-rows: 1fr auto;
          align-items: center;
          gap: 0;
          padding: 7rem 6vw 5rem;
          box-sizing: border-box;
          overflow: hidden;
          overflow-y: visible;
        }

        .rd-hero-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 80% 60% at 60% 40%, #0a1628 0%, #050d1a 60%, #000 100%);
          z-index: 0;
        }
        @media (prefers-color-scheme: light) {
          .rd-hero-bg { background: radial-gradient(ellipse 80% 60% at 60% 40%, #c8e0ff 0%, #daeeff 50%, #eef6ff 100%); }
        }
        .light-mode .rd-hero-bg {
          background: radial-gradient(ellipse 80% 60% at 60% 40%, #c8e0ff 0%, #daeeff 50%, #eef6ff 100%) !important;
        }

        .rd-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: linear-gradient(rgba(0,102,255,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,102,255,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          z-index: 1;
          pointer-events: none;
        }

        .rd-hero::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, #0066FF 30%, #00b4ff 70%, transparent);
          z-index: 2;
        }

        .rd-hero-inner {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          gap: 1.4rem;
          grid-column: 1;
          grid-row: 1;
          max-width: 600px;
        }

        .rd-eyebrow {
          font-family: 'Orbitron', sans-serif;
          font-size: 0.68rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin: 0;
          font-weight: 400;
        }
        @media (prefers-color-scheme: light) { .rd-eyebrow { color: rgba(8,15,30,0.4); } }
        .light-mode .rd-eyebrow { color: rgba(8,15,30,0.4) !important; }

        .rd-headline {
          font-size: clamp(2.8rem, 5.5vw, 5rem);
          font-weight: 900;
          line-height: 0.95;
          color: var(--text-primary, #fff);
          margin: 0;
          letter-spacing: -0.02em;
        }
        @media (prefers-color-scheme: light) { .rd-headline { color: #080f1e; } }
        .light-mode .rd-headline { color: #080f1e !important; }

        .rd-headline-accent {
          background: linear-gradient(100deg, #2563EB 0%, #00d4ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: block;
        }

        .rd-typewriter-row {
          display: flex;
          align-items: center;
          min-height: 2.2rem;
          gap: 0.4rem;
          overflow: visible;
        }
        .rd-typewriter {
          font-size: clamp(1rem, 2.2vw, 1.4rem);
          font-weight: 300;
          color: var(--text-secondary, rgba(255,255,255,0.6));
          white-space: nowrap;
        }
        @media (prefers-color-scheme: light) { .rd-typewriter { color: #334155; } }
        .light-mode .rd-typewriter { color: #334155 !important; }

        .rd-cursor {
          display: inline-block;
          width: 3px;
          height: 1.4rem;
          background: #0066FF;
          animation: blink 1s infinite;
          flex-shrink: 0;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

        .rd-body {
          font-size: 1.05rem;
          line-height: 1.75;
          color: var(--text-secondary, rgba(255,255,255,0.65));
          margin: 0;
          max-width: 480px;
        }
        @media (prefers-color-scheme: light) { .rd-body { color: #1e293b; } }
        .light-mode .rd-body { color: #1e293b !important; }

        .rd-ctas { display: flex; gap: 1rem; flex-wrap: wrap; }

        .rd-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.9rem 2rem;
          background: #0066FF;
          color: #fff;
          font-family: 'Orbitron', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          border: none;
          cursor: pointer;
          clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
          transition: background 0.2s, transform 0.15s;
        }
        .rd-btn-primary:hover { background: #0052cc; transform: translateY(-1px); }
        .rd-btn-primary:active { transform: translateY(0); }

        .rd-btn-secondary {
          display: inline-flex;
          align-items: center;
          padding: 0.9rem 2rem;
          background: transparent;
          color: var(--text-primary, #fff);
          font-family: 'Orbitron', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          border: 1.5px solid rgba(255,255,255,0.3);
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }
        .rd-btn-secondary:hover { border-color: #0066FF; color: #0066FF; }
        @media (prefers-color-scheme: light) {
          .rd-btn-secondary { color: #080f1e; border-color: rgba(0,0,0,0.25); }
          .rd-btn-secondary:hover { border-color: #0066FF; color: #0066FF; }
        }
        .light-mode .rd-btn-secondary { color: #080f1e !important; border-color: rgba(0,0,0,0.25) !important; }
        .light-mode .rd-btn-secondary:hover { border-color: #0066FF !important; color: #0066FF !important; }

        .rd-stats {
          display: flex;
          align-items: center;
          gap: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.1);
          animation: fadeUp 0.7s ease 0.6s both;
        }
        @media (prefers-color-scheme: light) { .rd-stats { border-top-color: rgba(0,0,0,0.1); } }
        .light-mode .rd-stats { border-top-color: rgba(0,0,0,0.1) !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

        .rd-stat { display: flex; flex-direction: column; gap: 0.2rem; }
        .rd-stat-val { font-size: 2rem; font-weight: 700; color: #0066FF; line-height: 1; }
        .rd-stat-label {
          font-size: 0.68rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-muted, rgba(255,255,255,0.4));
        }
        @media (prefers-color-scheme: light) { .rd-stat-label { color: #64748b; } }
        .light-mode .rd-stat-label { color: #64748b !important; }

        .rd-stat-divider { width: 1px; height: 2.5rem; background: rgba(255,255,255,0.12); flex-shrink: 0; }
        @media (prefers-color-scheme: light) { .rd-stat-divider { background: rgba(0,0,0,0.1); } }
        .light-mode .rd-stat-divider { background: rgba(0,0,0,0.1) !important; }

        .rd-hero-frame-desktop {
          position: relative;
          z-index: 10;
          grid-column: 2;
          grid-row: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          justify-self: center;
          height: 75vh;
          max-height: 620px;
        }

        .rd-frame-glow-desktop {
          position: absolute;
          width: 260px;
          height: 260px;
          background: #0066FF;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.18;
          animation: pulse 4s ease-in-out infinite;
        }

        .rd-frame-wrap-desktop {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 460px;
          margin-top: 0;
        }
        @keyframes pulse { 0%,100%{opacity:0.18;transform:scale(1)} 50%{opacity:0.28;transform:scale(1.1)} }

        .rd-scroll-arrow {
          position: absolute;
          bottom: 1.8rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          color: rgba(0,102,255,0.7);
          animation: bounce 2.2s ease-in-out infinite;
        }
        @keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0)} 55%{transform:translateX(-50%) translateY(-8px)} }

        /* ─── MOBILE FRAME SECTION ─── */
        .rd-frame-section-mobile {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 5vw;
          box-sizing: border-box;
          overflow: hidden;
        }

        .rd-frame-section-bg-mobile {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 80% 60% at 50% 50%, #0d1a2d 0%, #050d1a 60%, #000 100%);
          z-index: 0;
        }
        @media (prefers-color-scheme: light) {
          .rd-frame-section-bg-mobile {
            background: radial-gradient(ellipse 80% 60% at 50% 50%, #d6e8ff 0%, #e8f2ff 50%, #f5faff 100%);
          }
        }
        .light-mode .rd-frame-section-bg-mobile {
          background: radial-gradient(ellipse 80% 60% at 50% 50%, #d6e8ff 0%, #e8f2ff 50%, #f5faff 100%) !important;
        }

        .rd-frame-glow-mobile {
          position: absolute;
          width: 140px;
          height: 140px;
          background: #0066FF;
          border-radius: 50%;
          filter: blur(50px);
          opacity: 0.25;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }

        .rd-frame-wrap-mobile {
          position: relative;
          z-index: 2;
          width: 85vw;
          max-width: 340px;
          margin: 0 auto;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .rd-frame-wrap-mobile > * {
          max-width: 100% !important;
          height: auto !important;
          transform: none !important;
          -webkit-transform: none !important;
          margin: 0 auto !important;
          display: block !important;
        }

        /* ─── FEATURED ─── */
        .rd-featured {
          padding: 7rem 6vw;
          background: var(--bg-primary, #050d1a);
          position: relative;
        }
        @media (prefers-color-scheme: light) { .rd-featured { background: #f0f6ff; } }
        .light-mode .rd-featured { background: #f0f6ff !important; }

        .rd-featured::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,102,255,0.4), transparent);
        }

        .rd-section-head { text-align: center; margin-bottom: 4rem; }
        .rd-section-eyebrow {
          font-size: 0.72rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #0066FF;
          margin: 0 0 0.75rem;
        }
        .rd-section-title {
          font-size: clamp(2rem, 4.5vw, 3.5rem);
          font-weight: 900;
          color: var(--text-primary, #fff);
          margin: 0 0 1.25rem;
        }
        @media (prefers-color-scheme: light) { .rd-section-title { color: #080f1e; } }
        .light-mode .rd-section-title { color: #080f1e !important; }

        .rd-section-line {
          width: 4rem;
          height: 3px;
          background: #0066FF;
          margin: 0 auto;
          clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px));
        }

        /* ─── GRID & CARDS ─── */
        .rd-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1.5rem;
        }

        .rd-product-card {
          background: var(--bg-card, #0d1929);
          border: 1px solid rgba(0,102,255,0.12);
          border-radius: 4px;
          overflow: hidden;
          transition: border-color 0.3s, transform 0.3s;
        }
        .rd-product-card:hover { border-color: rgba(0,102,255,0.4); transform: translateY(-4px); }
        @media (prefers-color-scheme: light) {
          .rd-product-card { background: #fff; border-color: rgba(0,0,0,0.08); }
          .rd-product-card:hover { border-color: rgba(0,102,255,0.35); }
        }
        .light-mode .rd-product-card { background: #fff !important; border-color: rgba(0,0,0,0.08) !important; }
        .light-mode .rd-product-card:hover { border-color: rgba(0,102,255,0.35) !important; }

        .rd-card-img {
          height: 19rem;
          background: linear-gradient(135deg, #0d1929, #111827);
          position: relative;
          overflow: hidden;
        }
        .rd-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,102,255,0.15), transparent);
          transition: opacity 0.4s;
        }
        .rd-card-body { padding: 1.25rem; }
        .rd-card-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary, #fff);
          margin: 0;
          flex: 1;
        }
        @media (prefers-color-scheme: light) { .rd-card-title { color: #080f1e; } }
        .light-mode .rd-card-title { color: #080f1e !important; }

        .rd-card-price {
          font-family: 'Orbitron', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #0066FF;
          white-space: nowrap;
        }
        .rd-card-desc {
          font-size: 0.875rem;
          color: var(--text-secondary, rgba(255,255,255,0.5));
          margin: 0.4rem 0 1rem;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @media (prefers-color-scheme: light) { .rd-card-desc { color: #475569; } }
        .light-mode .rd-card-desc { color: #475569 !important; }

        .rd-card-btn {
          width: 100%;
          padding: 0.6rem;
          background: transparent;
          border: 1px solid rgba(0,102,255,0.35);
          color: #0066FF;
          font-family: 'Orbitron', sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.25s;
        }
        .rd-card-btn:hover { background: #0066FF; color: #fff; border-color: #0066FF; }
        .rd-card-btn--added { background: #059669 !important; color: #fff !important; border-color: #059669 !important; }

        .rd-btn-outline {
          padding: 0.9rem 3rem;
          background: transparent;
          border: 1.5px solid #0066FF;
          color: #0066FF;
          font-family: 'Orbitron', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
        }
        .rd-btn-outline:hover { background: #0066FF; color: #fff; }

        /* ─── CAROUSEL ─── */
        .rd-carousel { display: none; }
        .rd-carousel-track {
          display: flex;
          overflow-x: scroll;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          gap: 1rem;
          padding: 0 1rem 1rem;
          scrollbar-width: none;
        }
        .rd-carousel-track::-webkit-scrollbar { display: none; }
        .rd-carousel-slide {
          flex: 0 0 80vw;
          max-width: 320px;
          scroll-snap-align: center;
          border-radius: 4px;
          overflow: hidden;
        }
        .rd-dots-row { display: flex; justify-content: center; gap: 0.5rem; margin-top: 1.25rem; }
        .rd-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          transition: all 0.3s;
          display: inline-block;
        }
        .rd-dot.active { background: #0066FF; width: 24px; border-radius: 4px; }
        @media (prefers-color-scheme: light) { .rd-dot { background: rgba(0,0,0,0.15); } }
        .light-mode .rd-dot { background: rgba(0,0,0,0.15) !important; }

        /* ─── BREAKPOINTS ─── */
        @media (min-width: 900px) {
          .rd-hero { min-height: 100vh; height: auto; padding-bottom: 5rem; }
          .rd-carousel { display: none !important; }
          .rd-frame-section-mobile { display: none; }
        }

        @media (max-width: 900px) and (min-width: 601px) {
          .rd-hero {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto;
            padding: 5rem 6vw 2rem;
            text-align: center;
            gap: 2rem;
          }
          .rd-hero-inner { align-items: center; max-width: 100%; grid-column: 1; grid-row: 1; }
          .rd-hero-frame-desktop { grid-column: 1; grid-row: 2; height: 50vh; max-height: 400px; }
          .rd-frame-wrap-desktop { max-width: 360px; margin-top: 0; }
          .rd-ctas { justify-content: center; }
          .rd-stats { justify-content: center; }
          .rd-grid { grid-template-columns: repeat(2, 1fr); }
          .rd-carousel { display: none; }
          .rd-grid { display: grid !important; }
          .rd-frame-section-mobile { display: flex; }
        }

        @media (max-width: 600px) {
          .rd-hero {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 7.5rem 5vw 3rem;
            min-height: unset;
            height: auto;
            gap: 0;
            text-align: center;
            overflow: visible;
          }
          .rd-hero-bg { position: absolute; }
          .rd-hero-inner {
            order: 0;
            position: relative;
            z-index: 10;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            gap: 0.6rem;
            width: 100%;
            max-width: 100%;
            grid-column: unset;
            grid-row: unset;
          }
          .rd-eyebrow { display: block !important; visibility: visible !important; opacity: 1 !important; margin-top: 0.5rem; }
          .rd-headline { font-size: clamp(2rem, 9vw, 2.8rem); }
          .rd-body { font-size: 0.93rem; line-height: 1.65; max-width: 100%; width: 100%; padding: 0 0.5rem; }
          .rd-ctas { justify-content: center; flex-wrap: wrap; }
          .rd-stats { justify-content: center; gap: 1rem; flex-wrap: nowrap; width: 100%; padding-top: 1rem; }
          .rd-stat-val { font-size: 1.4rem; }
          .rd-stat-label { font-size: 0.58rem; }
          .rd-stat-divider { height: 1.6rem; }
          .rd-hero-frame-desktop { display: none; }
          .rd-cursor { display: none !important; }
          .rd-scroll-arrow { display: none; }
          .rd-grid { display: none !important; }
          .rd-carousel { display: block; }
          .rd-featured { padding: 3.5rem 0; }
          .rd-section-head { padding: 0 5vw; }
          .rd-frame-section-mobile { display: flex; }
        }

        @media (max-width: 380px) {
          .rd-headline { font-size: 1.85rem; }
          .rd-stat-val { font-size: 1.2rem; }
          .rd-stats { gap: 0.7rem; }
          .rd-frame-wrap-mobile { width: 82vw; }
        }
      `}</style>
    </div>
  );
}