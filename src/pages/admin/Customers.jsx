import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

/* ─── Mobile styles (injected once, global) ─── */
const MOBILE_STYLES = `
@media (max-width: 768px) {
  /* Layout */
  .admin-layout { flex-direction: column !important; }
  .admin-sidebar {
    position: fixed !important;
    top: 0; left: 0; bottom: 0;
    width: 260px !important;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    z-index: 1000;
  }
  .admin-sidebar.mob-open { transform: translateX(0) !important; }
  .admin-sidebar-overlay {
    display: none;
    position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 999;
  }
  .admin-sidebar-overlay.mob-open { display: block; }
  .admin-content { width: 100% !important; min-width: 0 !important; }
  .admin-topbar {
    padding: 0.875rem 1rem !important;
    flex-wrap: wrap; gap: 0.5rem;
  }
  .admin-topbar-date { display: none !important; }
  .admin-page-content { padding: 1rem !important; }
  .mob-hamburger {
    display: flex !important;
    align-items: center; justify-content: center;
    width: 36px; height: 36px;
    background: rgba(0,102,255,0.12);
    border: 1px solid rgba(0,102,255,0.3);
    border-radius: 0.375rem;
    cursor: pointer; color: #60A5FA;
    font-size: 1.1rem; flex-shrink: 0;
  }

  /* KPI cards: 2-col grid */
  .admin-kpi-grid { grid-template-columns: 1fr 1fr !important; gap: 0.75rem !important; }

  /* Filters toolbar: stack */
  .admin-filter-bar { flex-direction: column !important; align-items: stretch !important; gap: 0.75rem !important; }
  .admin-filter-bar input { width: 100% !important; }
  .admin-filter-btns { flex-wrap: wrap !important; }

  /* Tables → card list */
  .admin-table-wrap { overflow-x: unset !important; }
  .admin-mob-hide { display: none !important; }
  .rd-table { display: block !important; }
  .rd-table thead { display: none !important; }
  .rd-table tbody { display: flex !important; flex-direction: column !important; gap: 0.75rem !important; padding: 0.75rem !important; }
  .rd-table tr {
    display: grid !important;
    grid-template-columns: auto 1fr auto !important;
    gap: 0.25rem 0.75rem !important;
    background: var(--bg-secondary) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 0.5rem !important;
    padding: 0.875rem !important;
    align-items: center !important;
  }
  .rd-table td { padding: 0 !important; border: none !important; }

  /* Pagination */
  .admin-pagination { gap: 0.25rem !important; }

  /* Modal */
  .modal { width: 95vw !important; max-width: 95vw !important; max-height: 90vh !important; overflow-y: auto !important; }
  .modal .modal-stats-grid { grid-template-columns: 1fr !important; }

  /* Customer modal inner table */
  .modal .rd-table { display: block !important; }
  .modal .rd-table thead { display: none !important; }
  .modal .rd-table tbody { display: flex !important; flex-direction: column !important; gap: 0.5rem !important; padding: 0 !important; }
  .modal .rd-table tr { display: flex !important; flex-wrap: wrap !important; gap: 0.25rem !important; padding: 0.625rem !important; }
  .modal .rd-table td { padding: 0 0.25rem !important; font-size: 0.78rem !important; }
}
@media (min-width: 769px) {
  .mob-hamburger { display: none !important; }
  .admin-sidebar-overlay { display: none !important; }
}
`;

/* ─── AdminLayout ─── */
export function AdminLayout({ children, title }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav = [
    { to: '/admin',          label: 'Dashboard', icon: '📊', exact: true },
    { to: '/admin/orders',   label: 'Orders',    icon: '📦' },
    { to: '/admin/products', label: 'Products',  icon: '🏎️' },
    { to: '/admin/users',    label: 'Customers', icon: '👥' },
    { to: '/admin/coupons',  label: 'Coupons',   icon: '🏷️' }
  ];

  const isActive = (to, exact) => exact ? location.pathname === to : location.pathname === to;

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh' }}>
      <style>{MOBILE_STYLES}</style>

      {/* Overlay */}
      <div
        className={`admin-sidebar-overlay ${sidebarOpen ? 'mob-open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`admin-sidebar ${sidebarOpen ? 'mob-open' : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, overflow: 'hidden' }}>
        {/* Logo */}
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span className="font-orbitron" style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '0.1em', color: 'var(--text-primary)' }}>
              RACE<span style={{ color: '#0066FF' }}>DISTRICT</span>
            </span>
          </Link>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: '0.25rem' }}>ADMIN PANEL</div>
        </div>

        {/* User info */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0066FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0, color: 'white' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{user?.name}</div>
              <div style={{ fontSize: '0.65rem', color: '#0066FF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{user?.role}</div>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0.75rem' }}>
          {nav.map(item => (
            <Link key={item.to} to={item.to}
              className={`admin-nav-item ${isActive(item.to, item.exact) ? 'active' : ''}`}>
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom links */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
          <Link to="/" className="admin-nav-item">🏪 View Store</Link>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="admin-nav-item"
            style={{ color: '#EF4444', width: '100%' }}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      <div className="admin-content" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div className="admin-topbar" style={{
          padding: '1.25rem 2rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-secondary)',
          position: 'sticky', top: 0, zIndex: 100, gap: '0.75rem',
        }}>
          <button className="mob-hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Open menu">☰</button>
          <h1 className="font-orbitron" style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-primary)', flex: 1 }}>{title}</h1>
          <span className="admin-topbar-date" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
        <div className="admin-page-content" style={{ padding: '2rem', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

/* ─── Customer Detail Modal ─── */
function CustomerModal({ customer, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!customer) return;
    adminAPI.getOrders({ search: customer.email, limit: 50 })
      .then(r => setOrders(r.data?.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  }, [customer]);

  if (!customer) return null;

  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const avgOrder = orders.length ? totalSpent / orders.length : 0;

  const STATUS_BADGE = {
    pending: 'badge-pending', confirmed: 'badge-confirmed',
    processing: 'badge-processing', shipped: 'badge-shipped',
    out_for_delivery: 'badge-out_for_delivery', delivered: 'badge-delivered',
    cancelled: 'badge-cancelled', returned: 'badge-returned'
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}
        style={{ maxWidth: 700, width: '95%', maxHeight: '85vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#0066FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', flexShrink: 0, color: 'white' }}>
              {customer.avatar
                ? <img src={customer.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : customer.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h3 className="font-orbitron" style={{ fontSize: '0.95rem', letterSpacing: '0.08em', color: 'var(--text-primary)' }}>{customer.name}</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{customer.email}</div>
              {customer.phone && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{customer.phone}</div>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
        </div>

        {/* Stats row */}
        <div className="modal-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Orders', value: orders.length, color: '#0066FF' },
            { label: 'Total Spent', value: `$${totalSpent.toFixed(2)}`, color: '#34D399' },
            { label: 'Avg. Order', value: `$${avgOrder.toFixed(2)}`, color: '#FBBF24' }
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1rem', textAlign: 'center' }}>
              <div className="font-orbitron" style={{ fontSize: '1.2rem', fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.4rem', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Role</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: customer.role === 'admin' ? '#FBBF24' : '#34D399' }}>{customer.role}</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.4rem', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Member Since</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{new Date(customer.createdAt).toLocaleDateString()}</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.4rem', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Auth Provider</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{customer.authProvider || 'email'}</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.4rem', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Status</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: customer.isActive ? '#34D399' : '#EF4444' }}>
              {customer.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>

        {/* Order history */}
        <div className="font-orbitron" style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: '#0066FF', marginBottom: '0.75rem' }}>ORDER HISTORY</div>
        {loadingOrders ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>Loading orders…</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No orders yet</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="rd-table">
              <thead>
                <tr><th>Order #</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <td><span className="font-orbitron" style={{ color: '#0066FF', fontSize: '0.8rem' }}>{o.orderNumber}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</td>
                    <td><span className="font-orbitron" style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>${o.total?.toFixed(2)}</span></td>
                    <td><span className={`badge ${STATUS_BADGE[o.status] || 'badge-pending'}`}>{o.status?.replace(/_/g, ' ')}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Customers Page ─── */
export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('customer');
  const [page, setPage]         = useState(1);
  const [pagination, setPagination] = useState({});
  const [selected, setSelected] = useState(null);
  const [stats, setStats]       = useState({ total: 0, newThisMonth: 0 });

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.getUsers({ page, limit: 20, search, role: roleFilter || undefined })
      .then(r => {
        setCustomers(r.data?.users || []);
        setPagination(r.data?.pagination || {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, roleFilter]);

  useEffect(() => {
    adminAPI.getStats()
      .then(r => setStats({
        total:        r.data?.overview?.totalCustomers    || 0,
        newThisMonth: r.data?.overview?.newCustomersMonth || 0
      }))
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleRoleChange = (r) => { setRoleFilter(r); setPage(1); };

  return (
    <AdminLayout title="CUSTOMERS">

      {/* KPI Cards */}
      <div className="admin-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { title: 'Total Customers', value: stats.total,        sub: `${stats.newThisMonth} new this month`, icon: '👥', color: 'blue' },
          { title: 'New This Month',  value: stats.newThisMonth,  sub: 'registered this month',               icon: '🆕', color: 'green' },
          { title: 'Shown',           value: pagination.total || customers.length, sub: 'matching current filter', icon: '🔍', color: 'yellow' }
        ].map(c => (
          <div key={c.title} className={`stat-card ${c.color}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'Orbitron,sans-serif' }}>{c.title}</div>
              <span style={{ fontSize: '1.25rem' }}>{c.icon}</span>
            </div>
            <div className="font-orbitron" style={{ fontWeight: 900, fontSize: '1.75rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>{c.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="admin-filter-bar" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 200 }}>
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem', pointerEvents: 'none' }}>🔍</span>
          <input
            className="form-input"
            style={{ paddingLeft: '2.25rem', width: '100%' }}
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-filter-btns" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { value: 'customer', label: 'Customers' },
            { value: 'admin',    label: 'Admins' },
            { value: '',         label: 'All' }
          ].map(r => (
            <button key={r.value} onClick={() => handleRoleChange(r.value)}
              style={{
                padding: '0.45rem 1rem', borderRadius: '0.35rem',
                border: roleFilter === r.value ? '1px solid #0066FF' : '1px solid var(--border-color)',
                background: roleFilter === r.value ? 'rgba(0,102,255,0.15)' : 'transparent',
                color: roleFilter === r.value ? '#60A5FA' : 'var(--text-secondary)',
                cursor: 'pointer', fontFamily: 'Orbitron, sans-serif',
                fontSize: '0.65rem', letterSpacing: '0.08em',
                fontWeight: 700, textTransform: 'uppercase', transition: 'all 0.15s'
              }}>
              {r.label}
            </button>
          ))}
        </div>

        <button onClick={load}
          style={{ padding: '0.45rem 1rem', background: 'rgba(0,102,255,0.12)', border: '1px solid rgba(0,102,255,0.3)', color: '#60A5FA', borderRadius: '0.35rem', cursor: 'pointer', fontFamily: 'Orbitron,sans-serif', fontSize: '0.65rem', letterSpacing: '0.08em', fontWeight: 700 }}>
          ↺ REFRESH
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1.5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" />
          </div>
        ) : customers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>👥</div>
            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em' }}>NO CUSTOMERS FOUND</div>
          </div>
        ) : (
          <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="rd-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Auth</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0066FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0, overflow: 'hidden', color: 'white' }}>
                          {c.avatar
                            ? <img src={c.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : c.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{c.name}</div>
                          {c.phone && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{c.email}</td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '0.25rem',
                        fontSize: '0.65rem', fontWeight: 700, fontFamily: 'Orbitron, sans-serif',
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                        background: c.role === 'superadmin' ? 'rgba(251,191,36,0.12)' : c.role === 'admin' ? 'rgba(192,132,252,0.12)' : 'rgba(52,211,153,0.12)',
                        color: c.role === 'superadmin' ? '#FBBF24' : c.role === 'admin' ? '#C084FC' : '#34D399',
                        border: `1px solid ${c.role === 'superadmin' ? 'rgba(251,191,36,0.3)' : c.role === 'admin' ? 'rgba(192,132,252,0.3)' : 'rgba(52,211,153,0.3)'}`
                      }}>
                        {c.role}
                      </span>
                    </td>
                    <td className="admin-mob-hide" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {c.authProvider === 'google' ? '🔵 Google' : '📧 Email'}
                    </td>
                    <td className="admin-mob-hide" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0.2rem 0.6rem', borderRadius: '0.25rem',
                        fontSize: '0.7rem', fontWeight: 600,
                        background: c.isActive ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
                        color: c.isActive ? '#34D399' : '#EF4444',
                        border: `1px solid ${c.isActive ? 'rgba(52,211,153,0.25)' : 'rgba(239,68,68,0.25)'}`
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.isActive ? '#34D399' : '#EF4444', display: 'inline-block' }} />
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => setSelected(c)}
                        style={{ padding: '0.35rem 0.75rem', background: 'transparent', border: '1px solid rgba(0,102,255,0.3)', color: '#60A5FA', cursor: 'pointer', borderRadius: '0.25rem', fontFamily: 'Inter,sans-serif', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,102,255,0.12)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="admin-pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '0.4rem 0.9rem', background: 'transparent', border: '1px solid var(--border-color)', color: page === 1 ? 'var(--text-muted)' : 'var(--text-secondary)', borderRadius: '0.35rem', cursor: page === 1 ? 'not-allowed' : 'pointer', fontFamily: 'Inter,sans-serif', fontSize: '0.85rem' }}>
              ← Prev
            </button>
            <span className="font-orbitron" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              {page} / {pagination.pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
              style={{ padding: '0.4rem 0.9rem', background: 'transparent', border: '1px solid var(--border-color)', color: page === pagination.pages ? 'var(--text-muted)' : 'var(--text-secondary)', borderRadius: '0.35rem', cursor: page === pagination.pages ? 'not-allowed' : 'pointer', fontFamily: 'Inter,sans-serif', fontSize: '0.85rem' }}>
              Next →
            </button>
          </div>
        )}
      </div>

      {selected && <CustomerModal customer={selected} onClose={() => setSelected(null)} />}
    </AdminLayout>
  );
}
