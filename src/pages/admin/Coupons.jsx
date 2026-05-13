// frontend/src/pages/admin/Coupons.jsx
import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';

const TYPES = ['percentage', 'fixed', 'free_shipping', 'first_order', 'product', 'category', 'user', 'referral', 'bogo'];

const EMPTY_FORM = {
  code: '', type: 'percentage', value: '', minOrderValue: '',
  maxDiscount: '', usageLimit: '', perUserLimit: 1,
  startDate: new Date().toISOString().split('T')[0],
  expiryDate: '', active: true, firstOrderOnly: false,
  freeShipping: false, stackable: false, autoApply: false, membersOnly: false,
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' });

/* ─── Ticket SVG icon (used in coupon rows, mirrors product thumbnail style) ─── */
const CouponThumb = ({ type, value, couponType }) => {
  const colorMap = {
    percentage:   '#22c55e',
    fixed:        '#0057ff',
    free_shipping:'#14b8a6',
    first_order:  '#a855f7',
    product:      '#f59e0b',
    category:     '#f97316',
    user:         '#06b6d4',
    referral:     '#ec4899',
    bogo:         '#ef4444',
  };
  const accent = colorMap[couponType] || '#0057ff';
  const label  = couponType === 'percentage' ? `${value}%`
               : couponType === 'free_shipping' ? 'FREE'
               : couponType === 'fixed' ? `LKR ${value}`
               : `${value}`;

  return (
    <div style={{
      width: 46, height: 46, borderRadius: 8, flexShrink: 0,
      background: `${accent}18`,
      border: `1px solid ${accent}40`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 1,
    }}>
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
      <span style={{ fontSize: '0.48rem', fontWeight: 800, color: accent, letterSpacing: '0.04em', textAlign: 'center', maxWidth: 42, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingInline: 2 }}>
        {label}
      </span>
    </div>
  );
};

/* ─── STATUS / TYPE badges — identical to FLAGS column in Products ─── */
const Badge = ({ text, color, icon }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: '0.7rem', padding: '3px 10px', borderRadius: 6,
    background: `${color}22`, color, fontWeight: 700,
    letterSpacing: '0.06em', border: `1px solid ${color}44`,
    textTransform: 'capitalize', whiteSpace: 'nowrap',
  }}>
    {icon && <span>{icon}</span>}
    {text}
  </span>
);

/* ─── Modal ─── */
function CouponModal({ coupon, onClose, onSaved }) {
  const [form, setForm] = useState(coupon ? {
    ...coupon,
    startDate:  coupon.startDate?.split('T')[0] || '',
    expiryDate: coupon.expiryDate?.split('T')[0] || '',
  } : { ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.code || !form.expiryDate || form.value === '') {
      setError('Code, value, and expiry date are required.'); return;
    }
    setLoading(true); setError('');
    try {
      if (coupon?._id) await api.put(`/admin/coupons/${coupon._id}`, form);
      else             await api.post('/admin/coupons', form);
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || 'Save failed');
    } finally { setLoading(false); }
  };

  const inp = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, color: '#fff',
    padding: '0.6rem 0.85rem', width: '100%',
    boxSizing: 'border-box', fontSize: '0.875rem',
    outline: 'none', colorScheme: 'dark',
  };
  const lbl = {
    fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)',
    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, display: 'block',
  };
  const row = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#0d1526', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '2rem', width: 640, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0 }}>
            {coupon ? 'EDIT COUPON' : 'ADD COUPON'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#f87171', fontSize: '0.8rem' }}>
            {error}
          </div>
        )}

        <div style={row}>
          <div><label style={lbl}>Coupon Code *</label>
            <input style={inp} value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="SAVE20" />
          </div>
          <div><label style={lbl}>Type *</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={form.type} onChange={e => set('type', e.target.value)}>
              {TYPES.map(t => <option key={t} value={t} style={{ background: '#0d1526', color: '#fff' }}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        </div>

        <div style={row}>
          <div><label style={lbl}>Value * {form.type === 'percentage' ? '(%)' : form.type === 'fixed' ? '(LKR)' : ''}</label>
            <input style={inp} type="number" min="0" value={form.value} onChange={e => set('value', e.target.value)} placeholder="0" />
          </div>
          <div><label style={lbl}>Min Order Value (LKR)</label>
            <input style={inp} type="number" min="0" value={form.minOrderValue} onChange={e => set('minOrderValue', e.target.value)} placeholder="0" />
          </div>
        </div>

        <div style={row}>
          <div><label style={lbl}>Max Discount Cap (LKR)</label>
            <input style={inp} type="number" min="0" value={form.maxDiscount} onChange={e => set('maxDiscount', e.target.value)} placeholder="Unlimited" />
          </div>
          <div><label style={lbl}>Usage Limit (total)</label>
            <input style={inp} type="number" min="1" value={form.usageLimit} onChange={e => set('usageLimit', e.target.value)} placeholder="Unlimited" />
          </div>
        </div>

        <div style={row}>
          <div><label style={lbl}>Per User Limit</label>
            <input style={inp} type="number" min="1" value={form.perUserLimit} onChange={e => set('perUserLimit', e.target.value)} />
          </div>
          <div><label style={lbl}>Start Date</label>
            <input style={inp} type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={lbl}>Expiry Date *</label>
          <input style={inp} type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.75rem', paddingTop: '0.25rem' }}>
          {[['active','Active'],['firstOrderOnly','First Order Only'],['freeShipping','Free Shipping'],['stackable','Stackable'],['autoApply','Auto Apply'],['membersOnly','Members Only']].map(([key, label]) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', userSelect: 'none' }}>
              <input type="checkbox" checked={!!form[key]} onChange={e => set(key, e.target.checked)}
                style={{ accentColor: '#0057ff', width: 15, height: 15, cursor: 'pointer' }} />
              {label}
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
          <button onClick={onClose}
            style={{ padding: '0.55rem 1.25rem', borderRadius: 7, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ padding: '0.55rem 1.5rem', borderRadius: 7, background: '#0057ff', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer', opacity: loading ? 0.65 : 1, fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {loading ? 'Saving…' : coupon ? 'Save Changes' : '+ Add Coupon'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminCoupons() {
  const [coupons,    setCoupons]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [modal,      setModal]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState('all');
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set('search', search);
      if (filter === 'active')   params.set('active', 'true');
      if (filter === 'inactive') params.set('active', 'false');

      const res = await api.get(`/admin/coupons?${params}`);
      let list = res.data.coupons || res.data;

      if (filter === 'expired') {
        const now = new Date();
        list = list.filter(c => new Date(c.expiryDate) < now);
      }
      setCoupons(list);
      setTotalPages(res.data.pages || 1);
    } catch {
      setError('Failed to load coupons');
    } finally { setLoading(false); }
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

  /* table cell styles — identical to Products */
  const th = {
    padding: '0.7rem 1rem', textAlign: 'left',
    fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)',
    letterSpacing: '0.12em', textTransform: 'uppercase',
    fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.06)',
    whiteSpace: 'nowrap',
  };
  const td = {
    padding: '0.95rem 1rem', fontSize: '0.82rem',
    color: 'rgba(255,255,255,0.5)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    verticalAlign: 'middle',
  };

  const typeColorMap = {
    percentage:   '#22c55e',
    fixed:        '#0057ff',
    free_shipping:'#14b8a6',
    first_order:  '#a855f7',
    product:      '#f59e0b',
    category:     '#f97316',
    user:         '#06b6d4',
    referral:     '#ec4899',
    bogo:         '#ef4444',
  };

  return (
    <AdminLayout title="COUPON MANAGEMENT">

      {/* ══ TOP BAR: Search + Add Button — matches Products exactly ══ */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search coupons..."
          style={{
            flex: 1, padding: '0.7rem 1.1rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, color: '#fff',
            fontSize: '0.875rem', outline: 'none',
            colorScheme: 'dark',
          }}
        />

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {['all', 'active', 'inactive', 'expired'].map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              style={{
                padding: '0.5rem 0.9rem', borderRadius: 6,
                border: `1px solid ${filter === f ? '#0057ff' : 'rgba(255,255,255,0.1)'}`,
                background: filter === f ? 'rgba(0,87,255,0.15)' : 'transparent',
                color: filter === f ? '#4d8fff' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
                letterSpacing: '0.07em', textTransform: 'uppercase',
                transition: 'all 0.15s',
              }}>
              {f}
            </button>
          ))}
        </div>

        <button
          onClick={() => setModal('create')}
          style={{
            padding: '0.62rem 1.35rem', borderRadius: 8,
            background: '#0057ff', border: 'none',
            color: '#fff', fontWeight: 800, cursor: 'pointer',
            fontSize: '0.8rem', letterSpacing: '0.06em',
            textTransform: 'uppercase', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
          + ADD COUPON
        </button>
      </div>

      {error && (
        <div style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.8rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.06)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.15)' }}>
          {error}
        </div>
      )}

      {/* ══ TABLE — same structure/feel as Products table ══ */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={th}>COUPON</th>
                <th style={th}>SKU / CODE</th>
                <th style={th}>VALUE</th>
                <th style={th}>USAGE</th>
                <th style={th}>EXPIRY</th>
                <th style={th}>FLAGS</th>
                <th style={th}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} style={td}>
                        <div style={{ height: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: `${40 + Math.random() * 40}%`, animation: 'pulse 1.6s infinite' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ ...td, textAlign: 'center', padding: '5rem 1rem', borderBottom: 'none', color: 'rgba(255,255,255,0.18)' }}>
                    <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 12px' }}>
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
                    </svg>
                    No coupons found
                  </td>
                </tr>
              ) : coupons.map(c => {
                const expired = isExpired(c);
                const accentColor = typeColorMap[c.type] || '#0057ff';
                const displayValue = c.type === 'percentage' || c.type === 'first_order'
                  ? `${c.value}%`
                  : c.type === 'free_shipping' ? 'FREE SHIP'
                  : `LKR ${Number(c.value).toLocaleString()}`;

                return (
                  <tr key={c._id}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    style={{ transition: 'background 0.12s', cursor: 'default' }}>

                    {/* COUPON column — mirrors PRODUCT: thumbnail + bold name + sub */}
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <CouponThumb type={c.type} value={c.value} couponType={c.type} />
                        <div>
                          <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.88rem', letterSpacing: '0.06em', fontFamily: 'monospace' }}>
                            {c.code}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: 2, textTransform: 'capitalize' }}>
                            {c.type.replace(/_/g, ' ')}
                            {c.minOrderValue ? ` · Min LKR ${Number(c.minOrderValue).toLocaleString()}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* SKU / CODE column */}
                    <td style={{ ...td, fontFamily: 'monospace', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
                      {c.code}
                    </td>

                    {/* VALUE — mirrors PRICE in green/blue bold */}
                    <td style={{ ...td, color: accentColor, fontWeight: 800, fontSize: '0.92rem', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                      {displayValue}
                    </td>

                    {/* USAGE */}
                    <td style={td}>
                      <span style={{ color: '#fff', fontWeight: 700 }}>{c.usedCount || 0}</span>
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}> / {c.usageLimit ?? '∞'}</span>
                    </td>

                    {/* EXPIRY */}
                    <td style={{ ...td, color: expired ? '#f87171' : 'rgba(255,255,255,0.45)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {formatDate(c.expiryDate)}
                    </td>

                    {/* FLAGS — identical pattern to Products page */}
                    <td style={td}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {expired
                          ? <Badge text="Expired" color="#6b7280" />
                          : c.active
                            ? <Badge text="Active" color="#22c55e" icon="●" />
                            : <Badge text="Inactive" color="#f59e0b" icon="●" />
                        }
                        {c.autoApply    && <Badge text="Auto" color="#0057ff" />}
                        {c.freeShipping && <Badge text="Free Ship" color="#14b8a6" />}
                        {c.firstOrderOnly && <Badge text="1st Order" color="#a855f7" />}
                        {c.stackable    && <Badge text="Stackable" color="#f97316" />}
                        {c.membersOnly  && <Badge text="Members Only" color="#06b6d4" />}
                      </div>
                    </td>

                    {/* ACTIONS — identical to Products: ✏️ Edit + 🗑️ delete */}
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button
                          onClick={() => handleToggle(c)}
                          disabled={togglingId === c._id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '5px 11px', borderRadius: 6,
                            border: `1px solid ${c.active ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
                            background: c.active ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)',
                            color: c.active ? '#22c55e' : '#f59e0b',
                            cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700,
                            letterSpacing: '0.07em', textTransform: 'uppercase',
                            transition: 'all 0.15s', whiteSpace: 'nowrap',
                          }}>
                          {togglingId === c._id ? '…' : c.active ? 'Disable' : 'Enable'}
                        </button>

                        <button
                          onClick={() => setModal(c)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '5px 11px', borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.12)',
                            background: 'rgba(255,255,255,0.04)',
                            color: '#fff', cursor: 'pointer',
                            fontSize: '0.68rem', fontWeight: 700,
                            letterSpacing: '0.07em', textTransform: 'uppercase',
                            transition: 'all 0.15s',
                          }}>
                          ✏️ Edit
                        </button>

                        <button
                          onClick={() => handleDelete(c._id)}
                          disabled={deletingId === c._id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '5px 8px', borderRadius: 6,
                            border: '1px solid rgba(239,68,68,0.2)',
                            background: 'rgba(239,68,68,0.06)',
                            color: '#f87171', cursor: 'pointer',
                            fontSize: '0.82rem', lineHeight: 1,
                            transition: 'all 0.15s',
                          }}>
                          {deletingId === c._id ? '…' : '🗑'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer: "N coupons shown" — identical to Products */}
        {!loading && (
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
              {coupons.length} coupon{coupons.length !== 1 ? 's' : ''} shown
            </span>

            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '0.3rem 0.7rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, opacity: page === 1 ? 0.35 : 1 }}>←</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ padding: '0.3rem 0.7rem', borderRadius: 6, border: `1px solid ${p === page ? '#0057ff' : 'rgba(255,255,255,0.1)'}`, background: p === page ? 'rgba(0,87,255,0.15)' : 'transparent', color: p === page ? '#4d8fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: '0.3rem 0.7rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, opacity: page === totalPages ? 0.35 : 1 }}>→</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ MODAL ══ */}
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
