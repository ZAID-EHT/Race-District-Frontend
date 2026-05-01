// frontend/src/pages/KokoReturn.jsx
// Koko redirects the user here after they pay (success or failure).
// URL: /checkout/koko-return?orderId=...&trnId=...&status=SUCCESS|FAILURE|CANCELED
//
// This page:
//   1. Reads Koko's URL params
//   2. Calls our backend (GET /api/orders/koko-verify) to confirm status server-side
//   3. Shows the appropriate success / failure / cancelled screen

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function KokoReturn() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const { isAuthenticated } = useAuth();

  const [screen, setScreen]           = useState('loading'); // 'loading' | 'success' | 'failed' | 'cancelled'
  const [orderNumber, setOrderNumber] = useState('');

  const orderId   = searchParams.get('orderId');
  const kokoStatus = searchParams.get('status');   // SUCCESS | FAILURE | CANCELED

  useEffect(() => {
    const verify = async () => {
      if (!orderId) { setScreen('failed'); return; }

      try {
        const res = await orderAPI.verifyKokoOrder({ orderId });
        const data = res.data;
        if (data.orderNumber) setOrderNumber(data.orderNumber);

        const sts = (data.kokoStatus || kokoStatus || '').toUpperCase();
        if (sts === 'SUCCESS')          setScreen('success');
        else if (sts === 'CANCELED')    setScreen('cancelled');
        else                            setScreen('failed');
      } catch {
        // If the verify call fails, fall back to Koko's URL param
        const sts = (kokoStatus || '').toUpperCase();
        if (sts === 'SUCCESS')          setScreen('success');
        else if (sts === 'CANCELED')    setScreen('cancelled');
        else                            setScreen('failed');
      }
    };

    verify();
  }, [orderId, kokoStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Shared styles ──────────────────────────────────────────────────────
  const wrap = {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    paddingTop: '5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
  };
  const card = {
    maxWidth: '36rem',
    width: '100%',
    background: 'var(--bg-card)',
    border: '1px solid rgba(59,130,246,0.2)',
    borderRadius: '0.75rem',
    padding: '3rem 2rem',
    textAlign: 'center',
  };
  const btn = (primary) => ({
    padding: '0.75rem 1.75rem',
    background: primary ? '#2563EB' : 'transparent',
    color: primary ? 'white' : '#0066FF',
    border: `2px solid ${primary ? '#2563EB' : '#0066FF'}`,
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.9rem',
  });

  // ── Loading ─────────────────────────────────────────────────────────────
  if (screen === 'loading') {
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <h2 className="font-orbitron" style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            VERIFYING PAYMENT
          </h2>
          <p className="co-muted">Please wait while we confirm your payment with Koko…</p>
        </div>
      </div>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────
  if (screen === 'success') {
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2 className="font-orbitron" style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            ORDER CONFIRMED!
          </h2>
          {orderNumber && (
            <p className="co-muted" style={{ marginBottom: '0.5rem' }}>
              Order <span style={{ color: '#0066FF', fontWeight: 700 }}>{orderNumber}</span>
            </p>
          )}
          <p className="co-muted" style={{ marginBottom: '0.5rem' }}>
            Your Koko payment was successful. We'll start preparing your order right away! 🎉
          </p>
          <div style={{
            background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.3)',
            borderRadius: '0.5rem', padding: '0.875rem 1.25rem', margin: '1.5rem 0',
            fontSize: '0.85rem', color: '#6EE7B7', textAlign: 'left',
            display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '1rem', marginTop: '0.05rem' }}>📧</span>
            <span>Your order invoice has been sent to your email address.</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {isAuthenticated && (
              <button onClick={() => navigate('/account/orders')} style={btn(true)}>
                View My Orders
              </button>
            )}
            <button onClick={() => navigate('/products')} style={btn(false)}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Cancelled ────────────────────────────────────────────────────────────
  if (screen === 'cancelled') {
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
          <h2 className="font-orbitron" style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            PAYMENT CANCELLED
          </h2>
          <p className="co-muted" style={{ marginBottom: '2rem' }}>
            You cancelled the Koko payment. Your order has not been placed — your cart is safe.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/checkout')} style={btn(true)}>
              Try Again
            </button>
            <button onClick={() => navigate('/products')} style={btn(false)}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Failed ───────────────────────────────────────────────────────────────
  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
        <h2 className="font-orbitron" style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          PAYMENT FAILED
        </h2>
        <p className="co-muted" style={{ marginBottom: '2rem' }}>
          Your Koko payment could not be completed. Please try again or choose a different payment method.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/checkout')} style={btn(true)}>
            Try Again
          </button>
          <button onClick={() => navigate('/products')} style={btn(false)}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}