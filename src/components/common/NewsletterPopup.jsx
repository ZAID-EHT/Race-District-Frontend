// frontend/src/components/common/NewsletterPopup.jsx
//
// RD.png → already at frontend/public/RD.png → reference as /RD.png
//
// Logic:
//   • Waits 7 s after mount, then appears
//   • Never shows if user is logged in
//   • Shows on first visit; then only again after 7 days
//   • Follows site theme (light / dark) in real time
//   • "Sign Up Now" → /login
//   • Click backdrop or X → dismiss (7-day cooldown)
//   • Does NOT appear on /admin/* routes

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const STORAGE_KEY   = 'rd_popup_last_seen';
const SHOW_DELAY_MS = 7_000;
const COOLDOWN_MS   = 7 * 24 * 60 * 60 * 1000;

export default function NewsletterPopup() {
  // Deliberately NOT using `loading` — timer starts on mount immediately.
  // By the time 7 s elapse, AuthContext's fetchMe has always resolved
  // (it's a single fast /auth/me network call). We read isAuthenticated
  // via a ref at fire-time so the timer closure gets the latest value.
  const { isAuthenticated } = useAuth();
  const navigate            = useNavigate();
  const { pathname }        = useLocation();

  const [visible,  setVisible]  = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [isLight,  setIsLight]  = useState(
    () => document.body.classList.contains('light-mode')
  );

  // Keep a ref so the timer closure reads the freshest auth state
  const authRef = useRef(isAuthenticated);
  useEffect(() => { authRef.current = isAuthenticated; }, [isAuthenticated]);

  // If user logs in while popup is open, hide it immediately
  useEffect(() => {
    if (isAuthenticated && visible) setVisible(false);
  }, [isAuthenticated, visible]);

  /* ── theme + resize ── */
  useEffect(() => {
    const onMutation = () =>
      setIsLight(document.body.classList.contains('light-mode'));
    const obs = new MutationObserver(onMutation);
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);

    return () => { obs.disconnect(); window.removeEventListener('resize', onResize); };
  }, []);

  /* ── popup timer: runs exactly once on mount ── */
  useEffect(() => {
    if (pathname.startsWith('/admin')) return;

    const last = localStorage.getItem(STORAGE_KEY);
    if (last && Date.now() - parseInt(last, 10) <= COOLDOWN_MS) return;

    const timer = setTimeout(() => {
      if (authRef.current) return; // logged in at fire-time → skip
      setVisible(true);
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // empty — intentional, runs once on mount only

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

  return (
    <>
      <style>{`
        @keyframes rdPopupFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes rdPopupSlideUp {
          from { opacity:0; transform:translateY(24px) scale(0.97) }
          to   { opacity:1; transform:translateY(0)    scale(1)    }
        }

        .rdp-overlay {
          position:fixed; inset:0; z-index:9000;
          background:rgba(0,0,0,0.72);
          backdrop-filter:blur(6px);
          display:flex; align-items:center; justify-content:center;
          padding:20px;
          animation:rdPopupFadeIn 0.3s ease forwards;
        }
        .rdp-wrap {
          border-radius:4px; overflow:hidden;
          box-shadow:0 30px 80px rgba(0,0,0,0.6);
          animation:rdPopupSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards;
          position:relative;
        }

        /* grid overlay */
        .rdp-grid { position:absolute; inset:0; pointer-events:none; z-index:0; }
        .rdp-dark  .rdp-grid {
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),
            linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px);
          background-size:48px 48px;
        }
        .rdp-light .rdp-grid {
          background-image:
            linear-gradient(rgba(10,46,110,0.07) 1px,transparent 1px),
            linear-gradient(90deg,rgba(10,46,110,0.07) 1px,transparent 1px);
          background-size:48px 48px;
        }

        /* close button */
        .rdp-close {
          position:absolute; top:14px; right:14px; z-index:100;
          width:28px; height:28px; border-radius:50%;
          border:1.5px solid rgba(255,255,255,0.25);
          background:rgba(0,0,0,0.35); backdrop-filter:blur(8px);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:border-color .2s,background .2s;
        }
        .rdp-close:hover { border-color:rgba(255,255,255,0.7); background:rgba(0,0,0,0.55); }
        .rdp-close svg   { width:10px; height:10px; }
        .rdp-light .rdp-close       { border-color:rgba(0,0,0,0.18); background:rgba(255,255,255,0.45); }
        .rdp-light .rdp-close:hover { border-color:rgba(0,0,0,0.5); }

        /* ════════ DESKTOP ════════ */
        .rdp-desktop {
          width:min(700px,90vw); aspect-ratio:16/7;
          display:flex; align-items:stretch; position:relative;
        }
        .rdp-dark.rdp-desktop  { background:#0B1628; }
        .rdp-light.rdp-desktop { background:#C8DEFF; }

        .rdp-panel-left {
          position:relative; z-index:2;
          width:42%; flex-shrink:0;
          display:flex; flex-direction:column; justify-content:flex-start;
          padding:36px 40px 40px 44px;
        }
        .rdp-headline-d {
          font-family:'Orbitron',sans-serif;
          font-size:clamp(14px,2vw,22px);
          font-weight:900; font-style:italic;
          line-height:1.15; letter-spacing:1px;
          text-transform:uppercase; margin-bottom:10px;
        }
        .rdp-dark  .rdp-headline-d { color:#1E90FF; }
        .rdp-light .rdp-headline-d { color:#0A4FCC; }

        .rdp-subline-d {
          font-family:'Rajdhani',sans-serif;
          font-size:clamp(11px,1.2vw,14px);
          font-weight:600; font-style:italic;
          line-height:1.4; margin-bottom:12px;
        }
        .rdp-dark  .rdp-subline-d { color:#c8d8f0; }
        .rdp-light .rdp-subline-d { color:#0A2E6E; }

        .rdp-coupon {
          font-family:'Orbitron',sans-serif;
          font-size:clamp(7px,0.8vw,9px);
          font-weight:700; letter-spacing:2.5px; text-transform:uppercase;
          display:inline-flex; align-items:center; gap:6px;
          padding:5px 10px; border-radius:2px; width:fit-content;
        }
        .rdp-dark  .rdp-coupon { color:#1E90FF; border:1px dashed rgba(30,144,255,0.5); background:rgba(30,144,255,0.08); }
        .rdp-light .rdp-coupon { color:#0A2E6E; border:1px dashed rgba(10,46,110,0.45); background:rgba(10,46,110,0.06); }

        .rdp-signup-d {
          position:absolute; bottom:40px; left:44px; z-index:3;
          font-family:'Orbitron',sans-serif; font-weight:700;
          font-size:11px; letter-spacing:2px; text-transform:uppercase;
          border:none; padding:13px 28px; color:#fff; cursor:pointer;
          clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));
          transition:transform .15s,box-shadow .15s;
        }
        .rdp-dark  .rdp-signup-d { background:#1E90FF; box-shadow:0 0 24px rgba(30,144,255,0.45); }
        .rdp-dark  .rdp-signup-d:hover { box-shadow:0 0 36px rgba(30,144,255,0.65); transform:translateY(-1px); }
        .rdp-light .rdp-signup-d { background:#0A2E6E; box-shadow:0 4px 20px rgba(10,46,110,0.35); }
        .rdp-light .rdp-signup-d:hover { box-shadow:0 6px 28px rgba(10,46,110,0.55); transform:translateY(-1px); }

        .rdp-panel-right { flex:1; position:relative; overflow:hidden; z-index:1; }
        .rdp-panel-right img {
          position:absolute; bottom:0; right:0;
          height:100%; width:100%;
          object-fit:contain; object-position:bottom right;
          pointer-events:none;
        }

        /* ════════ MOBILE ════════ */
        .rdp-mobile {
          width:min(380px,92vw);
          display:flex; flex-direction:column;
          align-items:flex-start; overflow:hidden; position:relative;
        }
        .rdp-dark.rdp-mobile  { background:#0B1628; }
        .rdp-light.rdp-mobile { background:#C8DEFF; }

        .rdp-panel-top {
          position:relative; z-index:2;
          padding:36px 28px 0; width:100%; flex-shrink:0;
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
          font-size:7.5px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase;
          display:inline-flex; align-items:center; gap:5px;
          padding:4px 9px; border-radius:2px; width:fit-content;
        }
        .rdp-dark  .rdp-coupon-m { color:#1E90FF; border:1px dashed rgba(30,144,255,0.5); background:rgba(30,144,255,0.08); }
        .rdp-light .rdp-coupon-m { color:#0A2E6E; border:1px dashed rgba(10,46,110,0.45); background:rgba(10,46,110,0.06); }

        .rdp-signup-m {
          font-family:'Orbitron',sans-serif; font-weight:700;
          font-size:9px; letter-spacing:2px; text-transform:uppercase;
          border:none; padding:11px 22px; margin-top:16px; color:#fff; cursor:pointer;
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

      <div className="rdp-overlay" onClick={dismiss}>
        <div className="rdp-wrap" onClick={e => e.stopPropagation()}>

          {isMobile ? (
            /* ── MOBILE ── */
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
                <div className="rdp-headline-m">Connect.<br />Drive.<br />Represent.</div>
                <div className="rdp-subline-m">Join Race District and get 15% off your first order.</div>
                <div className="rdp-coupon-m">◆&nbsp;USE CODE&nbsp;NEWUSER</div>
                <button className="rdp-signup-m" onClick={goToLogin}>Sign Up Now</button>
              </div>
              <div className="rdp-panel-img">
                <img src="/RD.png" alt="Race District" />
              </div>
            </div>

          ) : (
            /* ── DESKTOP ── */
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
                <div className="rdp-headline-d">Connect.<br />Drive.<br />Represent.</div>
                <div className="rdp-subline-d">Join Race District and get<br />15% off your first order.</div>
                <div className="rdp-coupon">◆&nbsp;USE CODE&nbsp;NEWUSER</div>
                <button className="rdp-signup-d" onClick={goToLogin}>Sign Up Now</button>
              </div>
              <div className="rdp-panel-right">
                <img src="/RD.png" alt="Race District" />
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
