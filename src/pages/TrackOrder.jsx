import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';

const STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
const STEP_ICONS = {
  pending: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  confirmed: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  processing: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  ),
  shipped: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  out_for_delivery: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  delivered: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
};
const STEP_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
};

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderNum, setOrderNum] = useState(searchParams.get('order') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = useCallback(async (num) => {
    const n = (num || orderNum || '').trim();
    if (!n) { setError('Please enter an order number.'); return; }
    setLoading(true); setError(''); setOrder(null);
    try {
      const res = await orderAPI.track(n);
      if (res.data) {
        setOrder(res.data);
      } else {
        setError('Order not found. Please check your order number and try again.');
      }
    } catch (e) {
      const msg = e?.message || e?.error || '';
      if (msg.toLowerCase().includes('not found') || e?.status === 404) {
        setError('Order not found. Please check the order number (e.g. RD-2026-00001).');
      } else {
        setError('Could not reach the server. Please try again shortly.');
      }
    } finally {
      setLoading(false);
    }
  }, [orderNum]);

  useEffect(() => {
    const orderFromParams = searchParams.get('order');
    if (orderFromParams) {
      setOrderNum(orderFromParams);
      handleTrack(orderFromParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stepIdx = order ? STEPS.indexOf(order.status) : -1;

  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh', background: 'var(--bg-primary, #000)' }}>
      <style>{`
        /* Dark mode defaults */
        .to-card {
          background: rgba(10,10,10,0.9);
          border: 1px solid rgba(0,102,255,0.2);
        }
        .to-text-primary { color: #ffffff; }
        .to-text-muted   { color: #9CA3AF; }
        .to-text-dim     { color: #6B7280; }
        .to-divider      { border-color: rgba(255,255,255,0.05); }
        .to-input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          color: #ffffff;
        }
        .to-input::placeholder { color: #6B7280; }
        .to-step-done-bg   { background: rgba(0,102,255,0.3); }
        .to-step-active-bg { background: #0066FF; }
        .to-step-idle-bg   { background: rgba(255,255,255,0.05); }
        .to-timeline-dot-active { background: #0066FF; }
        .to-timeline-dot-idle   { background: #374151; }
        .to-track-line { background: rgba(255,255,255,0.08); }
        .to-back-btn {
          background: transparent;
          border: 1px solid rgba(0,102,255,0.3);
          color: #0066FF;
        }

        /* Light mode via class */
        .light-mode .to-card {
          background: #ffffff !important;
          border: 1px solid rgba(0,102,255,0.15) !important;
          box-shadow: 0 1px 8px rgba(0,0,0,0.07) !important;
        }
        .light-mode .to-text-primary { color: #0f172a !important; }
        .light-mode .to-text-muted   { color: #475569 !important; }
        .light-mode .to-text-dim     { color: #94a3b8 !important; }
        .light-mode .to-divider      { border-color: #e2e8f0 !important; }
        .light-mode .to-input {
          background: #f8fafc !important;
          border: 1.5px solid #cbd5e1 !important;
          color: #0f172a !important;
        }
        .light-mode .to-input::placeholder { color: #94a3b8 !important; }
        .light-mode .to-step-done-bg   { background: rgba(0,102,255,0.15) !important; }
        .light-mode .to-step-active-bg { background: #0057ff !important; }
        .light-mode .to-step-idle-bg   { background: #f1f5f9 !important; border-color: #cbd5e1 !important; }
        .light-mode .to-timeline-dot-active { background: #0057ff !important; }
        .light-mode .to-timeline-dot-idle   { background: #cbd5e1 !important; }
        .light-mode .to-track-line { background: #e2e8f0 !important; }
        .light-mode .to-back-btn {
          background: transparent !important;
          border: 1px solid rgba(0,102,255,0.4) !important;
          color: #0057ff !important;
        }

        /* Light mode via prefers-color-scheme */
        @media (prefers-color-scheme: light) {
          .to-card {
            background: #ffffff !important;
            border: 1px solid rgba(0,102,255,0.15) !important;
            box-shadow: 0 1px 8px rgba(0,0,0,0.07) !important;
          }
          .to-text-primary { color: #0f172a !important; }
          .to-text-muted   { color: #475569 !important; }
          .to-text-dim     { color: #94a3b8 !important; }
          .to-divider      { border-color: #e2e8f0 !important; }
          .to-input {
            background: #f8fafc !important;
            border: 1.5px solid #cbd5e1 !important;
            color: #0f172a !important;
          }
          .to-input::placeholder { color: #94a3b8 !important; }
          .to-step-done-bg   { background: rgba(0,102,255,0.15) !important; }
          .to-step-active-bg { background: #0057ff !important; }
          .to-step-idle-bg   { background: #f1f5f9 !important; border-color: #cbd5e1 !important; }
          .to-timeline-dot-active { background: #0057ff !important; }
          .to-timeline-dot-idle   { background: #cbd5e1 !important; }
          .to-track-line { background: #e2e8f0 !important; }
          .to-back-btn {
            background: transparent !important;
            border: 1px solid rgba(0,102,255,0.4) !important;
            color: #0057ff !important;
          }
        }

        /* Mobile */
        @media (max-width: 640px) {
          .track-wrap         { padding: 1.5rem 1rem 3rem !important; }
          .track-title        { font-size: 1.6rem !important; }
          .track-input-row    { flex-direction: column !important; }
          .track-input-row button { width: 100% !important; padding: 0.9rem !important; }
          .track-steps-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 0.5rem; }
          .track-steps        { min-width: 400px; }
          .track-header-card  { flex-direction: column !important; align-items: flex-start !important; gap: 0.75rem !important; }
          .track-item-img     { width: 44px !important; height: 44px !important; }
        }

        .to-track-btn {
          padding: 0.75rem 1.75rem;
          background: #2563EB;
          border: 2px solid #2563EB;
          color: white;
          font-weight: 700;
          cursor: pointer;
          border-radius: 0.375rem;
          font-family: 'Orbitron', sans-serif;
          white-space: nowrap;
          letter-spacing: 0.06em;
          transition: background 0.2s;
          font-size: 0.85rem;
        }
        .to-track-btn:hover:not(:disabled) { background: #1d4ed8; }
        .to-track-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="track-wrap" style={{ maxWidth: '48rem', margin: '0 auto', padding: '3rem 1rem 4rem' }}>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 className="font-orbitron track-title to-text-primary"
              style={{ fontSize: 'clamp(1.75rem, 5vw, 2.75rem)', fontWeight: 900, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            TRACK YOUR <span style={{ color: '#0066FF' }}>ORDER</span>
          </h1>
          <p className="to-text-muted" style={{ fontSize: '0.95rem' }}>
            Enter your order number to see real-time delivery status
          </p>
        </div>

        {/* Search */}
        <div className="track-input-row" style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
          <input
            className="to-input"
            style={{ flex: 1, padding: '0.8rem 1rem', borderRadius: '0.375rem', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
            placeholder="e.g. RD-2026-00001"
            value={orderNum}
            onChange={e => setOrderNum(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTrack()}
          />
          <button className="to-track-btn" onClick={() => handleTrack()} disabled={loading}>
            {loading ? 'Tracking...' : 'TRACK'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.5rem', padding: '1rem 1.25rem', color: '#F87171', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.9rem' }}>
            <span style={{ flexShrink: 0 }}>⚠️</span><span>{error}</span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[120, 160, 200].map((h, i) => (
              <div key={i} style={{ borderRadius: '0.75rem', height: h, background: 'linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', border: '1px solid rgba(0,102,255,0.1)' }} />
            ))}
          </div>
        )}

        {/* Results */}
        {order && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Header card */}
            <div className="to-card track-header-card"
                 style={{ borderRadius: '0.75rem', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div className="font-orbitron" style={{ color: '#0066FF', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                  {order.orderNumber}
                </div>
                <div className="to-text-muted" style={{ fontSize: '0.85rem' }}>
                  Placed {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                {order.customer?.name && (
                  <div className="to-text-dim" style={{ fontSize: '0.8rem', marginTop: '0.1rem' }}>{order.customer.name}</div>
                )}
              </div>
              <span style={{
                display: 'inline-block', padding: '0.35rem 0.875rem', borderRadius: '999px',
                fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: order.status === 'delivered' ? 'rgba(52,211,153,0.12)' : order.status === 'cancelled' ? 'rgba(239,68,68,0.12)' : 'rgba(0,102,255,0.12)',
                color:      order.status === 'delivered' ? '#34d399'              : order.status === 'cancelled' ? '#f87171'              : '#60a5fa',
                border: `1px solid ${order.status === 'delivered' ? 'rgba(52,211,153,0.3)' : order.status === 'cancelled' ? 'rgba(239,68,68,0.3)' : 'rgba(0,102,255,0.3)'}`,
              }}>
                {order.status?.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>

            {/* Progress stepper */}
            {order.status !== 'cancelled' && order.status !== 'returned' && stepIdx >= 0 && (
              <div className="to-card" style={{ borderRadius: '0.75rem', padding: '1.75rem 1.25rem' }}>
                <div className="track-steps-scroll">
                  <div className="track-steps" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
                    <div className="to-track-line" style={{ position: 'absolute', top: '18px', left: '6%', right: '6%', height: '2px', zIndex: 0 }} />
                    <div style={{ position: 'absolute', top: '18px', left: '6%', height: '2px', background: 'linear-gradient(90deg,#0057ff,#0088ff)', zIndex: 1, width: `${(stepIdx / (STEPS.length - 1)) * 88}%`, transition: 'width 0.6s ease' }} />

                    {STEPS.map((s, i) => {
                      const done   = i <= stepIdx;
                      const active = i === stepIdx;
                      return (
                        <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                          <div className={active ? 'to-step-active-bg' : done ? 'to-step-done-bg' : 'to-step-idle-bg'}
                               style={{ width: 36, height: 36, borderRadius: '50%', marginBottom: '0.5rem', border: `2px solid ${done ? '#0066FF' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: done ? 'white' : '#6B7280', boxShadow: active ? '0 0 18px rgba(0,102,255,0.5)' : 'none', transition: 'all 0.3s' }}>
                            {STEP_ICONS[s]}
                          </div>
                          <div className="to-text-muted"
                               style={{ fontSize: '0.57rem', textAlign: 'center', fontWeight: done ? 700 : 400, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.3 }}>
                            {STEP_LABELS[s]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Order items */}
            <div className="to-card" style={{ borderRadius: '0.75rem', padding: '1.25rem 1.5rem' }}>
              <div className="font-orbitron" style={{ fontSize: '0.68rem', letterSpacing: '0.15em', color: '#0066FF', marginBottom: '1rem', fontWeight: 700 }}>
                ORDER ITEMS
              </div>
              {(order.items || []).map((item, i) => {
                const imgSrc = item.images?.[0]?.url || item.image || null;
                return (
                  <div key={i} style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', padding: '0.75rem 0', borderBottom: i < order.items.length - 1 ? '1px solid' : 'none' }}
                       className="to-divider">
                    <div className="track-item-img"
                         style={{ width: 52, height: 52, borderRadius: '0.5rem', flexShrink: 0, overflow: 'hidden', background: 'rgba(0,87,255,0.08)', border: '1px solid rgba(0,87,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {imgSrc ? (
                        <>
                          <img src={imgSrc} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                               onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                          <span style={{ display: 'none', fontSize: '1.4rem' }}>📦</span>
                        </>
                      ) : (
                        <span style={{ fontSize: '1.4rem' }}>📦</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="to-text-primary" style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                      {item.size && <div className="to-text-muted" style={{ fontSize: '0.78rem', marginTop: '0.1rem' }}>Size: {item.size}</div>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, color: '#0066FF', fontSize: '0.9rem' }}>LKR {item.price?.toLocaleString()}</div>
                      <div className="to-text-dim" style={{ fontSize: '0.78rem' }}>×{item.quantity}</div>
                    </div>
                  </div>
                );
              })}
              {order.total && (
                <div className="to-divider" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid', fontWeight: 700 }}>
                  <span className="to-text-muted">Total</span>
                  <span style={{ color: '#0066FF', fontFamily: 'Orbitron, sans-serif', fontSize: '1rem' }}>
                    LKR {order.total?.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Delivery address */}
            {order.shippingAddress && (
              <div className="to-card" style={{ borderRadius: '0.75rem', padding: '1.25rem 1.5rem' }}>
                <div className="font-orbitron" style={{ fontSize: '0.68rem', letterSpacing: '0.15em', color: '#0066FF', marginBottom: '0.875rem', fontWeight: 700 }}>
                  DELIVERY TO
                </div>
                <div className="to-text-primary" style={{ fontWeight: 600, marginBottom: '0.35rem' }}>
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </div>
                <div className="to-text-muted" style={{ fontSize: '0.875rem', lineHeight: 1.8 }}>
                  {order.shippingAddress.street}<br />
                  {order.shippingAddress.city}{order.shippingAddress.zip ? `, ${order.shippingAddress.zip}` : ''}<br />
                  Sri Lanka
                  {order.shippingAddress.phone && <><br />{order.shippingAddress.phone}</>}
                </div>
              </div>
            )}

            {/* Admin note */}
            {order.adminNote && (
              <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '0.5rem', padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#FBBF24', display: 'flex', gap: '0.5rem' }}>
                <span>📝</span><span>{order.adminNote}</span>
              </div>
            )}

            {/* Timeline */}
            {(order.timeline || []).length > 0 && (
              <div className="to-card" style={{ borderRadius: '0.75rem', padding: '1.25rem 1.5rem' }}>
                <div className="font-orbitron" style={{ fontSize: '0.68rem', letterSpacing: '0.15em', color: '#0066FF', marginBottom: '1.25rem', fontWeight: 700 }}>
                  TRACKING HISTORY
                </div>
                {[...order.timeline].reverse().map((ev, i, arr) => (
                  <div key={i} className="to-divider"
                       style={{ display: 'flex', gap: '1rem', paddingBottom: i < arr.length - 1 ? '1rem' : 0, marginBottom: i < arr.length - 1 ? '1rem' : 0, borderBottom: i < arr.length - 1 ? '1px solid' : 'none' }}>
                    <div className={i === 0 ? 'to-timeline-dot-active' : 'to-timeline-dot-idle'}
                         style={{ width: 8, height: 8, borderRadius: '50%', marginTop: '0.45rem', flexShrink: 0 }} />
                    <div>
                      <div className="to-text-primary" style={{ fontWeight: 700, fontSize: '0.875rem', textTransform: 'capitalize', marginBottom: '0.15rem' }}>
                        {ev.status?.replace(/_/g, ' ')}
                      </div>
                      {ev.message && <div className="to-text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.15rem' }}>{ev.message}</div>}
                      <div className="to-text-dim" style={{ fontSize: '0.75rem' }}>{new Date(ev.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Back button */}
            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <button className="to-back-btn"
                      onClick={() => navigate('/')}
                      style={{ padding: '0.625rem 1.5rem', cursor: 'pointer', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s' }}>
                ← Back to Store
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}