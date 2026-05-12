import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

export default function Header({ cartOpen, setCartOpen }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { getCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const cartCount = getCount();

  // Detect if we're on the Coming Soon page
  const isComingSoon = location.pathname === '/coming-soon';

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) setDarkMode(saved === 'true');
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.remove('light-mode');
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setUserMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    const fn = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQ.trim())}`);
      setSearchQ('');
      setSearchOpen(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  // ── Coming Soon theme overrides (white/green) ──────────────────────────────
  const cs = isComingSoon;

  const dm = darkMode;
  const navBg   = cs ? 'rgba(255,255,255,0.97)' : (dm ? 'rgba(5,5,5,0.97)'      : 'rgba(255,255,255,0.97)');
  const border   = cs ? 'rgba(44,122,30,0.25)'  : (dm ? 'rgba(0,102,255,0.15)'  : 'rgba(0,102,255,0.2)');
  const textCol  = cs ? 'rgba(20,40,20,0.85)'   : (dm ? 'rgba(255,255,255,0.85)': 'rgba(0,0,0,0.85)');
  const inputBg  = cs ? 'rgba(0,0,0,0.04)'      : (dm ? 'rgba(255,255,255,0.05)': 'rgba(0,0,0,0.05)');
  const inputCol = cs ? '#1a1a1a'               : (dm ? '#ffffff'               : '#000000');
  const btnBg    = cs ? 'rgba(44,122,30,0.07)'  : (dm ? 'rgba(255,255,255,0.08)': 'rgba(0,0,0,0.06)');
  const btnBdr   = cs ? 'rgba(44,122,30,0.2)'   : (dm ? 'rgba(255,255,255,0.12)': 'rgba(0,0,0,0.12)');
  const menuBg   = cs ? 'rgba(255,255,255,0.99)' : (dm ? 'rgba(8,8,12,0.98)'    : 'rgba(255,255,255,0.98)');
  const menuBdr  = cs ? 'rgba(44,122,30,0.2)'   : (dm ? 'rgba(0,102,255,0.15)'  : 'rgba(0,102,255,0.2)');
  const divCol   = cs ? 'rgba(0,0,0,0.07)'      : (dm ? 'rgba(255,255,255,0.06)': 'rgba(0,0,0,0.08)');
  const muteCol  = cs ? '#6b8c6b'               : (dm ? '#9CA3AF'               : '#6B7280');
  const logoRACE = cs ? '#1a1a1a'               : (dm ? '#ffffff'               : '#000000');

  // Accent color — blue normally, green on coming soon
  const accent      = cs ? '#2d7a1e' : '#0066FF';
  const accentLight = cs ? 'rgba(44,122,30,0.1)' : 'rgba(0,102,255,0.08)';
  const accentBdr   = cs ? 'rgba(44,122,30,0.3)' : 'rgba(0,102,255,0.3)';

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Products' },
    { to: '/about', label: 'About' },
    { to: '/track-order', label: 'Track Order' },
    {
      to: '/coming-soon',
      label: 'Coming Soon',
      special: true,
    },
  ];

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 500,
        borderBottom: `1px solid ${border}`,
        backdropFilter: 'blur(20px)',
        background: navBg,
        transition: 'all 0.4s ease',
      }}>
        <div style={{ maxWidth: '90rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '5rem' }}>

            {/* LOGO */}
            <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
              <span className="font-orbitron" style={{
                fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.08em',
                display: 'flex', alignItems: 'center', gap: 0,
                transition: 'all 0.4s ease',
              }}>
                <span style={{ color: logoRACE, transition: 'color 0.4s' }}>RACE</span>
                <span style={{ color: accent, transition: 'color 0.4s' }}>DISTRICT</span>
              </span>
            </Link>

            {/* CENTER NAV LINKS — desktop only */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="desktop-nav">
              {navLinks.map(({ to, label, special }) => {
                const active = isActive(to);
                return (
                  <Link key={to} to={to} style={{
                    padding: '0.5rem 0.875rem',
                    fontSize: '0.875rem', fontWeight: special ? 700 : 500,
                    color: active ? accent : (special ? (cs ? '#2d7a1e' : '#3cb521') : textCol),
                    textDecoration: 'none', borderRadius: '0.375rem',
                    transition: 'all 0.2s',
                    background: active ? (special ? 'rgba(44,122,30,0.1)' : accentLight) : 'transparent',
                    fontFamily: 'Inter, sans-serif',
                    border: special && !active ? `1px solid ${cs ? 'rgba(44,122,30,0.3)' : 'rgba(60,181,33,0.3)'}` : '1px solid transparent',
                  }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.color = special ? '#2d7a1e' : accent;
                        e.currentTarget.style.background = special ? 'rgba(44,122,30,0.08)' : accentLight;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.color = special ? (cs ? '#2d7a1e' : '#3cb521') : textCol;
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>

            {/* RIGHT SIDE ACTIONS — desktop only */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }} className="desktop-nav">

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                title={dm ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                style={{
                  width: '2.25rem', height: '2.25rem', borderRadius: '50%',
                  background: btnBg, border: `1px solid ${btnBdr}`,
                  color: cs ? '#2d7a1e' : (dm ? '#FFD700' : '#0066FF'),
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0, fontSize: '1rem',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = cs ? 'rgba(44,122,30,0.15)' : (dm ? 'rgba(255,255,255,0.18)' : 'rgba(0,102,255,0.15)'); e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = btnBg; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {dm ? '☀️' : '🌙'}
              </button>

              {/* Search Toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                style={{
                  width: '2.25rem', height: '2.25rem', borderRadius: '50%',
                  background: searchOpen ? accentLight : btnBg,
                  border: `1px solid ${searchOpen ? accent : btnBdr}`,
                  color: searchOpen ? accent : textCol,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', flexShrink: 0,
                }}
                onMouseEnter={e => { if (!searchOpen) { e.currentTarget.style.background = accentLight; e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; } }}
                onMouseLeave={e => { if (!searchOpen) { e.currentTarget.style.background = btnBg; e.currentTarget.style.borderColor = btnBdr; e.currentTarget.style.color = textCol; } }}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </button>

              {/* Admin badge */}
              {isAdmin && (
                <Link to="/admin" style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.375rem 0.75rem',
                  background: accentLight,
                  border: `1px solid ${accentBdr}`,
                  borderRadius: '0.375rem',
                  color: accent, textDecoration: 'none',
                  fontSize: '0.78rem', fontWeight: 800,
                  fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.06em',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = cs ? 'rgba(44,122,30,0.18)' : 'rgba(0,102,255,0.22)'; e.currentTarget.style.borderColor = accent; }}
                  onMouseLeave={e => { e.currentTarget.style.background = accentLight; e.currentTarget.style.borderColor = accentBdr; }}
                >
                  <svg style={{ width: '0.85rem', height: '0.85rem' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
                  </svg>
                  ADMIN
                </Link>
              )}

              {/* User Menu */}
              {isAuthenticated ? (
                <div ref={userMenuRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.375rem 0.75rem',
                      background: userMenuOpen ? accentLight : btnBg,
                      border: `1px solid ${userMenuOpen ? accentBdr : btnBdr}`,
                      borderRadius: '0.375rem', color: textCol, cursor: 'pointer',
                      fontSize: '0.875rem', fontFamily: 'Inter, sans-serif',
                      fontWeight: 500, transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      width: '1.75rem', height: '1.75rem', borderRadius: '50%',
                      background: accent, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontWeight: 800, fontSize: '0.78rem', color: '#fff', flexShrink: 0,
                      transition: 'background 0.4s',
                    }}>
                      {user?.avatar
                        ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        : user?.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ maxWidth: '6rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name?.split(' ')[0]}</span>
                    <svg style={{ width: '0.75rem', height: '0.75rem', transition: 'transform 0.2s', transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 0.5rem)',
                      background: menuBg,
                      border: `1px solid ${menuBdr}`,
                      borderRadius: '0.75rem', minWidth: '13rem',
                      boxShadow: cs ? '0 20px 40px rgba(0,60,0,0.12)' : (dm ? '0 20px 40px rgba(0,0,0,0.6)' : '0 20px 40px rgba(0,0,0,0.15)'),
                      padding: '0.5rem',
                      animation: 'dropIn 0.15s ease',
                      zIndex: 600,
                    }}>
                      <div style={{ padding: '0.625rem 0.875rem', marginBottom: '0.25rem', borderBottom: `1px solid ${divCol}` }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: textCol, marginBottom: '0.125rem' }}>{user?.name}</div>
                        <div style={{ fontSize: '0.7rem', color: muteCol }}>{user?.email}</div>
                      </div>
                      {[
                        { to: '/account', label: '👤 My Account' },
                        { to: '/account/orders', label: '📦 Orders' },
                        { to: '/track-order', label: '🚚 Track Order' },
                      ].map(({ to, label }) => (
                        <Link key={to} to={to} onClick={() => setUserMenuOpen(false)} style={{
                          display: 'block', padding: '0.5rem 0.875rem',
                          color: textCol, textDecoration: 'none',
                          fontSize: '0.875rem', borderRadius: '0.375rem',
                          transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = accentLight; e.currentTarget.style.color = accent; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = textCol; }}
                        >
                          {label}
                        </Link>
                      ))}
                      <div style={{ height: '1px', background: divCol, margin: '0.25rem 0' }} />
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); navigate('/login'); }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '0.5rem 0.875rem', background: 'none', border: 'none',
                          color: '#EF4444', cursor: 'pointer', fontSize: '0.875rem',
                          borderRadius: '0.375rem', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" style={{
                  padding: '0.5rem 1.125rem',
                  background: 'transparent',
                  border: `1px solid ${cs ? 'rgba(44,122,30,0.3)' : (dm ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)')}`,
                  borderRadius: '0.375rem', color: textCol,
                  textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600,
                  fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = cs ? 'rgba(44,122,30,0.3)' : (dm ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'); e.currentTarget.style.color = textCol; }}
                >
                  Sign In
                </Link>
              )}

              {/* Cart Button — desktop only, opens drawer */}
              <button
                onClick={() => window.dispatchEvent(new Event('rd:open-cart'))}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 1rem',
                  background: accentLight,
                  border: `1px solid ${accentBdr}`,
                  borderRadius: '0.375rem', color: accent,
                  cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700,
                  fontFamily: 'Inter, sans-serif', transition: 'all 0.2s', flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = cs ? 'rgba(44,122,30,0.18)' : 'rgba(0,102,255,0.22)'; e.currentTarget.style.borderColor = accent; }}
                onMouseLeave={e => { e.currentTarget.style.background = accentLight; e.currentTarget.style.borderColor = accentBdr; }}
              >
                <svg style={{ width: '1.1rem', height: '1.1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                <span>Cart</span>
                {cartCount > 0 && (
                  <span style={{
                    background: accent, color: 'white',
                    fontSize: '0.7rem', fontWeight: 800,
                    width: '1.25rem', height: '1.25rem', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Orbitron, sans-serif', flexShrink: 0,
                    transition: 'background 0.4s',
                  }}>
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

            {/* ── MOBILE RIGHT — cart icon (Link) + hamburger ── */}
            <div className="mobile-right-actions" style={{ display: 'none', alignItems: 'center', gap: '0.5rem' }}>

              {/* Mobile Cart — fires global event to open CartDrawer */}
              <button
                onClick={() => window.dispatchEvent(new Event('rd:open-cart'))}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: accent,
                  padding: '0.4rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <svg style={{ width: '1.6rem', height: '1.6rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '0px', right: '0px',
                    background: accent, color: 'white',
                    fontSize: '0.6rem', fontWeight: 800,
                    width: '1.1rem', height: '1.1rem', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Orbitron, sans-serif',
                    pointerEvents: 'none',
                  }}>
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                style={{
                  background: 'none',
                  border: `1px solid ${cs ? 'rgba(44,122,30,0.2)' : (dm ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)')}`,
                  borderRadius: '0.375rem', padding: '0.5rem',
                  color: cs ? '#1a1a1a' : (dm ? 'white' : 'black'), cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}/>
                </svg>
              </button>
            </div>

          </div>
        </div>

        {/* SEARCH BAR */}
        {searchOpen && (
          <div style={{
            borderTop: `1px solid ${border}`,
            background: navBg,
            padding: '0.875rem 1.5rem',
            animation: 'searchDrop 0.2s ease',
          }}>
            <form onSubmit={handleSearch} style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
              <svg width="16" height="16" fill="none" stroke={muteCol} viewBox="0 0 24 24"
                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search for gear, apparel, tech..."
                onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
                style={{
                  width: '100%', padding: '0.75rem 3rem 0.75rem 2.75rem',
                  background: inputBg,
                  border: `1px solid ${accentBdr}`,
                  borderRadius: '0.375rem', color: inputCol,
                  fontSize: '0.95rem', fontFamily: 'Inter, sans-serif',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = accent}
                onBlur={e => e.target.style.borderColor = accentBdr}
              />
              <button type="submit" style={{
                position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                padding: '0.375rem 1rem', background: accent, border: 'none',
                borderRadius: '0.25rem', color: 'white', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: 700, fontFamily: 'Orbitron, sans-serif',
                letterSpacing: '0.05em',
              }}>
                GO
              </button>
            </form>
          </div>
        )}

        {/* MOBILE MENU */}
        {mobileOpen && (
          <div style={{ background: menuBg, borderTop: `1px solid ${border}`, padding: '0.75rem' }}>
            <button
              onClick={toggleDarkMode}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                width: '100%', padding: '0.75rem', background: 'none', border: 'none',
                color: textCol, fontWeight: 500, fontSize: '1rem',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'left',
              }}
            >
              {dm ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>

            <form onSubmit={handleSearch} style={{ padding: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="Search gear..."
                style={{
                  width: '100%', padding: '0.625rem 1rem',
                  background: inputBg, border: `1px solid ${accentBdr}`,
                  borderRadius: '0.375rem', color: inputCol,
                  fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', outline: 'none',
                }}
              />
            </form>

            {navLinks.map(({ to, label, special }) => (
              <Link key={to} to={to} onClick={() => setMobileOpen(false)} style={{
                display: 'block', padding: '0.75rem', fontFamily: 'Inter, sans-serif',
                color: special ? '#2d7a1e' : textCol,
                textDecoration: 'none', fontWeight: special ? 700 : 500, fontSize: '1rem',
                borderRadius: '0.375rem',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = special ? 'rgba(44,122,30,0.08)' : accentLight; e.currentTarget.style.color = special ? '#2d7a1e' : accent; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = special ? '#2d7a1e' : textCol; }}
              >{label}</Link>
            ))}

            {isAuthenticated
              ? <Link to="/account" onClick={() => setMobileOpen(false)} style={{ display: 'block', padding: '0.75rem', color: textCol, textDecoration: 'none', fontWeight: 500, fontSize: '1rem', fontFamily: 'Inter, sans-serif' }}>My Account</Link>
              : <Link to="/login" onClick={() => setMobileOpen(false)} style={{ display: 'block', padding: '0.75rem', color: accent, textDecoration: 'none', fontWeight: 700, fontSize: '1rem', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.05em' }}>SIGN IN</Link>
            }
          </div>
        )}
      </nav>

      <style>{`
        @keyframes dropIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes searchDrop { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

        /* Desktop nav visible, mobile actions hidden on desktop */
        @media (min-width: 901px) {
          .desktop-nav { display: flex !important; }
          .mobile-right-actions { display: none !important; }
        }

        /* Mobile: hide desktop nav, show mobile actions */
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-right-actions { display: flex !important; }
        }
      `}</style>
    </>
  );
}