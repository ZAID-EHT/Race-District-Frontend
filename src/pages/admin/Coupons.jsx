// frontend/src/pages/admin/Coupons.jsx  [NEW]
import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';

const TYPES = ['percentage', 'fixed', 'free_shipping', 'first_order', 'product', 'category', 'user', 'referral', 'bogo'];

const EMPTY_FORM = {
  code: '', type: 'percentage', value: '', minOrderValue: '',
  maxDiscount: '', usageLimit: '', perUserLimit: 1,
  startDate: new Date().toISOString().split('T')[0],
  expiryDate: '', active: true, firstOrderOnly: false,
  freeShipping: false, stackable: false, autoApply: false,
};

function CouponModal({ coupon, onClose, onSaved }) {
  const [form, setForm] = useState(coupon ? {
    ...coupon,
    startDate:  coupon.startDate?.split('T')[0] || '',
    expiryDate: coupon.expiryDate?.split('T')[0] || '',
  } : { ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.code || !form.expiryDate || form.value === '') {
      setError('Code, value, and expiry date are required.'); return;
    }
    setLoading(true); setError('');
    try {
      if (coupon?._id) {
        await api.put(`/admin/coupons/${coupon._id}`, form);
      } else {
        await api.post('/admin/coupons', form);
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6, color: 'var(--text-primary)', padding: '0.6rem 0.75rem',
    width: '100%', boxSizing: 'border-box', fontSize: '0.875rem',
  };
  const lbl = { display: 'block', fontSize: '0.75rem', color: 'var(--rd-muted)', marginBottom: 4, letterSpacing: '0.05em' };
  const row = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '2rem', width: 640, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'white', letterSpacing: '0.1em' }}>
            {coupon ? 'EDIT COUPON' : 'CREATE COUPON'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--rd-muted)', cursor: 'pointer', fontSize: '1.25rem' }}>×</button>
        </div>

        {error && <div style={{ background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,60,60,0.3)', borderRadius: 6, padding: '0.75rem', marginBottom: '1rem', color: '#ff6b6b', fontSize: '0.875rem' }}>{error}</div>}

        <div style={row}>
          <div>
            <label style={lbl}>COUPON CODE *</label>
            <input style={inp} value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="SAVE20" />
          </div>
          <div>
            <label style={lbl}>TYPE *</label>
            <select style={inp} value={form.type} onChange={e => set('type', e.target.value)}>
              {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        </div>

        <div style={row}>
          <div>
            <label style={lbl}>VALUE * {form.type === 'percentage' ? '(%)' : form.type === 'fixed' ? '(LKR)' : ''}</label>
            <input style={inp} type="number" min="0" value={form.value} onChange={e => set('value', e.target.value)} placeholder="0" />
          </div>
          <div>
            <label style={lbl}>MIN ORDER VALUE (LKR)</label>
            <input style={inp} type="number" min="0" value={form.minOrderValue} onChange={e => set('minOrderValue', e.target.value)} placeholder="0" />
          </div>
        </div>

        <div style={row}>
          <div>
            <label style={lbl}>MAX DISCOUNT CAP (LKR)</label>
            <input style={inp} type="number" min="0" value={form.maxDiscount} onChange={e => set('maxDiscount', e.target.value)} placeholder="Unlimited" />
          </div>
          <div>
            <label style={lbl}>USAGE LIMIT (total)</label>
            <input style={inp} type="number" min="1" value={form.usageLimit} onChange={e => set('usageLimit', e.target.value)} placeholder="Unlimited" />
          </div>
        </div>

        <div style={row}>
          <div>
            <label style={lbl}>PER USER LIMIT</label>
            <input style={inp} type="number" min="1" value={form.perUserLimit} onChange={e => set('perUserLimit', e.target.value)} />
          </div>
          <div>
            <label style={lbl}>START DATE</label>
            <input style={inp} type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={lbl}>EXPIRY DATE *</label>
          <input style={inp} type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            ['active', 'Active'],
            ['firstOrderOnly', 'First Order Only'],
            ['freeShipping', 'Free Shipping'],
            ['stackable', 'Stackable'],
            ['autoApply', 'Auto Apply'],
          ].map(([key, label]) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={!!form[key]} onChange={e => set(key, e.target.checked)}
                style={{ accentColor: 'var(--rd-blue)' }} />
              {label}
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '0.6rem 1.25rem', borderRadius: 6, background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ padding: '0.6rem 1.5rem', borderRadius: 6, background: 'var(--rd-blue)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Saving…' : coupon ? 'Save Changes' : 'Create Coupon'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AnalyticsCard({ analytics }) {
  if (!analytics) return null;
  const card = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '1.25rem' };
  const num  = { fontSize: '1.75rem', fontWeight: 800, color: 'var(--rd-blue)', fontFamily: 'var(--font-display)' };
  const lbl  = { fontSize: '0.7rem', color: 'var(--rd-muted)', letterSpacing: '0.1em', marginTop: 4 };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
      <div style={card}>
        <div style={num}>LKR {analytics.totalDiscountGiven?.toLocaleString()}</div>
        <div style={lbl}>TOTAL DISCOUNT GIVEN</div>
      </div>
      <div style={card}>
        <div style={num}>{analytics.totalOrdersWithCoupon}</div>
        <div style={lbl}>ORDERS WITH COUPONS</div>
      </div>
      <div style={{ ...card, gridColumn: 'span 2' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--rd-muted)', letterSpacing: '0.1em', marginBottom: 10 }}>TOP 5 COUPONS</div>
        {analytics.topCoupons?.length
          ? analytics.topCoupons.map(c => (
            <div key={c.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--rd-blue)', fontWeight: 700 }}>{c.code}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{c.count} uses · LKR {c.totalDiscount?.toLocaleString()}</span>
            </div>
          ))
          : <div style={{ color: 'var(--rd-muted)', fontSize: '0.8rem' }}>No coupon orders yet</div>}
      </div>
    </div>
  );
}

export default function AdminCoupons() {
  const [coupons,   setCoupons]   = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [modal,     setModal]     = useState(null);   // null | 'create' | coupon object
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all'); // all | active | inactive | expired
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [page,      setPage]      = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      if (filter === 'active')   params.set('active', 'true');
      if (filter === 'inactive') params.set('active', 'false');

      const [couponRes, analyticsRes] = await Promise.all([
        api.get(`/admin/coupons?${params}`),
        api.get('/admin/coupons/analytics'),
      ]);

      let list = couponRes.data.coupons || couponRes.data;
      if (filter === 'expired') {
        const now = new Date();
        list = list.filter(c => new Date(c.expiryDate) < now);
      }
      setCoupons(list);
      setTotalPages(couponRes.data.pages || 1);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      setError('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (coupon) => {
    setTogglingId(coupon._id);
    try {
      await api.put(`/admin/coupons/${coupon._id}/${coupon.active ? 'disable' : 'enable'}`);
      setCoupons(cs => cs.map(c => c._id === coupon._id ? { ...c, active: !c.active } : c));
    } catch {}
    finally { setTogglingId(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/coupons/${id}`);
      setCoupons(cs => cs.filter(c => c._id !== id));
    } catch (err) {
      alert(err?.response?.data?.message || 'Delete failed');
    } finally { setDeletingId(null); }
  };

  const isExpired = (c) => new Date(c.expiryDate) < new Date();
  const badge = (text, color) => (
    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 20, background: color + '22', color, fontWeight: 700, letterSpacing: '0.05em' }}>{text}</span>
  );

  const th = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.65rem', color: 'var(--rd-muted)', letterSpacing: '0.12em', borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap' };
  const td = { padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'middle' };

  return (
    <AdminLayout title="COUPONS">
      <AnalyticsCard analytics={analytics} />

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by code…"
          style={{ padding: '0.6rem 0.9rem', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', fontSize: '0.875rem', width: 200 }}
        />
        {['all', 'active', 'inactive', 'expired'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            style={{ padding: '0.5rem 0.9rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', letterSpacing: '0.05em', border: filter === f ? '1px solid var(--rd-blue)' : '1px solid rgba(255,255,255,0.1)', background: filter === f ? 'rgba(0,102,255,0.15)' : 'transparent', color: filter === f ? 'var(--rd-blue)' : 'var(--text-secondary)' }}>
            {f}
          </button>
        ))}
        <button onClick={() => setModal('create')}
          style={{ marginLeft: 'auto', padding: '0.6rem 1.25rem', borderRadius: 6, background: 'var(--rd-blue)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
+ NEW COUPON
        </button>
      </div>

      {error && <div style={{ color: '#ff6b6b', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['CODE', 'TYPE', 'VALUE', 'USAGE', 'EXPIRY', 'STATUS', 'ACTIONS'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} style={td}><div style={{ height: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: `${60 + i * 7}%`, animation: 'pulse 1.5s infinite' }} /></td></tr>
                ))
                : coupons.length === 0
                  ? <tr><td colSpan={7} style={{ ...td, textAlign: 'center', padding: '2.5rem', color: 'var(--rd-muted)' }}>No coupons found</td></tr>
                  : coupons.map(c => (
                    <tr key={c._id} style={{ transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ ...td, color: 'white', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>{c.code}</td>
                      <td style={td}>{c.type.replace(/_/g, ' ')}</td>
                      <td style={{ ...td, color: 'var(--rd-blue)', fontWeight: 700 }}>
                        {c.type === 'percentage' || c.type === 'first_order' ? `${c.value}%` : c.type === 'free_shipping' ? 'Free' : `LKR ${c.value}`}
                      </td>
                      <td style={td}>{c.usedCount} / {c.usageLimit ?? '∞'}</td>
                      <td style={td}>
                        <span style={{ color: isExpired(c) ? '#ff6b6b' : 'var(--text-secondary)' }}>
                          {new Date(c.expiryDate).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td style={td}>
                        {isExpired(c) ? badge('EXPIRED', '#888') : c.active ? badge('ACTIVE', '#22c55e') : badge('INACTIVE', '#f59e0b')}
                      </td>
                      <td style={td}>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          {/* Toggle */}
                          <button
                            onClick={() => handleToggle(c)}
                            disabled={togglingId === c._id}
                            title={c.active ? 'Disable' : 'Enable'}
                            style={{ padding: '4px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em', background: c.active ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)', color: c.active ? '#22c55e' : 'var(--rd-muted)' }}>
                            {togglingId === c._id ? '…' : c.active ? 'DISABLE' : 'ENABLE'}
                          </button>
                          {/* Edit */}
                          <button
                            onClick={() => setModal(c)}
                            title="Edit"
                            style={{ padding: '4px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em', background: 'rgba(0,102,255,0.12)', color: 'var(--rd-blue)' }}>
                            EDIT
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(c._id)}
                            disabled={deletingId === c._id}
                            title="Delete"
                            style={{ padding: '4px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em', background: 'rgba(255,107,107,0.12)', color: '#ff6b6b' }}>
                            {deletingId === c._id ? '…' : 'DELETE'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              style={{ padding: '0.4rem 0.75rem', borderRadius: 6, border: p === page ? '1px solid var(--rd-blue)' : '1px solid rgba(255,255,255,0.1)', background: p === page ? 'rgba(0,102,255,0.15)' : 'transparent', color: p === page ? 'var(--rd-blue)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <CouponModal
          coupon={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </AdminLayout>
  );
}