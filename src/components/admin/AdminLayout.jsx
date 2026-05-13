// frontend/src/components/admin/AdminLayout.jsx

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'fa-chart-line', exact: true },
  { to: '/admin/orders', label: 'Orders', icon: 'fa-box' },
  { to: '/admin/products', label: 'Products', icon: 'fa-shirt' },
  { to: '/admin/users', label: 'Customers', icon: 'fa-users' },
  { to: '/admin/coupons', label: 'Coupons', icon: 'fa-tag' },
];

const sidebarBase = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  position: 'sticky',
  top: 0,
  overflow: 'hidden',
  flexShrink: 0,
  transition: 'width 0.3s',
};

export default function AdminLayout({ children, title }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (item) =>
    item.exact
      ? location.pathname === item.to
      : location.pathname === item.to || location.pathname.startsWith(item.to + '/');

  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
        className="admin-sidebar"
        style={{ ...sidebarBase, width: collapsed ? '64px' : '260px' }}
      >
        {/* Logo */}
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--rd-border2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          {!collapsed && (
            <Link to="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.1em', color: 'white' }}>
                RACE<span style={{ color: 'var(--rd-blue)' }}>DISTRICT</span>
              </span>
            </Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', color: 'var(--rd-muted)', cursor: 'pointer', fontSize: '0.875rem', padding: '4px' }}>
            <i className={`fas ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`} />
          </button>
        </div>

        {/* User info */}
        {!collapsed && (
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--rd-border2)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--rd-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--rd-blue-bright)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{user?.role}</div>
              </div>
            </div>
          </div>
        )}

        {/* Nav — scrollable with padding so last item is never hidden */}
        <nav style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1rem 0.75rem', paddingBottom: '1rem', paddingRight: '4px' }}>
          {!collapsed && (
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: 'var(--rd-muted)', padding: '0 0.5rem', marginBottom: '0.5rem' }}>
              NAVIGATION
            </div>
          )}
          {NAV.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`admin-nav-item${isActive(item) ? ' active' : ''}`}
              style={{ borderLeft: 'none', borderRadius: '8px', marginBottom: '0.25rem', justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <i className={`fas ${item.icon}`} style={{ width: collapsed ? 'auto' : 20, flexShrink: 0 }} />
              {!collapsed && item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--rd-border2)', flexShrink: 0 }}>
          <Link to="/" className="admin-nav-item" style={{ borderLeft: 'none', borderRadius: '8px', marginBottom: '0.25rem', justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <i className="fas fa-store" style={{ width: collapsed ? 'auto' : 20 }} />
            {!collapsed && 'View Store'}
          </Link>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="admin-nav-item"
            style={{ borderLeft: 'none', borderRadius: '8px', color: 'var(--rd-red)', width: '100%', justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            <i className="fas fa-sign-out-alt" style={{ width: collapsed ? 'auto' : 20 }} />
            {!collapsed && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="admin-content" style={{ flex: 1, minWidth: 0 }}>
        {/* Top bar */}
        <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--rd-border2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#050810', position: 'sticky', top: 0, zIndex: 100 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.1em', color: 'white' }}>{title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--rd-muted)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        <div style={{ padding: '2rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
