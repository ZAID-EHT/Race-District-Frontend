import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';

const STEPS = ['pending','confirmed','processing','shipped','out_for_delivery','delivered'];
const STEP_ICONS = { pending:'⏳', confirmed:'✅', processing:'⚙️', shipped:'🚚', out_for_delivery:'📍', delivered:'🏠' };
const STEP_LABELS = { pending:'Pending', confirmed:'Confirmed', processing:'Processing', shipped:'Shipped', out_for_delivery:'Out for Delivery', delivered:'Delivered' };

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
        setError('Order not found. Please check the order number (e.g. RD-2024-00001).');
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
    <div style={{ paddingTop: '5rem', minHeight: '100vh', background: 'black' }}>
      <style>{`
        @media (max-width: 768px) {
          .track-wrap { padding: 2rem 1rem !important; }
          .track-title { font-size: 1.75rem !important; }
          .track-input-row { flex-direction: column !important; }
          .track-input-row input { width: 100% !important; }
          .track-input-row button { width: 100% !important; padding: 0.875rem !important; }
          .track-steps { overflow-x: auto !important; padding-bottom: 0.5rem !important; }
          .track-header-card { flex-direction: column !important; align-items: flex-start !important; gap: 0.75rem !important; }
        }
      `}</style>

      <div className="track-wrap" style={{ maxWidth: '48rem', margin: '0 auto', padding: '3rem 1rem' }}>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 className="font-orbitron track-title" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            TRACK YOUR <span style={{ color: '#0066FF' }}>ORDER</span>
          </h1>
          <p style={{ color: '#9CA3AF' }}>Enter your order number to see real-time delivery status</p>
        </div>

        <div className="track-input-row" style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
          <input
            className="form-input"
            style={{ flex: 1 }}
            placeholder="e.g. RD-2024-00001"
            value={orderNum}
            onChange={e => setOrderNum(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTrack()}
          />
          <button
            onClick={() => handleTrack()}
            disabled={loading}
            style={{ padding: '0.75rem 1.75rem', background: '#2563EB', border: '2px solid #2563EB', color: 'white', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', borderRadius: '0.375rem', fontFamily: 'Orbitron, sans-serif', whiteSpace: 'nowrap', opacity: loading ? 0.7 : 1, letterSpacing: '0.06em' }}>
            {loading ? 'Tracking...' : 'TRACK'}
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem', padding: '1rem 1.25rem', color: '#F87171', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {order && (
          <div>
            {/* Order header */}
            <div className="track-header-card" style={{ background: 'rgba(10,10,10,0.9)', border: '1px solid rgba(0,102,255,0.2)', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div className="font-orbitron" style={{ color: '#0066FF', fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.25rem' }}>{order.orderNumber}</div>
                <div style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                  Placed {new Date(order.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}
                </div>
                {order.customer?.name && <div style={{ color: '#9CA3AF', fontSize: '0.8rem', marginTop: '0.15rem' }}>Customer: {order.customer.name}</div>}
              </div>
              <span className={`badge badge-${order.status}`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.875rem' }}>
                {order.status?.replace(/_/g,' ').toUpperCase()}
              </span>
            </div>

            {/* Progress bar */}
            {order.status !== 'cancelled' && order.status !== 'returned' && stepIdx >= 0 && (
              <div style={{ background: 'rgba(10,10,10,0.9)', border: '1px solid rgba(0,102,255,0.2)', borderRadius: '0.75rem', padding: '2rem', marginBottom: '1.25rem' }}>
                <div className="track-steps" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ position: 'absolute', top: '18px', left: '10%', right: '10%', height: '2px', background: 'rgba(255,255,255,0.08)', zIndex: 0 }} />
                  <div style={{ position: 'absolute', top: '18px', left: '10%', height: '2px', background: '#0066FF', zIndex: 1, width: `${Math.max(0, (stepIdx / (STEPS.length - 1)) * 80)}%`, transition: 'width 0.5s ease' }} />

                  {STEPS.map((s, i) => {
                    const done = i <= stepIdx;
                    const active = i === stepIdx;
                    return (
                      <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', marginBottom: '0.5rem', background: done ? (active ? '#0066FF' : 'rgba(0,102,255,0.3)') : 'rgba(255,255,255,0.05)', border: `2px solid ${done ? '#0066FF' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', boxShadow: active ? '0 0 16px rgba(0,102,255,0.6)' : 'none', transition: 'all 0.3s' }}>
                          {STEP_ICONS[s]}
                        </div>
                        <div style={{ fontSize: '0.6rem', textAlign: 'center', color: done ? 'white' : '#6B7280', fontWeight: done ? 700 : 400, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.3 }}>
                          {STEP_LABELS[s]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Items */}
            <div style={{ background: 'rgba(10,10,10,0.9)', border: '1px solid rgba(0,102,255,0.1)', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.25rem' }}>
              <div className="font-orbitron" style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: '#0066FF', marginBottom: '1rem' }}>ORDER ITEMS</div>
              {(order.items || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', padding: '0.625rem 0', borderBottom: i < order.items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <span style={{ fontSize: '1.75rem' }}>{item.emoji || '📦'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'white' }}>{item.name}</div>
                    {item.size && <div style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Size: {item.size}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#0066FF' }}>LKR {item.price?.toLocaleString()}</div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>×{item.quantity}</div>
                  </div>
                </div>
              ))}
              {order.total && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontWeight: 700 }}>
                  <span style={{ color: '#9CA3AF' }}>Total</span>
                  <span style={{ color: '#0066FF', fontFamily: 'Orbitron, sans-serif' }}>LKR {order.total?.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Shipping address */}
            {order.shippingAddress && (
              <div style={{ background: 'rgba(10,10,10,0.9)', border: '1px solid rgba(0,102,255,0.1)', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.25rem' }}>
                <div className="font-orbitron" style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: '#0066FF', marginBottom: '0.75rem' }}>DELIVERY TO</div>
                <div style={{ color: 'white', fontWeight: 600 }}>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</div>
                <div style={{ color: '#9CA3AF', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {order.shippingAddress.street}<br />
                  {order.shippingAddress.city}{order.shippingAddress.zip ? `, ${order.shippingAddress.zip}` : ''}<br />
                  {order.shippingAddress.phone && <span>{order.shippingAddress.phone}</span>}
                </div>
              </div>
            )}

            {/* Admin note */}
            {order.adminNote && (
              <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '0.5rem', padding: '0.875rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#FBBF24' }}>
                📝 {order.adminNote}
              </div>
            )}

            {/* Timeline */}
            {(order.timeline || []).length > 0 && (
              <div style={{ background: 'rgba(10,10,10,0.9)', border: '1px solid rgba(0,102,255,0.1)', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.25rem' }}>
                <div className="font-orbitron" style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: '#0066FF', marginBottom: '1.25rem' }}>TRACKING HISTORY</div>
                {[...order.timeline].reverse().map((ev, i) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', marginBottom: '1rem', borderBottom: i < order.timeline.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? '#0066FF' : '#374151', marginTop: '0.4rem', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', textTransform: 'capitalize', marginBottom: '0.2rem', color: 'white' }}>{ev.status?.replace(/_/g,' ')}</div>
                      {ev.message && <div style={{ color: '#9CA3AF', fontSize: '0.8rem', marginBottom: '0.15rem' }}>{ev.message}</div>}
                      <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>{new Date(ev.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button onClick={() => navigate('/')}
                style={{ padding: '0.625rem 1.5rem', background: 'transparent', border: '1px solid rgba(0,102,255,0.3)', color: '#0066FF', cursor: 'pointer', borderRadius: '0.375rem', fontFamily: 'Inter,sans-serif', fontSize: '0.875rem', fontWeight: 600 }}>
                ← Back to Store
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}