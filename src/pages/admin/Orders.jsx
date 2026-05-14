import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

const STATUS_OPTS = ['all','pending','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','returned'];
const STATUS_BADGE = {
  pending:'badge-pending', confirmed:'badge-confirmed', processing:'badge-processing',
  shipped:'badge-shipped', out_for_delivery:'badge-out_for_delivery',
  delivered:'badge-delivered', cancelled:'badge-cancelled', returned:'badge-returned', packed:'badge-processing'
};

const formatLKR = (amount) => {
  if (amount == null) return 'LKR 0.00';
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]/g, '')) : Number(amount);
  if (isNaN(num)) return 'LKR 0.00';
  return `LKR ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const MOBILE_STYLES = `
select.form-select,
select.form-input {
  color-scheme: dark;
  background: var(--bg-input, #1a1a2e) !important;
  color: var(--text-primary, #ffffff) !important;
}
select.form-select option,
select.form-input option {
  background: #1a1a2e !important;
  color: #ffffff !important;
}
@media (max-width: 768px) {
  .orders-filter-bar { flex-direction: column !important; align-items: stretch !important; }
  .orders-filter-bar input { width: 100% !important; }
  .orders-status-pills { gap: 0.3rem !important; }
  .orders-status-pills button { font-size: 0.7rem !important; padding: 0.3rem 0.6rem !important; }
  .orders-bulk-bar { flex-direction: column !important; align-items: flex-start !important; gap: 0.5rem !important; }
  .orders-bulk-btns { flex-wrap: wrap !important; }

  /* Table → cards */
  .orders-table-scroll { overflow-x: unset !important; }
  .orders-rd-table { display: block !important; }
  .orders-rd-table thead { display: none !important; }
  .orders-rd-table tbody { display: flex !important; flex-direction: column !important; gap: 0.75rem !important; padding: 0.75rem !important; }
  .orders-rd-table tr {
    display: block !important;
    background: var(--bg-secondary) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 0.5rem !important;
    padding: 0.875rem !important;
  }
  .orders-rd-table td { display: block !important; padding: 0.15rem 0 !important; border: none !important; }
  .orders-rd-table .col-check { display: inline-block !important; margin-bottom: 0.25rem !important; }
  .orders-rd-table .col-hide { display: none !important; }
  .orders-rd-table .col-actions { margin-top: 0.5rem !important; }

  /* Expanded row */
  .orders-expanded-grid { grid-template-columns: 1fr !important; gap: 0.75rem !important; }

  /* Modal */
  .orders-modal-actions { flex-direction: column !important; }
  .orders-modal-actions button { width: 100% !important; }

  /* Pagination */
  .orders-pagination { gap: 0.25rem !important; flex-wrap: wrap !important; }
}
`;

export default function AdminOrders() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [editOrder, setEditOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [trackingNum, setTrackingNum] = useState('');
  const [updating, setUpdating] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [resendingId, setResendingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [orderStats, setOrderStats] = useState({});

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (status !== 'all') params.status = status;
      if (search) params.search = search;
      const res = await adminAPI.getOrders(params);
      setOrders(res.data.orders || []);
      setPagination(res.data.pagination || {});

      // Fetch stats for all statuses (fire-and-forget, won't break page if it fails)
      try {
        const allStatuses = ['pending','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','returned'];
        const counts = {};
        const allRes = await adminAPI.getOrders({ limit: 1000 });
        const allOrders = allRes.data.orders || [];
        allStatuses.forEach(s => { counts[s] = allOrders.filter(o => o.status === s).length; });
        counts['all'] = allOrders.length;
        setOrderStats(counts);
      } catch { /* stats optional */ }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [status, page, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleUpdate = async () => {
    if (!editOrder) return;
    setUpdating(true);
    try {
      await adminAPI.updateOrderStatus(editOrder._id, { status: newStatus, note: statusNote, trackingNumber: trackingNum });
      setEditOrder(null); setNewStatus(''); setStatusNote(''); setTrackingNum('');
      showToast(`Order updated to "${newStatus}" — status email sent ✉️`);
      fetchOrders();
    } catch (e) { showToast(e.message || 'Failed to update', 'error'); }
    finally { setUpdating(false); }
  };

  const handleBulk = async (bulkStatus) => {
    if (!selected.length || !window.confirm(`Update ${selected.length} orders to "${bulkStatus}"?`)) return;
    try {
      try {
        await adminAPI.bulkUpdateOrders({ orderIds: selected, status: bulkStatus });
      } catch (bulkErr) {
        const is404 = bulkErr?.response?.status === 404 || bulkErr?.message?.toLowerCase().includes('not found');
        if (is404) {
          await Promise.all(selected.map(id => adminAPI.updateOrderStatus(id, { status: bulkStatus })));
        } else {
          throw bulkErr;
        }
      }
      setSelected([]); fetchOrders();
      showToast(`${selected.length} orders updated to "${bulkStatus}"`);
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || 'Failed to update orders', 'error');
    }
  };

  const handleResendInvoice = async (orderId, e) => {
    e.stopPropagation();
    setResendingId(orderId);
    try {
      await adminAPI.resendInvoice(orderId);
      showToast('Invoice resent to customer & admin ✉️');
    } catch (e) { showToast(e.response?.data?.message || 'Failed to resend invoice', 'error'); }
    finally { setResendingId(null); }
  };

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(s => s.length === orders.length ? [] : orders.map(o => o._id));

  return (
    <AdminLayout title="ORDER MANAGEMENT">
      <style>{MOBILE_STYLES}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 24, zIndex: 9999,
          background: toast.type === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
          border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.35)' : 'rgba(16,185,129,0.35)'}`,
          color: toast.type === 'error' ? '#f87171' : '#34d399',
          borderRadius: 10, padding: '0.75rem 1.25rem', fontSize: '0.875rem', fontWeight: 600,
          maxWidth: 340, boxShadow: '0 4px 24px rgba(0,0,0,0.4)'
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Status Stat Cards ── */}
      {(() => {
        const STAT_CARDS = [
          { label: 'TOTAL',          key: 'all',              color: '#60A5FA' },
          { label: 'PENDING',        key: 'pending',          color: '#f59e0b' },
          { label: 'CONFIRMED',      key: 'confirmed',        color: '#0066FF' },
          { label: 'PROCESSING',     key: 'processing',       color: '#a855f7' },
          { label: 'PACKED',         key: 'packed',           color: '#14b8a6' },
          { label: 'SHIPPED',        key: 'shipped',          color: '#06b6d4' },
          { label: 'OUT FOR DEL.',   key: 'out_for_delivery', color: '#f97316' },
          { label: 'DELIVERED',      key: 'delivered',        color: '#22c55e' },
          { label: 'CANCELLED',      key: 'cancelled',        color: '#ef4444' },
          { label: 'RETURNED',       key: 'returned',         color: '#ec4899' },
        ];
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {STAT_CARDS.map(s => (
              <div
                key={s.key}
                onClick={() => { setStatus(s.key); setPage(1); }}
                style={{
                  background: 'var(--rd-card)',
                  border: `1px solid ${status === s.key ? s.color : 'var(--rd-border2)'}`,
                  borderTop: `2px solid ${s.color}`,
                  borderRadius: 10,
                  padding: '0.875rem 1rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: status === s.key ? `${s.color}11` : 'var(--rd-card)',
                }}
              >
                <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.13em', color: 'var(--rd-muted)', fontFamily: 'var(--font-display)', marginBottom: '0.4rem' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                  {loading ? <span style={{ opacity: 0.3 }}>–</span> : (orderStats[s.key] ?? 0)}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Filters */}
      <div className="orders-filter-bar" style={{ background: 'var(--rd-card)', border: '1px solid var(--rd-border2)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="form-input" style={{ width: '220px', padding: '0.5rem 0.875rem', fontSize: '0.875rem' }}
          placeholder="Search order number..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <div className="orders-status-pills" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
          {STATUS_OPTS.map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }} style={{
              padding: '0.4rem 0.875rem', border: `1px solid ${status === s ? 'var(--rd-blue)' : 'var(--rd-border2)'}`,
              borderRadius: '20px', background: status === s ? 'rgba(0,87,255,0.15)' : 'rgba(255,255,255,0.03)',
              color: status === s ? 'var(--rd-blue-bright)' : 'var(--rd-muted2)',
              cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600,
              textTransform: 'capitalize', whiteSpace: 'nowrap'
            }}>
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="orders-bulk-bar" style={{ background: 'rgba(0,87,255,0.08)', border: '1px solid rgba(0,87,255,0.2)', borderRadius: '10px', padding: '0.875rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--rd-blue-bright)', fontWeight: 700, fontSize: '0.875rem' }}>{selected.length} selected</span>
          <div className="orders-bulk-btns" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['confirmed','processing','shipped','delivered','cancelled'].map(s => (
              <button key={s} onClick={() => handleBulk(s)} className="btn btn-sm" style={{ background: 'rgba(0,87,255,0.15)', color: 'var(--rd-blue-bright)', border: '1px solid rgba(0,87,255,0.25)', textTransform: 'capitalize' }}>
                → {s.replace(/_/g,' ')}
              </button>
            ))}
          </div>
          <button onClick={() => setSelected([])} style={{ background: 'none', border: 'none', color: 'var(--rd-muted)', cursor: 'pointer', marginLeft: 'auto', fontSize: '0.875rem' }}>Clear</button>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--rd-card)', border: '1px solid var(--rd-border2)', borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <div className="orders-table-scroll" style={{ overflowX: 'auto' }}>
            <table className="orders-rd-table rd-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}><input type="checkbox" checked={selected.length === orders.length && orders.length > 0} onChange={toggleAll} style={{ accentColor: 'var(--rd-blue)' }} /></th>
                  <th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--rd-muted)' }}>No orders found</td></tr>
                )}
                {orders.map(order => (
                  <React.Fragment key={order._id}>
                    <tr style={{ cursor: 'pointer' }}>
                      <td className="col-check" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.includes(order._id)} onChange={() => toggleSelect(order._id)} style={{ accentColor: 'var(--rd-blue)' }} />
                      </td>
                      <td onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--rd-blue-bright)', fontSize: '0.85rem' }}>{order.orderNumber}</span>
                        <span style={{ color: 'var(--rd-muted)', fontSize: '0.7rem', marginLeft: '0.35rem' }}>{expandedOrder === order._id ? '▲' : '▼'}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {order.customer?.avatar
                            ? <img src={order.customer.avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                            : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--rd-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>{order.customer?.name?.[0]}</div>
                          }
                          <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{order.customer?.name || 'Guest'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--rd-muted)' }}>{order.customer?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="col-hide" style={{ color: 'var(--rd-muted2)', fontSize: '0.8rem' }}>
                        {order.items?.slice(0,2).map((it,i) => <div key={i}>{it.emoji} {it.name} ×{it.quantity}</div>)}
                        {order.items?.length > 2 && <div style={{ color: 'var(--rd-muted)' }}>+{order.items.length - 2} more</div>}
                      </td>
                      <td><span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>{formatLKR(order.total)}</span></td>
                      <td><span className={`badge ${STATUS_BADGE[order.status] || 'badge-pending'}`}>{order.status?.replace(/_/g,' ')}</span></td>
                      <td className="col-hide" style={{ color: 'var(--rd-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="col-actions">
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button
                            onClick={() => { setEditOrder(order); setNewStatus(order.status); }}
                            className="btn btn-outline btn-sm"
                            title="Update status"
                          >
                            <i className="fas fa-pen" />
                          </button>
                          <button
                            onClick={(e) => handleResendInvoice(order._id, e)}
                            disabled={resendingId === order._id}
                            className="btn btn-sm"
                            title="Resend invoice email"
                            style={{
                              background: 'rgba(0,87,255,0.1)',
                              border: '1px solid rgba(0,87,255,0.25)',
                              color: 'var(--rd-blue-bright)',
                              opacity: resendingId === order._id ? 0.5 : 1
                            }}
                          >
                            {resendingId === order._id
                              ? <i className="fas fa-spinner fa-spin" />
                              : <i className="fas fa-envelope" />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {expandedOrder === order._id && (
                      <tr>
                        <td colSpan={8} style={{ background: 'rgba(0,87,255,0.04)', padding: '1rem 1.5rem' }}>
                          <div className="orders-expanded-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', fontSize: '0.875rem' }}>
                            <div>
                              <div style={{ color: 'var(--rd-muted)', fontSize: '0.7rem', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>SHIP TO</div>
                              <div style={{ color: 'var(--rd-text)' }}>
                                {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}<br />
                                {order.shippingAddress?.street}<br />
                                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}<br />
                                {order.shippingAddress?.country}<br />
                                {order.shippingAddress?.phone}
                              </div>
                            </div>
                            <div>
                              <div style={{ color: 'var(--rd-muted)', fontSize: '0.7rem', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>SHIPPING METHOD</div>
                              <div>{order.shippingMethod?.name || 'Standard'}</div>
                              {order.tracking?.number && (
                                <div style={{ color: 'var(--rd-blue-bright)', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>
                                  #{order.tracking.number}
                                  {order.tracking.carrier && <span style={{ color: 'var(--rd-muted)', marginLeft: '0.5rem', fontFamily: 'var(--font-body)', fontSize: '0.75rem' }}>{order.tracking.carrier}</span>}
                                </div>
                              )}
                            </div>
                            <div>
                              <div style={{ color: 'var(--rd-muted)', fontSize: '0.7rem', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>FINANCIALS</div>
                              <div>Subtotal: {formatLKR(order.subtotal)}</div>
                              <div>Shipping: {formatLKR(order.shippingCost)}</div>
                              <div>Tax: {formatLKR(order.tax)}</div>
                              {order.discount > 0 && <div style={{ color: 'var(--rd-green)' }}>Discount: -{formatLKR(order.discount)}</div>}
                              <div style={{ fontWeight: 700, color: 'var(--rd-green)', marginTop: '0.35rem' }}>Total: {formatLKR(order.total)}</div>
                            </div>
                          </div>
                          {order.adminNote && (
                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,184,0,0.06)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--rd-yellow)' }}>
                              <i className="fas fa-note-sticky" style={{ marginRight: '0.5rem' }} />{order.adminNote}
                            </div>
                          )}
                          {order.timeline?.length > 0 && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--rd-border2)' }}>
                              <div style={{ color: 'var(--rd-muted)', fontSize: '0.7rem', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>TIMELINE</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {[...order.timeline].reverse().slice(0, 4).map((ev, i) => (
                                  <div key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--rd-muted2)', flexWrap: 'wrap' }}>
                                    <span style={{ color: i === 0 ? 'var(--rd-blue-bright)' : 'var(--rd-muted)', textTransform: 'capitalize', minWidth: 120 }}>
                                      {ev.status?.replace(/_/g, ' ')}
                                    </span>
                                    <span style={{ color: 'var(--rd-muted)', flex: 1 }}>{ev.message}</span>
                                    <span style={{ color: 'var(--rd-muted)', whiteSpace: 'nowrap' }}>{new Date(ev.timestamp).toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="orders-pagination" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--rd-border2)', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-outline btn-sm">←</button>
            {[...Array(Math.min(pagination.pages, 7))].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-outline'}`}>{i + 1}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn btn-outline btn-sm">→</button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editOrder && (
        <div className="modal-overlay" onClick={() => setEditOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', letterSpacing: '0.08em' }}>UPDATE ORDER</h3>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--rd-blue-bright)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{editOrder.orderNumber}</div>
              </div>
              <button onClick={() => setEditOrder(null)} style={{ background: 'none', border: 'none', color: 'var(--rd-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">New Status</label>
              <select className="form-input form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}
                style={{ colorScheme: 'dark', background: 'var(--bg-input, #1a1a2e)', color: 'var(--text-primary, #ffffff)' }}>
                {['pending','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','returned','refunded'].map(s => (
                  <option key={s} value={s} style={{ background: '#1a1a2e', color: '#ffffff' }}>{s.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            {newStatus === 'shipped' && (
              <div className="form-group">
                <label className="form-label">Tracking Number</label>
                <input className="form-input" value={trackingNum} onChange={e => setTrackingNum(e.target.value)} placeholder="e.g. 1Z999AA10123456784" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Admin Note <span style={{ color: 'var(--rd-muted)', fontWeight: 400 }}>(sent in email)</span></label>
              <textarea className="form-input" rows={2} value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="Internal note..." style={{ resize: 'vertical' }} />
            </div>
            <div style={{ background: 'rgba(0,87,255,0.06)', border: '1px solid rgba(0,87,255,0.15)', borderRadius: 8, padding: '0.625rem 0.875rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--rd-blue-bright)' }}>
              <i className="fas fa-envelope" style={{ marginRight: '0.5rem' }} />
              A status update email will be sent to the customer automatically.
            </div>
            <div className="orders-modal-actions" style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={handleUpdate} disabled={updating} className="btn btn-primary" style={{ flex: 1 }}>
                {updating ? 'Updating...' : 'Update Order'}
              </button>
              <button onClick={() => setEditOrder(null)} className="btn btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
