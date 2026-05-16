// frontend/src/pages/Checkout.jsx
// Changes from original:
//   - Added coupon state: couponCode, couponData, couponError, couponLoading
//   - Added handleApplyCoupon / handleRemoveCoupon handlers
//   - Recalculate discount, shipping, total when couponData changes
//   - Added coupon input UI block in DETAILS SCREEN (below delivery, above payment)
//   - Added coupon discount row in totals (details + recap screens)
//   - Pass couponCode + discount in orderPayload

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI, fetchCSRFToken } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';

const SHIPPING_OPTIONS = [
  { id: 'island_wide', name: 'Island-Wide Shipping', cost: 400, estimatedDays: 3, description: 'Delivery anywhere in Sri Lanka' },
];

const BANK_DETAILS = {
  name: 'U A Hannan',
  bank: 'Sampath Bank Wellawattha',
  accountNumber: '103657893428',
  phone: '0750158254',
};

function getEstimatedDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-LK', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function Checkout({ cartOpen, setCartOpen }) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToast } = useToast();
  const { cart, clearCart } = useCart();

  const [step, setStep] = useState('details');
  const [checkoutForm, setCheckoutForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', zip: '', country: 'Sri Lanka'
  });
  const [shippingOption, setShippingOption] = useState(SHIPPING_OPTIONS[0]);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [orderLoading, setOrderLoading] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // ── Coupon state ──
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);   // { discount, freeShipping, couponType }
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const defaultAddr = user.addresses?.find(a => a.isDefault) || user.addresses?.[0];
      if (defaultAddr) {
        setCheckoutForm(f => ({
          ...f,
          firstName: defaultAddr.firstName || user.name?.split(' ')[0] || '',
          lastName: defaultAddr.lastName || user.name?.split(' ').slice(1).join(' ') || '',
          email: user.email || '',
          phone: defaultAddr.phone || user.phone || '',
          address: defaultAddr.street || '',
          city: defaultAddr.city || '',
          zip: defaultAddr.zip || '',
          country: defaultAddr.country || 'Sri Lanka',
        }));
      } else {
        setCheckoutForm(f => ({
          ...f,
          firstName: user.name?.split(' ')[0] || '',
          lastName: user.name?.split(' ').slice(1).join(' ') || '',
          email: user.email || '',
          phone: user.phone || '',
        }));
      }
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [step]);

  // ── Totals (coupon-aware) ──
  const subtotal  = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount  = couponData?.discount || 0;
  const baseShipping = shippingOption.cost; // 400
  const shipping  = couponData?.freeShipping ? 0 : baseShipping;
  const total     = subtotal - discount + shipping;

  // ── Coupon handlers ──
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    setCouponData(null);
    try {
      const res = await api.post('/coupons/validate', {
        code: couponCode.trim(),
        cartTotal: subtotal,
        cartItems: cart.map(i => ({ productId: i._id || i.id, quantity: i.quantity, price: i.price })),
      });
      setCouponData(res.data);   // { discount, freeShipping, couponType }
      addToast('Coupon applied!', 'success');
    } catch (err) {
      setCouponError(err?.response?.data?.message || 'Invalid or expired coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponData(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) { addToast('Your garage is empty!', 'warning'); return; }
    setStep('recap');
  };

  const handlePlaceOrder = async () => {
    setOrderLoading(true);
    try {
      await fetchCSRFToken(/* forceRefresh= */ true);

      const orderPayload = {
        items: cart.map(i => ({
          productId: i._id || i.id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          size: i.size,
          image: i.image,
        })),
        shippingAddress: {
          firstName: checkoutForm.firstName,
          lastName: checkoutForm.lastName,
          street: checkoutForm.address,
          city: checkoutForm.city,
          zip: checkoutForm.zip,
          country: checkoutForm.country,
          phone: checkoutForm.phone,
        },
        shippingMethod: {
          id: shippingOption.id,
          name: shippingOption.name,
          cost: shipping,
          estimatedDays: shippingOption.estimatedDays,
        },
        payment: { method: paymentMethod },
        guestEmail: !isAuthenticated ? checkoutForm.email : undefined,
        subtotal,
        // ── Coupon / discount fields (sent under every name the backend schema might use) ──
        discount,
        discountAmount: discount,
        couponDiscount: discount,
        couponCode: couponData ? couponCode.trim().toUpperCase() : undefined,
        coupon:     couponData ? couponCode.trim().toUpperCase() : undefined,
        discountCode: couponData ? couponCode.trim().toUpperCase() : undefined,
        couponMeta: couponData
          ? { code: couponCode.trim().toUpperCase(), discount, freeShipping: !!couponData.freeShipping }
          : undefined,
        shippingCost: shipping,
        tax: 0,
        total,
      };

      let res;
      if (isAuthenticated) {
        res = await orderAPI.create(orderPayload);
      } else {
        res = await orderAPI.createGuest(orderPayload);
      }

      // Koko branch
      if (paymentMethod === 'koko') {
        const { kokoParams } = res.data;
        if (!kokoParams) {
          addToast('Could not initiate Koko payment. Please try again.', 'error');
          setOrderLoading(false);
          return;
        }
        clearCart();
        const { kokoEndpoint, ...formFields } = kokoParams;
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = kokoEndpoint;
        Object.entries(formFields).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        return;
      }

      clearCart();
      setPlacedOrder(res.data);
      setStep('done');
    } catch (err) {
      addToast(err?.message || err?.error || 'Order failed. Please try again.', 'error');
    } finally {
      setOrderLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const inputStyle = {
    width: '100%', padding: '0.75rem',
    background: 'var(--co-input-bg, rgba(255,255,255,0.05))',
    border: '1px solid var(--co-input-border, rgba(255,255,255,0.1))',
    borderRadius: '0.375rem', color: 'var(--text-primary)',
    boxSizing: 'border-box',
  };
  const labelStyle = { display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' };

  // ── ORDER COMPLETE SCREEN ──────────────────────────────────────────────────
  if (step === 'done' && placedOrder) {
    const isBankTransfer = paymentMethod === 'bank_transfer';
    const isCOD = paymentMethod === 'cod';
    return (
      <div className="page-fade" style={{ paddingTop: '5rem', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <style>{`
          @media (max-width: 768px) {
            .checkout-done-wrap { padding: 3rem 1rem !important; }
            .checkout-done-wrap h2 { font-size: 1.5rem !important; }
            .checkout-done-actions { flex-direction: column !important; }
            .checkout-done-actions button { width: 100% !important; }
            .bank-details-box { padding: 1rem !important; }
            .bank-copy-row { flex-direction: column !important; align-items: flex-start !important; gap: 0.5rem !important; }
            .bank-copy-row button { width: 100% !important; }
          }
        `}</style>
        <div className="checkout-done-wrap" style={{ maxWidth: '40rem', margin: '0 auto', padding: '5rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{isBankTransfer ? '🏦' : '✅'}</div>
          <h2 className="font-orbitron" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {isBankTransfer ? 'AWAITING PAYMENT' : 'ORDER CONFIRMED!'}
          </h2>
          <p className="co-muted" style={{ marginBottom: '0.5rem' }}>Order <span style={{ color: '#0066FF', fontWeight: 700 }}>{placedOrder.orderNumber}</span></p>
          <p className="co-muted" style={{ marginBottom: '2rem' }}>
            {isCOD && "Pay when your order arrives. We'll get it ready right away!"}
            {isBankTransfer && 'Please complete your bank transfer to confirm your order.'}
          </p>

          <div className="co-muted" style={{ background: 'rgba(0,102,255,0.07)', border: '1px solid rgba(0,102,255,0.2)', borderRadius: '0.5rem', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.85rem', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
            <span style={{ fontSize: '1rem', marginTop: '0.05rem' }}>📧</span>
            <span>
              {isBankTransfer
                ? <>Your invoice along with the <strong className="co-strong">bank transfer details</strong> have been sent to <strong className="co-strong">{checkoutForm.email}</strong>.</>
                : <>Your invoice has been sent to <strong className="co-strong">{checkoutForm.email}</strong>.</>
              }
            </span>
          </div>

          {isBankTransfer && (
            <div className="bank-details-box" style={{ background: 'var(--bg-card)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
              <h4 className="font-orbitron" style={{ color: '#0066FF', marginBottom: '1.25rem', fontSize: '0.875rem', letterSpacing: '0.1em' }}>BANK TRANSFER DETAILS</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#60A5FA', background: 'rgba(0,102,255,0.15)', border: '1px solid rgba(0,102,255,0.3)', borderRadius: '0.25rem', padding: '0.18rem 0.5rem', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>NAME</span>
                  <span className="co-strong" style={{ fontWeight: 600, fontSize: '0.95rem' }}>{BANK_DETAILS.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#60A5FA', background: 'rgba(0,102,255,0.15)', border: '1px solid rgba(0,102,255,0.3)', borderRadius: '0.25rem', padding: '0.18rem 0.5rem', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>BANK</span>
                  <span className="co-strong" style={{ fontWeight: 600, fontSize: '0.95rem' }}>{BANK_DETAILS.bank}</span>
                </div>
                <div className="bank-copy-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,102,255,0.12)', border: '1px solid rgba(0,102,255,0.35)', padding: '0.75rem 1rem', borderRadius: '0.375rem', marginTop: '0.25rem' }}>
                  <div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.68rem', marginBottom: '0.2rem', letterSpacing: '0.07em' }}>ACCOUNT NUMBER</div>
                    <div className="co-strong" style={{ fontWeight: 700, fontSize: '1.15rem', letterSpacing: '0.08em' }}>{BANK_DETAILS.accountNumber}</div>
                  </div>
                  <button onClick={() => copyToClipboard(BANK_DETAILS.accountNumber, 'acc')} style={{ padding: '0.45rem 1rem', background: copiedField === 'acc' ? '#059669' : '#0066FF', border: 'none', color: 'white', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.3s', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {copiedField === 'acc' ? 'Copied! ✓' : 'Copy'}
                  </button>
                </div>
                <div className="bank-copy-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,102,255,0.12)', border: '1px solid rgba(0,102,255,0.35)', padding: '0.75rem 1rem', borderRadius: '0.375rem' }}>
                  <div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.68rem', marginBottom: '0.2rem', letterSpacing: '0.07em' }}>PHONE / WHATSAPP</div>
                    <div className="co-strong" style={{ fontWeight: 700, fontSize: '1.15rem', letterSpacing: '0.08em' }}>{BANK_DETAILS.phone}</div>
                  </div>
                  <button onClick={() => copyToClipboard(BANK_DETAILS.phone, 'phone')} style={{ padding: '0.45rem 1rem', background: copiedField === 'phone' ? '#059669' : '#0066FF', border: 'none', color: 'white', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.3s', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {copiedField === 'phone' ? 'Copied! ✓' : 'Copy'}
                  </button>
                </div>
              </div>
              <p className="co-muted" style={{ fontSize: '0.875rem' }}>
                After transferring, send your receipt with order number <strong className="co-strong">{placedOrder.orderNumber}</strong> to confirm.
              </p>
            </div>
          )}

          <div className="checkout-done-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {isAuthenticated && (
              <button onClick={() => navigate('/account/orders')} style={{ padding: '0.75rem 1.5rem', background: '#2563EB', color: 'white', border: '2px solid #2563EB', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 700 }}>
                View My Orders
              </button>
            )}
            <button onClick={() => navigate('/products')} style={{ padding: '0.75rem 1.5rem', background: 'transparent', color: '#0066FF', border: '2px solid #0066FF', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 700 }}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ORDER RECAP SCREEN ─────────────────────────────────────────────────────
  if (step === 'recap') {
    const paymentLabel =
      paymentMethod === 'cod'   ? 'Cash on Delivery'         :
      paymentMethod === 'koko'  ? 'Koko (Buy Now Pay Later)' :
                                  'Bank Transfer';

    const confirmLabel =
      orderLoading             ? 'PLACING ORDER...'   :
      paymentMethod === 'koko' ? 'PROCEED TO KOKO →'  :
                                 'CONFIRM ORDER';

    return (
      <div className="page-fade" style={{ paddingTop: '5rem', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <style>{`
          @media (max-width: 768px) {
            .recap-wrap { padding: 2rem 1rem !important; }
            .recap-actions { flex-direction: column !important; }
            .recap-actions button { width: 100% !important; flex: none !important; }
          }
        `}</style>
        <div className="recap-wrap" style={{ maxWidth: '48rem', margin: '0 auto', padding: '5rem 1rem' }}>
          <h2 className="font-orbitron" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '2rem', textAlign: 'center', color: 'var(--text-primary)' }}>
            REVIEW <span style={{ color: '#0066FF' }}>ORDER</span>
          </h2>

          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h4 className="font-orbitron" style={{ color: '#0066FF', fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '1rem' }}>ORDER ITEMS</h4>
            {cart.map((item, i) => (
              <div key={item.cartId || i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{item.emoji || '📦'} {item.name}{item.size ? ` (${item.size})` : ''} × {item.quantity}</span>
                <span style={{ color: '#0066FF', fontWeight: 700 }}>LKR {(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9CA3AF', fontSize: '0.875rem' }}>
                <span>Subtotal</span><span>LKR {subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981', fontSize: '0.875rem' }}>
                  <span>Coupon ({couponCode.toUpperCase()})</span>
                  <span>- LKR {discount.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9CA3AF', fontSize: '0.875rem' }}>
                <span>Shipping ({shippingOption.name})</span>
                <span>{couponData?.freeShipping ? <span style={{ color: '#10B981' }}>FREE</span> : `LKR ${shipping}`}</span>
              </div>
              <div className="co-total-row" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.125rem', paddingTop: '0.5rem', borderTop: '1px solid var(--co-divider, #1F2937)' }}>
                <span>Total</span><span style={{ color: '#0066FF' }}>LKR {total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Shipping address recap */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h4 className="font-orbitron" style={{ color: '#0066FF', fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>DELIVERY ADDRESS</h4>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              {checkoutForm.firstName} {checkoutForm.lastName}<br />
              {checkoutForm.address}, {checkoutForm.city}{checkoutForm.zip ? `, ${checkoutForm.zip}` : ''}<br />
              {checkoutForm.country}<br />
              📞 {checkoutForm.phone}
            </p>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h4 className="font-orbitron" style={{ color: '#0066FF', fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>PAYMENT & DELIVERY</h4>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
              Payment: <strong className="co-strong">{paymentLabel}</strong>
            </p>
            {paymentMethod === 'koko' && (
              <p className="co-muted" style={{ fontSize: '0.8rem', marginTop: '0.4rem' }}>
                🟣 You'll be redirected to Koko's secure checkout to split your payment into 3 easy instalments.
              </p>
            )}
            <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Est. Delivery: <strong style={{ color: '#0066FF' }}>{getEstimatedDate(shippingOption.estimatedDays)}</strong>
            </p>
          </div>

          <div className="recap-actions" style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => setStep('details')} style={{ flex: 1, padding: '1rem', background: 'transparent', color: 'var(--text-secondary)', border: '2px solid var(--co-input-border, rgba(255,255,255,0.1))', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 700 }}>
              ← BACK
            </button>
            <button onClick={handlePlaceOrder} disabled={orderLoading} style={{ flex: 2, padding: '1rem', background: '#2563EB', color: 'white', fontWeight: 700, fontSize: '1rem', border: '2px solid #2563EB', cursor: orderLoading ? 'not-allowed' : 'pointer', borderRadius: '0.375rem', opacity: orderLoading ? 0.6 : 1, transition: 'all 0.3s' }}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── DETAILS SCREEN ─────────────────────────────────────────────────────────
  return (
    <div className="page-fade" style={{ paddingTop: '5rem', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <style>{`
        .light-mode {
          --co-input-bg: rgba(0,0,0,0.04);
          --co-input-border: rgba(0,0,0,0.15);
          --co-divider: #e5e7eb;
        }
        @media (prefers-color-scheme: light) {
          :root {
            --co-input-bg: rgba(0,0,0,0.04);
            --co-input-border: rgba(0,0,0,0.15);
            --co-divider: #e5e7eb;
          }
        }
        .co-strong { color: var(--text-primary, #fff); }
        .light-mode .co-strong { color: #0f172a !important; }
        @media (prefers-color-scheme: light) { .co-strong { color: #0f172a; } }
        .co-muted { color: #9CA3AF; }
        .light-mode .co-muted { color: #374151 !important; }
        @media (prefers-color-scheme: light) { .co-muted { color: #374151; } }
        .co-total-row { color: var(--text-primary, #fff); }
        .light-mode .co-total-row { color: #0f172a !important; }
        @media (prefers-color-scheme: light) { .co-total-row { color: #0f172a; } }
        .light-mode .co-item-card { background: rgba(0,0,0,0.04) !important; border-color: #d1d5db !important; }
        @media (max-width: 768px) {
          .checkout-main-grid { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
          .checkout-wrap { padding: 2rem 1rem !important; }
          .checkout-title { font-size: 1.75rem !important; margin-bottom: 1.5rem !important; }
          .checkout-name-row { grid-template-columns: 1fr !important; }
          .checkout-city-row { grid-template-columns: 1fr !important; }
          .checkout-summary-panel { order: 2; }
          .checkout-form-panel { order: 1; }
          .coupon-row { flex-direction: column !important; }
          .coupon-row input { width: 100% !important; }
          .coupon-row button { width: 100% !important; }
        }
      `}</style>

      <div className="checkout-wrap" style={{ maxWidth: '80rem', margin: '0 auto', padding: '5rem 1rem' }}>
        <h2 className="font-orbitron checkout-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.75rem)', fontWeight: 700, marginBottom: '3rem', textAlign: 'center', color: 'var(--text-primary)' }}>
          CHECKOUT <span style={{ color: '#0066FF' }}>ZONE</span>
        </h2>

        <div className="checkout-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>

          {/* LEFT: Order Summary */}
          <div className="checkout-summary-panel" style={{ background: 'var(--bg-card)', border: '1px solid rgba(59,130,246,0.2)', padding: '2rem', borderRadius: '0.5rem', height: 'fit-content' }}>
            <h3 className="font-orbitron" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <svg style={{ width: '1.25rem', height: '1.25rem', color: '#0066FF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              YOUR GARAGE
            </h3>

            <div style={{ maxHeight: '18rem', overflowY: 'auto', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {cart.length === 0
                ? <p style={{ color: '#6B7280', textAlign: 'center', padding: '2rem 0' }}>Your garage is empty.</p>
                : cart.map((item, i) => (
                  <div key={item.cartId || i} className="co-item-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(31,41,55,0.5)', padding: '0.75rem 1rem', borderRadius: '0.375rem', border: '1px solid #374151' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '3rem', height: '3rem', borderRadius: '0.375rem', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {(item.images?.[0]?.url || item.image)
                          ? <img src={item.images?.[0]?.url || item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '1.5rem' }}>📦</span>
                        }
                      </div>
                      <div>
                        <div className="co-strong" style={{ fontWeight: 700, fontSize: '0.875rem' }}>{item.name}</div>
                        <div className="co-muted" style={{ fontSize: '0.75rem' }}>LKR {item.price.toLocaleString()} × {item.quantity}</div>
                        {item.size && <div className="co-muted" style={{ fontSize: '0.75rem' }}>Size: {item.size}</div>}
                      </div>
                    </div>
                    <span style={{ color: '#0066FF', fontWeight: 700, fontSize: '0.875rem' }}>LKR {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))
              }
            </div>

            {/* Totals */}
            <div style={{ borderTop: '1px solid #1F2937', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9CA3AF', fontSize: '0.875rem' }}>
                <span>Subtotal</span><span>LKR {subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981', fontSize: '0.875rem' }}>
                  <span>Coupon ({couponCode.toUpperCase()})</span>
                  <span>- LKR {discount.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9CA3AF', fontSize: '0.875rem' }}>
                <span>Shipping</span>
                <span>{couponData?.freeShipping ? <span style={{ color: '#10B981' }}>FREE</span> : `LKR ${shipping}`}</span>
              </div>
              <div className="co-total-row" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.25rem', paddingTop: '0.5rem', borderTop: '1px solid var(--co-divider, #1F2937)' }}>
                <span>Total</span><span style={{ color: '#0066FF' }}>LKR {total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Form */}
          <div className="checkout-form-panel" style={{ background: 'var(--bg-card)', border: '1px solid rgba(59,130,246,0.2)', padding: '2rem', borderRadius: '0.5rem' }}>
            <h3 className="font-orbitron" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>PILOT INFORMATION</h3>

            {!isAuthenticated && (
              <div className="co-muted" style={{ background: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,102,255,0.3)', borderRadius: '0.375rem', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                Checking out as guest.{' '}
                <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#0066FF', cursor: 'pointer', fontWeight: 700, padding: 0 }}>Log in</button>
                {' '}to save your order history.
              </div>
            )}

            <form onSubmit={handleDetailsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="checkout-name-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>First Name *</label>
                  <input type="text" style={inputStyle} placeholder="Aiden" required value={checkoutForm.firstName} onChange={e => setCheckoutForm(f => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Last Name *</label>
                  <input type="text" style={inputStyle} placeholder="Silva" required value={checkoutForm.lastName} onChange={e => setCheckoutForm(f => ({ ...f, lastName: e.target.value }))} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" style={inputStyle} placeholder="you@example.com" required value={checkoutForm.email} onChange={e => setCheckoutForm(f => ({ ...f, email: e.target.value }))} />
              </div>

              <div>
                <label style={labelStyle}>Phone *</label>
                <input type="tel" style={inputStyle} placeholder="07XXXXXXXX" required value={checkoutForm.phone} onChange={e => setCheckoutForm(f => ({ ...f, phone: e.target.value }))} />
              </div>

              <div>
                <label style={labelStyle}>Address *</label>
                <input type="text" style={inputStyle} placeholder="123 Main Street" required value={checkoutForm.address} onChange={e => setCheckoutForm(f => ({ ...f, address: e.target.value }))} />
              </div>

              <div className="checkout-city-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>City *</label>
                  <input type="text" style={inputStyle} placeholder="Colombo" required value={checkoutForm.city} onChange={e => setCheckoutForm(f => ({ ...f, city: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Postal Code</label>
                  <input type="text" style={inputStyle} placeholder="00100" value={checkoutForm.zip} onChange={e => setCheckoutForm(f => ({ ...f, zip: e.target.value }))} />
                </div>
              </div>

              {/* Delivery */}
              <div>
                <label style={{ ...labelStyle, marginBottom: '0.75rem' }}>Delivery</label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', border: '2px solid #0066FF', borderRadius: '0.375rem', background: 'rgba(0,102,255,0.1)' }}>
                  <div>
                    <div className="co-strong" style={{ fontWeight: 700, fontSize: '0.875rem' }}>{SHIPPING_OPTIONS[0].name}</div>
                    <div className="co-muted" style={{ fontSize: '0.75rem' }}>{SHIPPING_OPTIONS[0].description} · Est. {getEstimatedDate(SHIPPING_OPTIONS[0].estimatedDays)}</div>
                  </div>
                  <span style={{ color: '#0066FF', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>LKR 400</span>
                </div>
              </div>

              {/* ── COUPON INPUT ── */}
              <div>
                <label style={{ ...labelStyle, marginBottom: '0.75rem' }}>Coupon Code</label>
                {couponData ? (
                  // Applied state
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '0.375rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1rem' }}>🏷️</span>
                      <div>
                        <div style={{ color: '#10B981', fontWeight: 700, fontSize: '0.875rem' }}>{couponCode.toUpperCase()} applied</div>
                        <div className="co-muted" style={{ fontSize: '0.75rem' }}>
                          {couponData.freeShipping ? 'Free shipping!' : `Save LKR ${couponData.discount.toLocaleString()}`}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}
                      title="Remove coupon"
                    >✕</button>
                  </div>
                ) : (
                  // Input state
                  <>
                    <div className="coupon-row" style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        placeholder="ENTER CODE"
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value); setCouponError(''); }}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        style={{ padding: '0.75rem 1.25rem', background: couponLoading ? 'rgba(0,102,255,0.4)' : '#0066FF', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: couponLoading || !couponCode.trim() ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.875rem', whiteSpace: 'nowrap', transition: 'all 0.2s', opacity: !couponCode.trim() ? 0.5 : 1 }}
                      >
                        {couponLoading ? '...' : 'APPLY'}
                      </button>
                    </div>
                    {couponError && (
                      <p style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.4rem' }}>⚠ {couponError}</p>
                    )}
                  </>
                )}
              </div>

              {/* Payment Methods */}
              <div>
                <label style={{ ...labelStyle, marginBottom: '0.75rem' }}>Payment Method *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                  {/* Cash on Delivery */}
                  <div onClick={() => setPaymentMethod('cod')} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: `2px solid ${paymentMethod === 'cod' ? '#0066FF' : 'rgba(255,255,255,0.1)'}`, borderRadius: '0.375rem', cursor: 'pointer', background: paymentMethod === 'cod' ? 'rgba(0,102,255,0.08)' : 'transparent', transition: 'all 0.2s' }}>
                    <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', border: `2px solid ${paymentMethod === 'cod' ? '#0066FF' : '#6B7280'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {paymentMethod === 'cod' && <div style={{ width: '0.6rem', height: '0.6rem', borderRadius: '50%', background: '#0066FF' }} />}
                    </div>
                    <div>
                      <div className="co-strong" style={{ fontWeight: 700, fontSize: '0.9rem' }}>💵 Cash on Delivery</div>
                      <div className="co-muted" style={{ fontSize: '0.75rem' }}>Pay when your order arrives — order auto-confirmed</div>
                    </div>
                  </div>

                  {/* Bank Transfer */}
                  <div onClick={() => setPaymentMethod('bank_transfer')} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: `2px solid ${paymentMethod === 'bank_transfer' ? '#0066FF' : 'rgba(255,255,255,0.1)'}`, borderRadius: '0.375rem', cursor: 'pointer', background: paymentMethod === 'bank_transfer' ? 'rgba(0,102,255,0.08)' : 'transparent', transition: 'all 0.2s' }}>
                    <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', border: `2px solid ${paymentMethod === 'bank_transfer' ? '#0066FF' : '#6B7280'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {paymentMethod === 'bank_transfer' && <div style={{ width: '0.6rem', height: '0.6rem', borderRadius: '50%', background: '#0066FF' }} />}
                    </div>
                    <div>
                      <div className="co-strong" style={{ fontWeight: 700, fontSize: '0.9rem' }}>🏦 Bank Transfer</div>
                      <div className="co-muted" style={{ fontSize: '0.75rem' }}>Transfer receipt to 0750158254 — order set to pending until receipt confirmed</div>
                    </div>
                  </div>

                  {/* Koko BNPL */}
                  <div onClick={() => setPaymentMethod('koko')} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: `2px solid ${paymentMethod === 'koko' ? '#8B5CF6' : 'rgba(255,255,255,0.1)'}`, borderRadius: '0.375rem', cursor: 'pointer', background: paymentMethod === 'koko' ? 'rgba(139,92,246,0.08)' : 'transparent', transition: 'all 0.2s' }}>
                    <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', border: `2px solid ${paymentMethod === 'koko' ? '#8B5CF6' : '#6B7280'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {paymentMethod === 'koko' && <div style={{ width: '0.6rem', height: '0.6rem', borderRadius: '50%', background: '#8B5CF6' }} />}
                    </div>
                    <div>
                      <div className="co-strong" style={{ fontWeight: 700, fontSize: '0.9rem' }}>🟣 Koko (Buy Now, Pay Later)</div>
                      <div className="co-muted" style={{ fontSize: '0.75rem' }}>Split into 3 easy payments — you'll be redirected to Koko to complete</div>
                    </div>
                  </div>

                  {/* Card — coming soon */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '2px solid rgba(255,255,255,0.06)', borderRadius: '0.375rem', opacity: 0.4, cursor: 'not-allowed' }}>
                    <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', border: '2px solid #6B7280', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, color: '#6B7280', fontSize: '0.9rem' }}>💳 Card Payment</div>
                      <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>Coming soon</div>
                    </div>
                    <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.1)', color: '#9CA3AF', fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontWeight: 700, letterSpacing: '0.05em' }}>SOON</span>
                  </div>

                </div>
              </div>

              <button type="submit" disabled={cart.length === 0} style={{ padding: '1rem', background: '#2563EB', color: 'white', fontWeight: 700, fontSize: '1rem', border: '2px solid #2563EB', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', borderRadius: '0.375rem', transition: 'all 0.3s', opacity: cart.length === 0 ? 0.5 : 1 }}>
                REVIEW ORDER →
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
