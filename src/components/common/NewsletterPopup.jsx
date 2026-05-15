// frontend/src/components/common/NewsletterPopup.jsx
//
// RD.png placement: put it at  frontend/public/assets/RD.webp
// It is referenced as /assets/RD.webp (served as a static file from /public in both dev & prod)
//
// Logic:
//   • Waits 7 s after page fully loads, then appears
//   • Never shows if user is logged in
//   • Shows on first visit; then only again after 7 days
//   • Follows the site theme (light / dark) in real time
//   • "Sign Up Now" → /login
//   • Click backdrop → dismiss (same 7-day cooldown)
//   • Does NOT appear on /admin/* routes

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const STORAGE_KEY   = 'rd_popup_last_seen';
const SHOW_DELAY_MS = 7_000;
const COOLDOWN_MS   = 7 * 24 * 60 * 60 * 1000;

export default function NewsletterPopup() {
  const { isAuthenticated, loading }     = useAuth();
  const navigate                         = useNavigate();
  const { pathname }                     = useLocation();

  const [visible,  setVisible]  = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [isLight,  setIsLight]  = useState(
    () => document.body.classList.contains('light-mode')
  );

  // Ref so the timer is only ever started ONCE after auth resolves
  const timerStarted = useRef(false);

  /* ── Effect 1: theme + resize listeners (always active, no auth deps) ── */
  useEffect(() => {
    const onMutation = () =>
      setIsLight(document.body.classList.contains('light-mode'));
    const mutObs = new MutationObserver(onMutation);
    mutObs.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);

    return () => {
      mutObs.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []); // runs once only

  /* ── Effect 2: popup timer — starts ONCE, only after auth finishes loading ── */
  useEffect(() => {
    // Still loading auth state — wait, don't touch the timer yet
    if (loading) return;

    // Already started — don't let auth re-renders reset the 7-second clock
    if (timerStarted.current) return;

    // Logged in or admin page — never show
    if (isAuthenticated) return;
    if (pathname.startsWith('/admin')) return;

    // Cooldown check (7-day gap)
    const last = localStorage.getItem(STORAGE_KEY);
    if (last && Date.now() - parseInt(last, 10) <= COOLDOWN_MS) return;

    // Start the timer exactly once
    timerStarted.current = true;
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);

  }, [loading, isAuthenticated, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── actions ── */
  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  };

  const goToLogin = () => {
    dismiss();
    navigate('/login');
  };

  if (!visible) return null;

  const theme = isLight ? 'light' : 'dark';

  /* ── inline style blocks (avoids extra CSS file, keeps component self-contained) ── */
  return (
    <>
      <style>{`
        /* ── animations ── */
        @keyframes rdPopupFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes rdPopupSlideUp { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }

        /* ── overlay ── */
        .rdp-overlay {
          position: fixed; inset: 0; z-index: 9000;
          background: rgba(0,0,0,0.72);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: rdPopupFadeIn 0.3s ease forwards;
        }

        /* ── shared wrap ── */
        .rdp-wrap {
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 30px 80px rgba(0,0,0,0.6);
          animation: rdPopupSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards;
          position: relative;
        }

        /* ── grid overlay ── */
        .rdp-grid { position:absolute; inset:0; pointer-events:none; z-index:0; }
        .rdp-dark .rdp-grid {
          background-image: linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),
                            linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px);
          background-size: 48px 48px;
        }
        .rdp-light .rdp-grid {
          background-image: linear-gradient(rgba(10,46,110,0.07) 1px,transparent 1px),
                            linear-gradient(90deg,rgba(10,46,110,0.07) 1px,transparent 1px);
          background-size: 48px 48px;
        }

        /* ── close button ── */
        .rdp-close {
          position:absolute; top:14px; right:14px; z-index:100;
          width:28px; height:28px; border-radius:50%;
          border:1.5px solid rgba(255,255,255,0.25);
          background:rgba(0,0,0,0.35); backdrop-filter:blur(8px);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer !important; transition:border-color .2s,background .2s;
        }
        .rdp-close:hover { border-color:rgba(255,255,255,0.7); background:rgba(0,0,0,0.55); }
        .rdp-close svg { width:10px; height:10px; }
        .rdp-light .rdp-close { border-color:rgba(0,0,0,0.18); background:rgba(255,255,255,0.45); }
        .rdp-light .rdp-close:hover { border-color:rgba(0,0,0,0.5); }

        /* ════════════════════ DESKTOP ════════════════════ */
        .rdp-desktop {
          width: min(1200px, 90vw);
          height: min(540px, 76vh);
          display:flex; align-items:stretch; position:relative;
        }
        .rdp-dark.rdp-desktop  {
          background:#0B1628;
          border: 1px solid rgba(30,144,255,0.10);
          box-shadow: 0 30px 80px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(30,144,255,0.04);
        }
        .rdp-light.rdp-desktop {
          background:#C8DEFF;
          border: 1px solid rgba(10,46,110,0.08);
          box-shadow: 0 30px 80px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.4);
        }

        /* left content panel */
        .rdp-panel-left {
          position:relative; z-index:2;
          width:42%; flex-shrink:0;
          display:flex; flex-direction:column; justify-content:flex-start;
          padding: 40px 36px 40px 44px;
        }

        .rdp-headline-d {
          font-family:'Orbitron',sans-serif;
          font-size: clamp(16px,2.2vw,24px);
          font-weight:900; font-style:italic;
          line-height:1.1; letter-spacing:1.2px;
          text-transform:uppercase; margin-bottom:12px;
        }
        .rdp-dark  .rdp-headline-d { color:#1E90FF; text-shadow: 0 2px 12px rgba(30,144,255,0.25); }
        .rdp-light .rdp-headline-d { color:#0A4FCC; text-shadow: 0 1px 8px rgba(10,79,204,0.12); }

        .rdp-subline-d {
          font-family:'Rajdhani',sans-serif;
          font-size: clamp(12px,1.3vw,15px);
          font-weight:600; font-style:italic;
          line-height:1.4; margin-bottom:14px;
          max-width: 92%;
        }
        .rdp-dark  .rdp-subline-d { color:#c8d8f0; }
        .rdp-light .rdp-subline-d { color:#0A2E6E; }

        /* coupon tag */
        .rdp-coupon {
          font-family:'Orbitron',sans-serif;
          font-size: clamp(7.5px,0.85vw,9.5px);
          font-weight:700; letter-spacing:2.5px;
          text-transform:uppercase;
          display:inline-flex; align-items:center; gap:6px;
          padding:6px 12px; border-radius:4px; width:fit-content;
          backdrop-filter: blur(4px);
        }
        .rdp-dark  .rdp-coupon { color:#1E90FF; border:1px dashed rgba(30,144,255,0.5); background:rgba(30,144,255,0.08); }
        .rdp-light .rdp-coupon { color:#0A2E6E; border:1px dashed rgba(10,46,110,0.45); background:rgba(10,46,110,0.06); }

        /* perks list */
        .rdp-perks {
          display: flex; flex-direction: column; gap: 12px;
          margin-top: 20px; margin-bottom: 20px;
        }
        .rdp-perk {
          display: flex; align-items: center; gap: 10px;
          font-family: 'Rajdhani', sans-serif;
          font-size: clamp(11px, 1.15vw, 13.5px);
          font-weight: 600;
          line-height: 1.3;
        }
        .rdp-dark  .rdp-perk { color: #a8c4e8; }
        .rdp-light .rdp-perk { color: #0A2E6E; }
        .rdp-perk-icon {
          font-size: clamp(12px, 1.25vw, 15px);
          flex-shrink: 0;
          filter: drop-shadow(0 0 4px rgba(30,144,255,0.3));
        }
        .rdp-light .rdp-perk-icon {
          filter: drop-shadow(0 0 4px rgba(10,46,110,0.15));
        }

        /* sign-up button – desktop */
        .rdp-signup-d {
          position:relative; z-index:3; margin-top: auto; align-self: flex-start;
          font-family:'Orbitron',sans-serif; font-weight:700;
          font-size:11px; letter-spacing:2px; text-transform:uppercase;
          border:none; padding:14px 32px; color:#fff;
          cursor:pointer !important; white-space: nowrap;
          clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));
          transition:transform .15s,box-shadow .15s,filter .15s;
        }
        .rdp-dark  .rdp-signup-d { background:#1E90FF; box-shadow:0 0 24px rgba(30,144,255,0.45); }
        .rdp-dark  .rdp-signup-d:hover { box-shadow:0 0 40px rgba(30,144,255,0.75); transform:translateY(-2px); filter: brightness(1.1); }
        .rdp-light .rdp-signup-d { background:#0A2E6E; box-shadow:0 4px 20px rgba(10,46,110,0.35); }
        .rdp-light .rdp-signup-d:hover { box-shadow:0 6px 32px rgba(10,46,110,0.6); transform:translateY(-2px); filter: brightness(1.15); }

        /* right image panel */
        .rdp-panel-right { flex:1; position:relative; overflow:hidden; z-index:1; }
        .rdp-panel-right::after {
          content: '';
          position: absolute; inset: 0; z-index: 2; pointer-events: none;
        }
        .rdp-dark.rdp-desktop .rdp-panel-right::after {
          background: linear-gradient(to right, #0B1628 0%, transparent 30%);
        }
        .rdp-light.rdp-desktop .rdp-panel-right::after {
          background: linear-gradient(to right, #C8DEFF 0%, transparent 30%);
        }
        .rdp-panel-right img {
          position:absolute; bottom:0; right:0;
          height:100%; width:100%;
          object-fit:contain; object-position:bottom right;
          pointer-events:none;
        }

        /* desktop close button tweaks */
        .rdp-desktop .rdp-close {
          top: 18px; right: 18px;
          width: 32px; height: 32px;
        }
        .rdp-desktop .rdp-close svg {
          width: 12px; height: 12px;
        }

        /* desktop grid fade */
        .rdp-desktop .rdp-grid {
          -webkit-mask-image: radial-gradient(ellipse at center, black 50%, transparent 100%);
          mask-image: radial-gradient(ellipse at center, black 50%, transparent 100%);
        }

        /* ════════════════════ MOBILE ════════════════════ */
        .rdp-mobile {
          width: min(380px, 92vw);
          display:flex; flex-direction:column;
          align-items:flex-start; overflow:hidden; position:relative;
        }
        .rdp-dark.rdp-mobile  { background:#0B1628; }
        .rdp-light.rdp-mobile { background:#C8DEFF; }

        .rdp-panel-top {
          position:relative; z-index:2;
          padding:36px 28px 0; width:100%;
          flex-shrink:0;
        }

        .rdp-headline-m {
          font-family:'Orbitron',sans-serif;
          font-size:18px; font-weight:900; font-style:italic;
          letter-spacing:0.5px; text-transform:uppercase;
          line-height:1.15; margin-bottom:8px;
        }
        .rdp-dark  .rdp-headline-m { color:#1E90FF; }
        .rdp-light .rdp-headline-m { color:#0A4FCC; }

        .rdp-subline-m {
          font-family:'Rajdhani',sans-serif;
          font-size:13px; font-weight:600; font-style:italic;
          line-height:1.4; margin-bottom:10px;
        }
        .rdp-dark  .rdp-subline-m { color:#c8d8f0; }
        .rdp-light .rdp-subline-m { color:#0A2E6E; }

        .rdp-coupon-m {
          font-family:'Orbitron',sans-serif;
          font-size:7.5px; font-weight:700; letter-spacing:2.5px;
          text-transform:uppercase;
          display:inline-flex; align-items:center; gap:5px;
          padding:4px 9px; border-radius:2px; width:fit-content;
        }
        .rdp-dark  .rdp-coupon-m { color:#1E90FF; border:1px dashed rgba(30,144,255,0.5); background:rgba(30,144,255,0.08); }
        .rdp-light .rdp-coupon-m { color:#0A2E6E; border:1px dashed rgba(10,46,110,0.45); background:rgba(10,46,110,0.06); }

        .rdp-signup-m {
          font-family:'Orbitron',sans-serif; font-weight:700;
          font-size:9px; letter-spacing:2px; text-transform:uppercase;
          border:none; padding:11px 22px; margin-top:16px; color:#fff;
          cursor:pointer !important;
          clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px));
          transition:transform .15s,box-shadow .15s;
        }
        .rdp-dark  .rdp-signup-m { background:#1E90FF; box-shadow:0 0 24px rgba(30,144,255,0.45); }
        .rdp-dark  .rdp-signup-m:hover { box-shadow:0 0 36px rgba(30,144,255,0.65); transform:translateY(-1px); }
        .rdp-light .rdp-signup-m { background:#0A2E6E; box-shadow:0 4px 20px rgba(10,46,110,0.35); }
        .rdp-light .rdp-signup-m:hover { box-shadow:0 6px 28px rgba(10,46,110,0.55); transform:translateY(-1px); }

        .rdp-panel-img {
          width:100%; line-height:0;
          display:flex; align-items:flex-end;
          z-index:1; position:relative;
        }
        .rdp-panel-img img {
          width:100%; display:block;
          object-fit:contain; object-position:bottom center;
          vertical-align:bottom;
        }
      `}</style>

      {/* backdrop — click to dismiss */}
      <div className="rdp-overlay" onClick={dismiss}>

        <div className="rdp-wrap" onClick={e => e.stopPropagation()}>

          {isMobile ? (
            /* ─────────── MOBILE ─────────── */
            <div className={`rdp-mobile rdp-${theme}`}>
              <div className="rdp-grid" />

              <button className="rdp-close" onClick={dismiss} aria-label="Close">
                <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L13 13M13 1L1 13"
                    stroke={isLight ? '#111' : '#fff'}
                    strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>

              <div className="rdp-panel-top">
                <div className="rdp-headline-m">
                  Connect.<br />Drive.<br />Represent.
                </div>
                <div className="rdp-subline-m">
                  Join Race District and get 15% off your first order.
                </div>
                <div className="rdp-coupon-m">
                  ◆&nbsp;USE CODE&nbsp;NEWUSER
                </div>
                <button className="rdp-signup-m" onClick={goToLogin}>
                  Sign Up Now
                </button>
              </div>

              <div className="rdp-panel-img">
                <img src="/assets/RD.webp" alt="Race District" />
              </div>
            </div>

          ) : (
            /* ─────────── DESKTOP ─────────── */
            <div className={`rdp-desktop rdp-${theme}`}>
              <div className="rdp-grid" />

              <button className="rdp-close" onClick={dismiss} aria-label="Close">
                <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L13 13M13 1L1 13"
                    stroke={isLight ? '#111' : '#fff'}
                    strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>

              <div className="rdp-panel-left">
                <div className="rdp-headline-d">
                  Connect.<br />Drive.<br />Represent.
                </div>
                <div className="rdp-subline-d">
                  Join Race District and get<br />15% off your first order.
                </div>
                <div className="rdp-coupon">
                  ◆&nbsp;USE CODE&nbsp;NEWUSER
                </div>

                <div className="rdp-perks">
                  <div className="rdp-perk">
                    <span className="rdp-perk-icon">⚡</span>
                    <span>Exclusive member-only drops</span>
                  </div>
                  <div className="rdp-perk">
                    <span className="rdp-perk-icon">🏎</span>
                    <span>Free shipping on orders over Rs.9999</span>
                  </div>
                  <div className="rdp-perk">
                    <span className="rdp-perk-icon">◈</span>
                    <span>Early access to new collections</span>
                  </div>
                </div>

                <button className="rdp-signup-d" onClick={goToLogin}>
                  Sign Up Now
                </button>
              </div>

              <div className="rdp-panel-right">
                <img src="/assets/RD.webp" alt="Race District" />
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
