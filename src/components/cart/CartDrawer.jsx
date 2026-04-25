import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

export default function CartDrawer({ cartOpen, setCartOpen }) {
  const { cart, removeFromCart, updateQuantity, getTotal } = useCart();
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const handler = () => setCartOpen(true);
    window.addEventListener('rd:open-cart', handler);
    return () => window.removeEventListener('rd:open-cart', handler);
  }, [setCartOpen]);

  useEffect(() => {
    if (cartOpen) {
      setVisible(true);
      requestAnimationFrame(() => setAnimating(true));
    } else {
      setAnimating(false);
      const t = setTimeout(() => setVisible(false), 350);
      return () => clearTimeout(t);
    }
  }, [cartOpen]);

  if (!visible) return null;

  const handleClose = () => setCartOpen(false);

  const handleGoHome = () => {
    handleClose();
    window.location.href = 'https://racedistrict.com/';
  };

  return (
    <>
      <style>{`
        @keyframes rd-scan {
          0% { transform: translateY(-100%); opacity: 0.6; }
          100% { transform: translateY(400%); opacity: 0; }
        }
        @keyframes rd-item-in {
          from { opacity: 0; transform: translateX(18px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .rd-cart-item {
          animation: rd-item-in 0.28s ease both;
        }
        .rd-qty-btn:hover { background: rgba(0,87,255,0.25) !important; color: #4d9fff !important; }
        .rd-remove-btn:hover { color: #ff4d4d !important; }
        .rd-checkout-btn:hover { background: #0046cc !important; letter-spacing: 0.18em !important; }
        .rd-viewcart-btn:hover { background: rgba(0,87,255,0.12) !important; border-color: rgba(0,87,255,0.5) !important; }
        .rd-close-btn:hover { background: rgba(255,255,255,0.08) !important; color: white !important; }
        .rd-back-btn:hover { color: white !important; }
        .rd-shopnow-btn:hover { background: #0046cc !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,87,255,0.3); border-radius: 2px; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 800,
          background: animating ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0)',
          backdropFilter: animating ? 'blur(6px)' : 'blur(0px)',
          transition: 'background 0.35s ease, backdrop-filter 0.35s ease',
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0,
        width: '420px', maxWidth: '100vw',
        zIndex: 900,
        display: 'flex', flexDirection: 'column',
        background: '#0a0e1a',
        borderLeft: '1px solid rgba(0,87,255,0.2)',
        boxShadow: '-12px 0 60px rgba(0,0,0,0.7)',
        transform: animating ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1)',
        overflow: 'hidden',
      }}>

        {/* Top accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #0057ff, #00d4ff, transparent)', zIndex: 1 }} />

        {/* Scan line animation */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '60px',
          background: 'linear-gradient(180deg, transparent, rgba(0,87,255,0.04), transparent)',
          animation: 'rd-scan 4s linear infinite',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Corner decorations */}
        <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderTop: '1px solid rgba(0,87,255,0.4)', borderRight: '1px solid rgba(0,87,255,0.4)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 8, left: 8, width: 20, height: 20, borderBottom: '1px solid rgba(0,87,255,0.4)', borderLeft: '1px solid rgba(0,87,255,0.4)', pointerEvents: 'none' }} />

        {/* ── HEADER ── */}
        <div style={{
          padding: '1.4rem 1.5rem 1.2rem',
          borderBottom: '1px solid rgba(0,87,255,0.15)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'relative', zIndex: 2, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Cart icon */}
            <div style={{
              width: 36, height: 36, borderRadius: '6px',
              background: 'rgba(0,87,255,0.15)', border: '1px solid rgba(0,87,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" fill="none" stroke="#4d9fff" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Rajdhani', 'Orbitron', var(--font-display, monospace)", fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
                RACE DISTRICT
              </div>
              <div style={{ fontFamily: "'Rajdhani', 'Orbitron', var(--font-display, monospace)", fontWeight: 700, fontSize: '1rem', letterSpacing: '0.12em', color: 'white', lineHeight: 1, textTransform: 'uppercase' }}>
                GARAGE{' '}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 20, height: 20, borderRadius: '4px',
                  background: '#0057ff', color: 'white',
                  fontSize: '0.72rem', fontWeight: 800, letterSpacing: 0,
                  verticalAlign: 'middle', marginLeft: 4,
                }}>
                  {cart.length}
                </span>
              </div>
            </div>
          </div>

          <button
            className="rd-close-btn"
            onClick={handleClose}
            style={{
              width: 36, height: 36, borderRadius: '6px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* ── BACK NAV ── */}
        <div style={{
          padding: '0.6rem 1.5rem',
          borderBottom: '1px solid rgba(0,87,255,0.1)',
          position: 'relative', zIndex: 2, flexShrink: 0,
        }}>
          <button
            className="rd-back-btn"
            onClick={handleGoHome}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
              fontSize: '0.75rem', letterSpacing: '0.06em', padding: 0,
              transition: 'color 0.2s', textTransform: 'uppercase',
            }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Back to Home
          </button>
        </div>

        {/* ── ITEMS ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', position: 'relative', zIndex: 2 }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'rgba(255,255,255,0.3)' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '12px',
                background: 'rgba(0,87,255,0.08)', border: '1px solid rgba(0,87,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}>
                <svg width="28" height="28" fill="none" stroke="rgba(0,87,255,0.6)" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>
                </svg>
              </div>
              <p style={{ fontSize: '0.9rem', letterSpacing: '0.05em', marginBottom: '0.4rem', color: 'rgba(255,255,255,0.5)' }}>
                Your garage is empty
              </p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', marginBottom: '1.5rem' }}>
                Add some gear to get started
              </p>
              <Link
                to="/shop"
                onClick={handleClose}
                className="rd-shopnow-btn"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: '#0057ff', color: 'white',
                  padding: '0.65rem 1.5rem', borderRadius: '6px',
                  textDecoration: 'none', fontSize: '0.8rem',
                  fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
                  border: 'none', cursor: 'pointer', transition: 'background 0.2s',
                }}
              >
                Shop Now
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {cart.map((item, i) => (
                <div
                  key={item.cartId}
                  className="rd-cart-item"
                  style={{
                    animationDelay: `${i * 0.05}s`,
                    display: 'flex', gap: '0.875rem',
                    padding: '0.875rem',
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(0,87,255,0.12)',
                    borderRadius: '8px',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {/* Left accent */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', background: 'linear-gradient(180deg, #0057ff, transparent)' }} />

                  {/* Thumbnail */}
                  <div style={{
                    width: 58, height: 58, flexShrink: 0,
                    background: 'rgba(0,87,255,0.08)',
                    border: '1px solid rgba(0,87,255,0.18)',
                    borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.6rem', overflow: 'hidden',
                  }}>
                    {(item.images?.[0]?.url || item.image) ? (
                      <img
                        src={item.images?.[0]?.url || item.image}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '5px' }}
                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <span style={{ display: (item.images?.[0]?.url || item.image) ? 'none' : 'flex' }}>
                      {item.emoji || '📦'}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 700, fontSize: '0.85rem', color: 'white',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      marginBottom: '0.15rem', letterSpacing: '0.02em',
                    }}>
                      {item.name}
                    </div>

                    {(item.size || item.color) && (
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', marginBottom: '0.4rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        {item.size && `${item.size}`}{item.size && item.color && ' · '}{item.color && `${item.color}`}
                      </div>
                    )}

                    {/* Price + Controls row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem' }}>
                      <div style={{
                        fontSize: '0.95rem', fontWeight: 800,
                        color: '#4d9fff', letterSpacing: '0.02em',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        {/* Minus */}
                        <button
                          className="rd-qty-btn"
                          onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                          style={{
                            width: 26, height: 26,
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '4px', color: 'rgba(255,255,255,0.7)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1rem', lineHeight: 1, transition: 'all 0.15s',
                          }}
                        >−</button>

                        <span style={{
                          fontSize: '0.85rem', fontWeight: 700, color: 'white',
                          minWidth: '22px', textAlign: 'center',
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {item.quantity}
                        </span>

                        {/* Plus */}
                        <button
                          className="rd-qty-btn"
                          onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                          style={{
                            width: 26, height: 26,
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '4px', color: 'rgba(255,255,255,0.7)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1rem', lineHeight: 1, transition: 'all 0.15s',
                          }}
                        >+</button>

                        {/* Remove */}
                        <button
                          className="rd-remove-btn"
                          onClick={() => removeFromCart(item.cartId)}
                          style={{
                            width: 26, height: 26, background: 'none', border: 'none',
                            color: 'rgba(255,255,255,0.25)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginLeft: '2px', transition: 'color 0.15s',
                          }}
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        {cart.length > 0 && (
          <div style={{
            padding: '1.1rem 1.25rem 1.35rem',
            borderTop: '1px solid rgba(0,87,255,0.15)',
            background: 'rgba(0,0,0,0.3)',
            position: 'relative', zIndex: 2, flexShrink: 0,
          }}>
            {/* Subtotal row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Subtotal</span>
              <span style={{
                fontSize: '1.3rem', fontWeight: 800, color: 'white',
                letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums',
              }}>
                ${getTotal().toFixed(2)}
              </span>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.72rem', textAlign: 'center', marginBottom: '1rem', letterSpacing: '0.03em' }}>
              Shipping &amp; taxes calculated at checkout
            </p>

            {/* Checkout CTA */}
            <Link
              to="/checkout"
              onClick={handleClose}
              className="rd-checkout-btn"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.6rem', width: '100%',
                background: '#0057ff', color: 'white',
                padding: '0.85rem 1.5rem', borderRadius: '6px',
                textDecoration: 'none', fontSize: '0.82rem',
                fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
                border: 'none', cursor: 'pointer',
                transition: 'background 0.2s, letter-spacing 0.2s',
                marginBottom: '0.5rem',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <span>Checkout</span>
              <span style={{ opacity: 0.6 }}>—</span>
              <span>${getTotal().toFixed(2)}</span>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>

            {/* View Full Cart */}
            <Link
              to="/cart"
              onClick={handleClose}
              className="rd-viewcart-btn"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '100%',
                background: 'transparent', color: 'rgba(255,255,255,0.45)',
                padding: '0.65rem', borderRadius: '6px',
                textDecoration: 'none', fontSize: '0.75rem',
                fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              View Full Cart
            </Link>
          </div>
        )}
      </div>
    </>
  );
}