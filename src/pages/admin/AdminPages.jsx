import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_BADGE = {
  pending:'badge-pending', confirmed:'badge-confirmed', processing:'badge-processing',
  packed:'badge-processing', shipped:'badge-shipped', out_for_delivery:'badge-out_for_delivery',
  delivered:'badge-delivered', cancelled:'badge-cancelled', returned:'badge-returned'
};
const STATUS_OPTS = ['all','pending','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','returned'];

/* ─────────────────────────────────────────────────────────────────────────────
   GLOBAL ADMIN CSS
   Desktop: sidebar always visible, no hamburger.
   Mobile (≤768px): sidebar hidden off-canvas, hamburger shown, slides in on open.
   Desktop layout is 100% unchanged from original.
───────────────────────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

  /* Dark select — fixes white option bg on Chrome (desktop + mobile) */
  select { color-scheme: dark; }
  select option { background: #1a1a2e !important; color: #ffffff !important; }

  /* ════════════════════════════════════════════════
     DESKTOP LAYOUT (base styles — no media query)
  ════════════════════════════════════════════════ */

  .admin-layout { display: flex; min-height: 100vh; }

  /* Sidebar — always visible on desktop, in normal flow */
  .admin-sidebar {
    width: 240px; flex-shrink: 0;
    display: flex; flex-direction: column;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border-color);
    position: sticky; top: 0; height: 100vh; overflow-y: auto; z-index: 200;
  }

  /* Overlay — never shown on desktop */
  .admin-sidebar-overlay { display: none !important; }

  /* Hamburger — never shown on desktop */
  .mob-hamburger { display: none !important; }

  /* Main content */
  .admin-content { flex: 1; min-width: 0; display: flex; flex-direction: column; }

  /* Top bar */
  .admin-topbar {
    padding: 1.25rem 2rem;
    border-bottom: 1px solid var(--border-color);
    display: flex; align-items: center; justify-content: space-between;
    background: var(--bg-secondary);
    position: sticky; top: 0; z-index: 100; gap: 0.75rem;
  }
  .admin-topbar-date { display: block; }
  .admin-page-content { padding: 2rem; flex: 1; }

  /* Dashboard grids */
  .dash-stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; }
  .dash-charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .dash-bottom-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .dash-growth-row { display: flex; flex-wrap: wrap; }
  .dash-recent-table .col-items, .dash-recent-table .col-date { display: table-cell; }

  /* ap-table — normal table on desktop */
  .ap-table-wrap { overflow-x: auto; }
  .ap-table { display: table; width: 100%; border-collapse: collapse; }
  .ap-table thead { display: table-header-group; }
  .ap-table tbody { display: table-row-group; }
  .ap-table tr { display: table-row; }
  .ap-table td { display: table-cell; }
  .ap-table td[data-label]::before { display: none; }
  .ap-col-hide { display: table-cell; }
  .ap-table td.td-check { position: static; }

  /* Orders */
  .ap-orders-filter { display: flex; gap: 0.625rem; align-items: center; flex-wrap: wrap; }
  .ap-status-pills { display: flex; gap: 0.375rem; flex-wrap: wrap; }
  .ap-bulk-bar { display: flex; align-items: center; gap: 0.625rem; }
  .ap-bulk-btns { display: flex; gap: 0.375rem; }
  .ap-bulk-btns button { flex: 0 1 auto; }
  .ap-expanded-grid { grid-template-columns: 1fr 1fr 1fr; }

  /* Products */
  .ap-products-toolbar { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
  .ap-add-btn { width: auto; }
  .ap-product-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1.25rem; }
  .ap-product-flags { display: flex; gap: 1.5rem; flex-wrap: wrap; }
  .ap-image-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px,1fr)); gap: 0.75rem; }
  .ap-product-actions { display: flex; gap: 0.375rem; }
  .ap-product-actions button { flex: 0 1 auto; }

  /* Users */
  .ap-users-toolbar { display: flex; gap: 0.625rem; align-items: center; }

  /* Modal — centered on desktop */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; backdrop-filter: blur(4px); padding: 1rem;
  }
  .modal {
    width: auto; max-width: 520px; max-height: 90vh; overflow-y: auto;
    border-radius: 0.75rem; padding: 2rem;
    background: var(--bg-card); box-shadow: 0 4px 40px rgba(0,0,0,0.4);
  }
  .modal::before { display: none; }
  .ap-order-modal-actions { display: flex; gap: 0.75rem; }
  .ap-product-modal-actions { display: flex; gap: 0.75rem; }
  .ap-delete-modal-actions { display: flex; gap: 0.75rem; }

  /* Pagination */
  .ap-pagination {
    display: flex; gap: 0.375rem; justify-content: center;
    padding: 0.875rem 1rem; border-top: 1px solid var(--border-color); flex-wrap: wrap;
  }

  /* rd-table (Customers page) — desktop */
  .admin-table-wrap { overflow-x: auto; }
  .rd-table { display: table; width: 100%; border-collapse: collapse; }
  .rd-table thead { display: table-header-group; }
  .rd-table tbody { display: table-row-group; }
  .rd-table tr { display: table-row; background: transparent; border: none; padding: 0; }
  .rd-table td { display: table-cell; padding: 0.875rem 1rem; border-bottom: 1px solid var(--border-color); }
  .admin-mob-hide { display: table-cell; }
  .admin-filter-bar { display: flex; gap: 0.625rem; align-items: center; flex-wrap: wrap; }
  .admin-filter-btns { display: flex; gap: 0.375rem; flex-wrap: wrap; }
  .admin-pagination { display: flex; gap: 0.375rem; justify-content: center; padding: 0.875rem; border-top: 1px solid var(--border-color); }


  /* ════════════════════════════════════════════════
     MOBILE  ≤ 768px
     Only these rules apply on small screens.
     Desktop rules above are NOT touched.
  ════════════════════════════════════════════════ */
  @media (max-width: 768px) {

    /* Show hamburger button */
    .mob-hamburger {
      display: flex !important;
      align-items: center; justify-content: center;
      width: 40px; height: 40px;
      background: rgba(0,102,255,0.12);
      border: 1px solid rgba(0,102,255,0.3);
      border-radius: 0.5rem; cursor: pointer;
      color: #60A5FA; font-size: 1.25rem; flex-shrink: 0;
      transition: background 0.15s;
    }

    /* Sidebar: pulled off-screen to the left by default */
    .admin-sidebar {
      position: fixed !important;
      top: 0 !important; left: 0 !important; bottom: 0 !important;
      width: 270px !important; height: 100vh !important;
      transform: translateX(-100%) !important;
      transition: transform 0.28s cubic-bezier(0.4,0,0.2,1) !important;
      z-index: 300 !important;
    }

    /* Sidebar open */
    .admin-sidebar.mob-open {
      transform: translateX(0) !important;
      box-shadow: 8px 0 40px rgba(0,0,0,0.6) !important;
    }

    /* Overlay */
    .admin-sidebar-overlay {
      display: none;
      position: fixed !important; inset: 0 !important;
      background: rgba(0,0,0,0.65) !important;
      z-index: 250 !important;
      backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
    }
    .admin-sidebar-overlay.mob-open { display: block !important; }

    /* Content takes full width */
    .admin-content { width: 100% !important; }

    /* Topbar compact */
    .admin-topbar { padding: 0.75rem 1rem !important; }
    .admin-topbar-date { display: none !important; }
    .admin-page-content { padding: 0.875rem !important; }

    /* Touch targets */
    button { min-height: 44px; }
    .btn-no-min { min-height: unset !important; }

    /* Dashboard */
    .dash-stats-grid { grid-template-columns: 1fr 1fr !important; gap: 0.625rem !important; }
    .dash-stat-value { font-size: 1.2rem !important; }
    .dash-charts-row { grid-template-columns: 1fr !important; gap: 0.75rem !important; }
    .dash-bottom-row { grid-template-columns: 1fr !important; gap: 0.75rem !important; }
    .dash-growth-row > div {
      flex: 1 1 45% !important; border-right: none !important;
      border-bottom: 1px solid var(--border-color) !important;
      padding: 0.625rem 0.75rem !important;
    }
    .dash-growth-row > div:last-child { border-bottom: none; }
    .dash-recent-table .col-items,
    .dash-recent-table .col-date { display: none !important; }

    /* ap-table → cards */
    .ap-table-wrap { overflow-x: unset !important; }
    .ap-table { display: block !important; }
    .ap-table thead { display: none !important; }
    .ap-table tbody {
      display: flex !important; flex-direction: column !important;
      gap: 0.75rem !important; padding: 0.75rem !important;
    }
    .ap-table tr {
      display: block !important;
      background: var(--bg-secondary) !important;
      border: 1px solid var(--border-color) !important;
      border-radius: 0.625rem !important;
      padding: 0.875rem !important; position: relative !important;
    }
    .ap-table td { display: block !important; padding: 0.15rem 0 !important; border: none !important; font-size: 0.875rem; }
    .ap-table td[data-label]::before {
      content: attr(data-label);
      display: block; font-size: 0.6rem; text-transform: uppercase;
      letter-spacing: 0.1em; color: var(--text-muted);
      font-family: Orbitron, sans-serif; margin-bottom: 0.15rem;
    }
    .ap-col-hide { display: none !important; }
    .ap-table td.td-check {
      position: absolute !important; top: 0.875rem !important;
      right: 0.875rem !important; width: auto !important; padding: 0 !important;
    }
    .ap-table td.td-check input { width: 20px; height: 20px; }

    /* Orders filter */
    .ap-orders-filter { flex-direction: column !important; align-items: stretch !important; gap: 0.625rem !important; }
    .ap-status-pills {
      display: flex !important; overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
      gap: 0.375rem !important; padding-bottom: 4px !important;
      scrollbar-width: none !important; flex-wrap: nowrap !important;
    }
    .ap-status-pills::-webkit-scrollbar { display: none; }
    .ap-status-pills button { flex-shrink: 0 !important; }
    .ap-bulk-bar { flex-direction: column !important; align-items: flex-start !important; gap: 0.5rem !important; }
    .ap-bulk-btns { display: flex !important; flex-wrap: wrap !important; gap: 0.375rem !important; width: 100% !important; }
    .ap-bulk-btns button { flex: 1 1 auto !important; }
    .ap-expanded-grid { grid-template-columns: 1fr !important; gap: 0.75rem !important; }

    /* Products */
    .ap-products-toolbar { flex-direction: column !important; align-items: stretch !important; gap: 0.625rem !important; }
    .ap-add-btn { width: 100% !important; }
    .ap-product-actions { display: flex !important; flex-wrap: wrap !important; }
    .ap-product-actions button { flex: 1 !important; }
    .ap-product-form-grid { grid-template-columns: 1fr !important; }
    .ap-product-form-grid > * { grid-column: 1 !important; }
    .ap-product-flags { flex-direction: column !important; gap: 0.5rem !important; }
    .ap-image-grid { grid-template-columns: repeat(2,1fr) !important; }

    /* Users */
    .ap-users-toolbar { flex-direction: column !important; align-items: stretch !important; gap: 0.625rem !important; }

    /* Modal → bottom sheet */
    .modal-overlay { padding: 0 !important; align-items: flex-end !important; }
    .modal {
      width: 100vw !important; max-width: 100vw !important;
      max-height: 92vh !important; border-radius: 1.25rem 1.25rem 0 0 !important;
      padding: 1.5rem 1.25rem 2rem !important; margin: 0 !important;
    }
    .modal::before {
      content: '' !important; display: block !important;
      width: 40px; height: 4px; background: var(--border-color);
      border-radius: 2px; margin: 0 auto 1.25rem;
    }
    .ap-order-modal-actions,
    .ap-product-modal-actions,
    .ap-delete-modal-actions { flex-direction: column !important; gap: 0.625rem !important; }
    .ap-order-modal-actions button,
    .ap-product-modal-actions button,
    .ap-delete-modal-actions button { width: 100% !important; min-height: 48px !important; }

    /* Pagination */
    .ap-pagination { gap: 0.25rem !important; padding: 0.75rem !important; }

    /* rd-table (Customers) → cards */
    .admin-table-wrap { overflow-x: unset !important; }
    .rd-table { display: block !important; }
    .rd-table thead { display: none !important; }
    .rd-table tbody {
      display: flex !important; flex-direction: column !important;
      gap: 0.625rem !important; padding: 0.625rem !important;
    }
    .rd-table tr {
      display: flex !important; flex-wrap: wrap !important;
      gap: 0.375rem 0.625rem !important;
      background: var(--bg-secondary) !important;
      border: 1px solid var(--border-color) !important;
      border-radius: 0.625rem !important;
      padding: 0.75rem !important; align-items: center !important;
    }
    .rd-table td { display: block !important; padding: 0 !important; border: none !important; }
    .admin-mob-hide { display: none !important; }
    .admin-pagination { gap: 0.375rem !important; flex-wrap: wrap !important; }
    .admin-filter-bar { flex-direction: column !important; align-items: stretch !important; gap: 0.625rem !important; }
    .admin-filter-bar input { width: 100% !important; }
    .admin-filter-btns { flex-wrap: wrap !important; gap: 0.375rem !important; }
    .modal .modal-stats-grid { grid-template-columns: 1fr !important; }
  }
`;

// ── NAV items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to:'/admin',          label:'Dashboard', icon:'📊', exact:true },
  { to:'/admin/orders',   label:'Orders',    icon:'📦' },
  { to:'/admin/products', label:'Products',  icon:'🏎️' },
  { to:'/admin/users',    label:'Customers', icon:'👥' },
  { to:'/admin/coupons',  label:'Coupons',   icon:'🏷️' },
];

// ══════════════════════════════════════════════════════════════════════════════
// AdminLayout
// ══════════════════════════════════════════════════════════════════════════════
export function AdminLayout({ children, title }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (to, exact) => exact ? location.pathname === to : location.pathname.startsWith(to);

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Lock body scroll when sidebar open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <div className="admin-layout">
      <style>{GLOBAL_CSS}</style>

      {/* Overlay — mobile only, click to close */}
      <div
        className={`admin-sidebar-overlay${sidebarOpen ? ' mob-open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar${sidebarOpen ? ' mob-open' : ''}`}>

        {/* Logo */}
        <div style={{padding:'1.25rem 1.25rem 1rem',borderBottom:'1px solid var(--border-color)',flexShrink:0}}>
          <Link to="/" style={{textDecoration:'none',display:'block'}}>
            <div className="font-orbitron" style={{fontSize:'0.95rem',fontWeight:900,letterSpacing:'0.1em',color:'var(--text-primary)'}}>
              RACE<span style={{color:'#0066FF'}}>DISTRICT</span>
            </div>
          </Link>
          <div style={{fontSize:'0.58rem',color:'var(--text-muted)',letterSpacing:'0.12em',marginTop:'0.25rem',textTransform:'uppercase'}}>Admin Panel</div>
        </div>

        {/* User */}
        <div style={{padding:'0.875rem 1.25rem',borderBottom:'1px solid var(--border-color)',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
            <div style={{width:36,height:36,borderRadius:'50%',background:'#0066FF',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'0.875rem',flexShrink:0,color:'white',overflow:'hidden'}}>
              {user?.avatar ? <img src={user.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : user?.name?.[0]?.toUpperCase()||'?'}
            </div>
            <div style={{minWidth:0}}>
              <div style={{fontWeight:700,fontSize:'0.875rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--text-primary)'}}>{user?.name}</div>
              <div style={{fontSize:'0.6rem',color:'#0066FF',textTransform:'uppercase',letterSpacing:'0.1em'}}>{user?.role}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{flex:1,padding:'0.5rem',overflowY:'auto'}}>
          <div style={{fontSize:'0.58rem',color:'var(--text-muted)',letterSpacing:'0.12em',textTransform:'uppercase',padding:'0.5rem 0.75rem 0.375rem',fontFamily:'Orbitron,sans-serif'}}>Navigation</div>
          {NAV_ITEMS.map(item => {
            const active = isActive(item.to, item.exact);
            return (
              <Link key={item.to} to={item.to}
                style={{display:'flex',alignItems:'center',gap:'0.625rem',padding:'0.7rem 0.875rem',borderRadius:'0.5rem',marginBottom:'0.125rem',textDecoration:'none',fontSize:'0.875rem',fontWeight:active?700:500,color:active?'#60A5FA':'var(--text-secondary)',background:active?'rgba(0,102,255,0.12)':'transparent',transition:'all 0.15s',minHeight:'44px',borderLeft:active?'2px solid #0066FF':'2px solid transparent'}}>
                <span style={{fontSize:'1rem',flexShrink:0}}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{padding:'0.5rem',borderTop:'1px solid var(--border-color)',flexShrink:0}}>
          <Link to="/" style={{display:'flex',alignItems:'center',gap:'0.625rem',padding:'0.7rem 0.875rem',borderRadius:'0.5rem',textDecoration:'none',fontSize:'0.875rem',color:'var(--text-secondary)',minHeight:'44px'}}>
            🏪 View Store
          </Link>
          <button onClick={() => { logout(); navigate('/login'); }}
            style={{display:'flex',alignItems:'center',gap:'0.625rem',padding:'0.7rem 0.875rem',borderRadius:'0.5rem',fontSize:'0.875rem',color:'#EF4444',background:'none',border:'none',width:'100%',cursor:'pointer',fontFamily:'inherit',minHeight:'44px'}}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="admin-content">
        <div className="admin-topbar">
          {/* Hamburger — CSS hides this on desktop, shows on mobile */}
          <button
            className="mob-hamburger"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>

          <h1 className="font-orbitron" style={{fontSize:'0.95rem',fontWeight:700,letterSpacing:'0.1em',color:'var(--text-primary)',flex:1,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {title}
          </h1>

          <span className="admin-topbar-date" style={{fontSize:'0.78rem',color:'var(--text-muted)',whiteSpace:'nowrap',flexShrink:0}}>
            {new Date().toLocaleDateString('en-US',{weekday:'short',year:'numeric',month:'short',day:'numeric'})}
          </span>
        </div>

        <div className="admin-page-content">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────
const Th = ({children}) => (
  <th style={{padding:'0.75rem 1rem',textAlign:'left',fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text-muted)',borderBottom:'1px solid var(--border-color)',fontFamily:'Orbitron,sans-serif',fontWeight:600,whiteSpace:'nowrap'}}>
    {children}
  </th>
);

const Td = ({children, style={}, className='', 'data-label':label}) => (
  <td data-label={label} className={className} style={{padding:'0.875rem 1rem',borderBottom:'1px solid var(--border-color)',verticalAlign:'middle',color:'var(--text-primary)',...style}}>
    {children}
  </td>
);

function Badge({status}) {
  return <span className={`badge ${STATUS_BADGE[status]||'badge-pending'}`} style={{textTransform:'capitalize'}}>{status?.replace(/_/g,' ')}</span>;
}

function Modal({title, onClose, children, wide}) {
  useEffect(() => {
    const fn = e => { if (e.key==='Escape') onClose(); };
    document.addEventListener('keydown', fn);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', fn); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:wide?'800px':'520px',width:'100%'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}>
          <h3 className="font-orbitron" style={{fontSize:'0.85rem',letterSpacing:'0.1em',color:'var(--text-primary)',paddingRight:'1rem',lineHeight:1.3}}>{title}</h3>
          <button onClick={onClose} className="btn-no-min" style={{background:'rgba(255,255,255,0.05)',border:'1px solid var(--border-color)',color:'var(--text-muted)',cursor:'pointer',fontSize:'1.25rem',lineHeight:1,padding:0,width:36,height:36,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const FL = ({label, children}) => (
  <div style={{marginBottom:'1rem'}}>
    <label style={{display:'block',fontSize:'0.7rem',color:'var(--text-muted)',marginBottom:'0.375rem',textTransform:'uppercase',letterSpacing:'0.08em',fontFamily:'Orbitron,sans-serif'}}>{label}</label>
    {children}
  </div>
);

const inputStyle = {
  width:'100%', padding:'0.75rem',
  background:'var(--bg-input)', border:'1px solid var(--border-color)',
  borderRadius:'0.5rem', color:'var(--text-primary)',
  fontFamily:'Inter,sans-serif', fontSize:'0.9rem',
  outline:'none', WebkitAppearance:'none',
};

// ── Theme Changer ─────────────────────────────────────────────────────────────
const THEMES = [
  { key:'dark',  label:'Dark',  bg:'#0a0a0f' },
  { key:'light', label:'Light', bg:'#e0e0e0' },
  { key:'blue',  label:'Blue',  bg:'#0d1b2a' },
];

export function ThemeChanger() {
  const [current, setCurrent] = useState(() => localStorage.getItem('darkMode')==='false'?'light':'dark');
  const apply = (key) => {
    setCurrent(key);
    if (key==='light') { document.body.classList.remove('dark-mode'); document.body.classList.add('light-mode'); localStorage.setItem('darkMode','false'); }
    else { document.body.classList.remove('light-mode'); document.body.classList.add('dark-mode'); localStorage.setItem('darkMode','true'); }
  };
  return (
    <div style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
      <span style={{fontSize:'0.68rem',color:'var(--text-muted)',letterSpacing:'0.08em',fontFamily:'Orbitron,sans-serif'}}>THEME</span>
      {THEMES.map(t => (
        <button key={t.key} onClick={()=>apply(t.key)} title={t.label} className="btn-no-min"
          style={{width:28,height:28,borderRadius:'50%',background:t.bg,border:current===t.key?'2px solid #0066FF':'2px solid rgba(128,128,128,0.3)',cursor:'pointer',padding:0,transition:'border-color 0.2s',flexShrink:0}}/>
      ))}
    </div>
  );
}

// ── Low Stock Alerts ──────────────────────────────────────────────────────────
function LowStockAlerts({ products }) {
  const lowStock   = products.filter(p => p.stock!=null && p.stock>0 && p.stock<=(p.lowStockThreshold||5));
  const outOfStock = products.filter(p => p.stock===0 && p.isActive);
  if (!lowStock.length && !outOfStock.length) return null;
  return (
    <div style={{marginBottom:'1.25rem',display:'flex',flexDirection:'column',gap:'0.5rem'}}>
      {outOfStock.length>0 && (
        <div style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:'0.75rem',padding:'0.875rem 1rem',display:'flex',alignItems:'flex-start',gap:'0.75rem',flexWrap:'wrap'}}>
          <span style={{color:'#EF4444',fontWeight:700,fontSize:'1.1rem',flexShrink:0}}>🔴</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,color:'#F87171',fontSize:'0.85rem',marginBottom:'0.2rem'}}>Out of Stock ({outOfStock.length})</div>
            <div style={{color:'var(--text-muted)',fontSize:'0.82rem',wordBreak:'break-word'}}>{outOfStock.map(p=>p.name).join(', ')}</div>
          </div>
        </div>
      )}
      {lowStock.length>0 && (
        <div style={{background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.25)',borderRadius:'0.75rem',padding:'0.875rem 1rem',display:'flex',alignItems:'flex-start',gap:'0.75rem',flexWrap:'wrap'}}>
          <span style={{color:'#FBBF24',fontWeight:700,fontSize:'1.1rem',flexShrink:0}}>⚠️</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,color:'#FBBF24',fontSize:'0.85rem',marginBottom:'0.2rem'}}>Low Stock ({lowStock.length})</div>
            <div style={{color:'var(--text-muted)',fontSize:'0.82rem',wordBreak:'break-word'}}>{lowStock.map(p=>`${p.name} (${p.stock} left)`).join(', ')}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN ORDERS
// ══════════════════════════════════════════════════════════════════════════════
export function AdminOrders() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders]           = useState([]);
  const [pagination, setPagination]   = useState({});
  const [loading, setLoading]         = useState(true);
  const [status, setStatus]           = useState(searchParams.get('status')||'all');
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [selected, setSelected]       = useState([]);
  const [editOrder, setEditOrder]     = useState(null);
  const [newStatus, setNewStatus]     = useState('');
  const [statusNote, setStatusNote]   = useState('');
  const [trackingNum, setTrackingNum] = useState('');
  const [updating, setUpdating]       = useState(false);
  const [expanded, setExpanded]       = useState(null);
  const [error, setError]             = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = {page,limit:15};
      if (status!=='all') params.status = status;
      if (search.trim()) params.search = search.trim();
      const res = await adminAPI.getOrders(params);
      setOrders(res.data.orders||[]);
      setPagination(res.data.pagination||{});
    } catch(e) { setError(e.message||'Failed to load orders'); }
    finally { setLoading(false); }
  }, [status,page,search]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      await adminAPI.updateOrderStatus(editOrder._id,{status:newStatus,note:statusNote,trackingNumber:trackingNum});
      setEditOrder(null); setStatusNote(''); setTrackingNum(''); load();
    } catch(e) { alert(e.message||'Update failed'); }
    finally { setUpdating(false); }
  };

  const handleBulk = async (bulkStatus) => {
    if (!selected.length) return;
    if (!window.confirm(`Update ${selected.length} order(s) to "${bulkStatus}"?`)) return;
    try { await adminAPI.bulkUpdateOrders({orderIds:selected,status:bulkStatus}); setSelected([]); load(); }
    catch(e) { alert(e.message||'Bulk update failed'); }
  };

  const toggleSel = id => setSelected(s => s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  const toggleAll = () => setSelected(s => s.length===orders.length?[]:orders.map(o=>o._id));

  return (
    <AdminLayout title="ORDER MANAGEMENT">

      {/* Filter */}
      <div style={{background:'var(--bg-card)',border:'1px solid var(--border-color)',borderRadius:'0.75rem',padding:'1rem',marginBottom:'1rem'}}>
        <div className="ap-orders-filter">
          <div style={{display:'flex',gap:'0.5rem',flex:1,minWidth:0}}>
            <input style={inputStyle} placeholder="Search order number..." value={search}
              onChange={e=>{setSearch(e.target.value);setPage(1);}} onKeyDown={e=>e.key==='Enter'&&load()}/>
            <button onClick={load} style={{padding:'0.625rem 1rem',background:'rgba(0,102,255,0.15)',border:'1px solid rgba(0,102,255,0.3)',borderRadius:'0.5rem',color:'#60A5FA',cursor:'pointer',fontFamily:'Inter,sans-serif',fontSize:'0.875rem',fontWeight:600,flexShrink:0,whiteSpace:'nowrap',minHeight:'unset'}}>
              Search
            </button>
          </div>
          <div className="ap-status-pills">
            {STATUS_OPTS.map(s => (
              <button key={s} onClick={()=>{setStatus(s);setPage(1);}} className="btn-no-min"
                style={{padding:'0.35rem 0.875rem',fontSize:'0.73rem',textTransform:'capitalize',borderRadius:'2rem',background:status===s?'#0066FF':'var(--bg-secondary)',border:'1px solid '+(status===s?'#0066FF':'var(--border-color)'),color:status===s?'white':'var(--text-secondary)',cursor:'pointer',transition:'all 0.15s',whiteSpace:'nowrap',flexShrink:0}}>
                {s.replace(/_/g,' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk bar */}
      {selected.length>0 && (
        <div className="ap-bulk-bar" style={{background:'rgba(0,102,255,0.08)',border:'1px solid rgba(0,102,255,0.2)',borderRadius:'0.75rem',padding:'0.875rem 1rem',marginBottom:'0.875rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:'0.625rem',width:'100%'}}>
            <span style={{color:'#60A5FA',fontWeight:700,fontSize:'0.875rem'}}>{selected.length} selected</span>
            <button onClick={()=>setSelected([])} className="btn-no-min" style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',marginLeft:'auto',fontSize:'0.875rem',fontFamily:'Inter,sans-serif',padding:'0.25rem'}}>✕ Clear</button>
          </div>
          <div style={{color:'var(--text-muted)',fontSize:'0.78rem'}}>Bulk move to:</div>
          <div className="ap-bulk-btns">
            {['confirmed','processing','shipped','delivered','cancelled'].map(s => (
              <button key={s} onClick={()=>handleBulk(s)} className="btn-no-min"
                style={{padding:'0.4rem 0.75rem',background:'rgba(0,102,255,0.12)',color:'#60A5FA',border:'1px solid rgba(0,102,255,0.25)',cursor:'pointer',borderRadius:'0.375rem',fontFamily:'Inter,sans-serif',fontSize:'0.8rem',fontWeight:600,textTransform:'capitalize'}}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <div style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'0.75rem',padding:'0.875rem 1rem',marginBottom:'0.875rem',color:'#F87171',fontSize:'0.875rem'}}>{error}</div>}

      {/* Orders table */}
      <div style={{background:'var(--bg-card)',border:'1px solid var(--border-color)',borderRadius:'0.75rem',overflow:'hidden'}}>
        {loading ? (
          <div style={{padding:'4rem',textAlign:'center'}}><div className="spinner" style={{margin:'0 auto'}}/></div>
        ) : orders.length===0 ? (
          <div style={{padding:'4rem 2rem',textAlign:'center',color:'var(--text-muted)'}}>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>📭</div>
            <p>No orders found{status!=='all'?` with status "${status}"`:''}</p>
          </div>
        ) : (
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <Th><input type="checkbox" checked={selected.length===orders.length&&orders.length>0} onChange={toggleAll} style={{accentColor:'#0066FF',width:18,height:18}}/></Th>
                  <Th>Order</Th><Th>Customer</Th><Th>Items</Th><Th>Total</Th><Th>Status</Th><Th>Date</Th><Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <React.Fragment key={order._id}>
                    <tr style={{cursor:'pointer',transition:'background 0.15s'}}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(0,102,255,0.04)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>

                      <td className="td-check" style={{padding:'0.875rem 1rem',borderBottom:'1px solid var(--border-color)',verticalAlign:'middle'}}>
                        <input type="checkbox" checked={selected.includes(order._id)} onChange={()=>toggleSel(order._id)} style={{accentColor:'#0066FF',width:18,height:18}} onClick={e=>e.stopPropagation()}/>
                      </td>

                      <Td data-label="Order">
                        <button onClick={()=>setExpanded(expanded===order._id?null:order._id)} className="btn-no-min"
                          style={{background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.4rem',padding:0}}>
                          <span className="font-orbitron" style={{color:'#0066FF',fontSize:'0.85rem'}}>{order.orderNumber}</span>
                          <span style={{color:'var(--text-muted)',fontSize:'0.7rem'}}>{expanded===order._id?'▲':'▼'}</span>
                        </button>
                      </Td>

                      <Td data-label="Customer">
                        <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                          <div style={{width:28,height:28,borderRadius:'50%',background:'#0066FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',fontWeight:700,flexShrink:0,overflow:'hidden',color:'white'}}>
                            {order.customer?.avatar?<img src={order.customer.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:order.customer?.name?.[0]||'?'}
                          </div>
                          <div style={{minWidth:0}}>
                            <div style={{fontSize:'0.875rem',fontWeight:600,color:'var(--text-primary)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{order.customer?.name||'Guest'}</div>
                            <div style={{fontSize:'0.7rem',color:'var(--text-muted)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{order.customer?.email}</div>
                          </div>
                        </div>
                      </Td>

                      <Td data-label="Items" className="ap-col-hide" style={{color:'var(--text-secondary)',fontSize:'0.8rem'}}>
                        {order.items?.slice(0,2).map((it,i)=><div key={i}>📦 {it.name} ×{it.quantity}</div>)}
                        {order.items?.length>2&&<div style={{color:'var(--text-muted)'}}>+{order.items.length-2} more</div>}
                      </Td>

                      <Td data-label="Total"><span className="font-orbitron" style={{fontWeight:700,color:'var(--text-primary)'}}>${order.total?.toFixed(2)}</span></Td>
                      <Td data-label="Status"><Badge status={order.status}/></Td>
                      <Td data-label="Date" className="ap-col-hide" style={{color:'var(--text-muted)',fontSize:'0.8rem',whiteSpace:'nowrap'}}>{new Date(order.createdAt).toLocaleDateString()}</Td>

                      <Td data-label=" ">
                        <button onClick={()=>{setEditOrder(order);setNewStatus(order.status);setStatusNote('');setTrackingNum('');}} className="btn-no-min"
                          style={{padding:'0.4rem 0.875rem',background:'transparent',border:'1px solid rgba(0,102,255,0.3)',color:'#60A5FA',cursor:'pointer',borderRadius:'0.5rem',fontFamily:'Inter,sans-serif',fontSize:'0.8rem',fontWeight:600,whiteSpace:'nowrap'}}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(0,102,255,0.1)'}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          ✏️ Edit
                        </button>
                      </Td>
                    </tr>

                    {expanded===order._id && (
                      <tr>
                        <td colSpan={8} style={{background:'rgba(0,102,255,0.03)',padding:'1rem',borderBottom:'1px solid var(--border-color)'}}>
                          <div className="ap-expanded-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'1.5rem',fontSize:'0.875rem'}}>
                            <div>
                              <div style={{color:'var(--text-muted)',fontSize:'0.68rem',letterSpacing:'0.1em',marginBottom:'0.5rem',fontFamily:'Orbitron,sans-serif'}}>SHIP TO</div>
                              <div style={{color:'var(--text-primary)',fontWeight:600}}>{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</div>
                              <div style={{color:'var(--text-secondary)'}}>{order.shippingAddress?.street}</div>
                              <div style={{color:'var(--text-secondary)'}}>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}</div>
                              {order.shippingAddress?.phone&&<div style={{color:'var(--text-secondary)'}}>{order.shippingAddress.phone}</div>}
                            </div>
                            <div>
                              <div style={{color:'var(--text-muted)',fontSize:'0.68rem',letterSpacing:'0.1em',marginBottom:'0.5rem',fontFamily:'Orbitron,sans-serif'}}>SHIPPING</div>
                              <div style={{color:'var(--text-primary)'}}>{order.shippingMethod?.name||'Standard'}</div>
                              {order.tracking?.number&&<div style={{color:'#0066FF',fontFamily:'monospace',fontSize:'0.8rem',marginTop:'0.25rem'}}>#{order.tracking.number}</div>}
                            </div>
                            <div>
                              <div style={{color:'var(--text-muted)',fontSize:'0.68rem',letterSpacing:'0.1em',marginBottom:'0.5rem',fontFamily:'Orbitron,sans-serif'}}>BREAKDOWN</div>
                              <div style={{color:'var(--text-secondary)'}}>Subtotal: ${order.subtotal?.toFixed(2)||'—'}</div>
                              <div style={{color:'var(--text-secondary)'}}>Shipping: ${order.shippingCost?.toFixed(2)||'0.00'}</div>
                              <div style={{color:'var(--text-secondary)'}}>Tax: ${order.tax?.toFixed(2)||'—'}</div>
                              <div style={{color:'#34D399',fontWeight:700,marginTop:'0.25rem'}}>Total: ${order.total?.toFixed(2)}</div>
                            </div>
                          </div>
                          {order.adminNote&&<div style={{marginTop:'0.875rem',padding:'0.625rem 0.875rem',background:'rgba(251,191,36,0.06)',borderRadius:'0.5rem',fontSize:'0.8rem',color:'#FBBF24'}}>📝 {order.adminNote}</div>}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages>1 && (
          <div className="ap-pagination">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="btn-no-min"
              style={{padding:'0.4rem 0.875rem',background:'var(--bg-secondary)',border:'1px solid var(--border-color)',borderRadius:'0.375rem',color:'var(--text-secondary)',cursor:'pointer',fontSize:'0.875rem'}}>← Prev</button>
            {[...Array(Math.min(pagination.pages,7))].map((_,i)=>(
              <button key={i} onClick={()=>setPage(i+1)} className="btn-no-min"
                style={{padding:'0.4rem 0',background:page===i+1?'#0066FF':'var(--bg-secondary)',border:'1px solid var(--border-color)',borderRadius:'0.375rem',color:page===i+1?'white':'var(--text-secondary)',cursor:'pointer',minWidth:'2.5rem',fontSize:'0.875rem'}}>
                {i+1}
              </button>
            ))}
            <button onClick={()=>setPage(p=>Math.min(pagination.pages,p+1))} disabled={page===pagination.pages} className="btn-no-min"
              style={{padding:'0.4rem 0.875rem',background:'var(--bg-secondary)',border:'1px solid var(--border-color)',borderRadius:'0.375rem',color:'var(--text-secondary)',cursor:'pointer',fontSize:'0.875rem'}}>Next →</button>
          </div>
        )}
      </div>

      {editOrder && (
        <Modal title={`UPDATE ORDER — ${editOrder.orderNumber}`} onClose={()=>setEditOrder(null)}>
          <div style={{marginBottom:'1.25rem',padding:'0.875rem',background:'var(--bg-secondary)',borderRadius:'0.625rem',fontSize:'0.875rem'}}>
            <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem 1rem'}}>
              <span><span style={{color:'var(--text-muted)'}}>Customer: </span><span style={{fontWeight:600,color:'var(--text-primary)'}}>{editOrder.customer?.name||'Guest'}</span></span>
              <span><span style={{color:'var(--text-muted)'}}>Total: </span><span style={{color:'#0066FF',fontWeight:700}}>${editOrder.total?.toFixed(2)}</span></span>
              <Badge status={editOrder.status}/>
            </div>
          </div>
          <FL label="New Status">
            <select style={{...inputStyle,color:'var(--text-primary)',colorScheme:'dark'}} value={newStatus} onChange={e=>setNewStatus(e.target.value)}>
              {['pending','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','returned','refunded'].map(s=>(
                <option key={s} value={s} style={{background:'#1a1a2e',color:'#ffffff'}}>{s.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>
              ))}
            </select>
          </FL>
          {newStatus==='shipped'&&(
            <FL label="Tracking Number">
              <input style={inputStyle} value={trackingNum} onChange={e=>setTrackingNum(e.target.value)} placeholder="e.g. 1Z999AA10123456784"/>
            </FL>
          )}
          <FL label="Admin Note (optional)">
            <textarea style={{...inputStyle,resize:'vertical'}} rows={3} value={statusNote} onChange={e=>setStatusNote(e.target.value)} placeholder="Internal note for this status change..."/>
          </FL>
          <div className="ap-order-modal-actions" style={{marginTop:'0.5rem'}}>
            <button onClick={handleUpdate} disabled={updating}
              style={{flex:1,padding:'0.875rem',background:'#0066FF',border:'2px solid #0066FF',color:'white',fontWeight:700,cursor:'pointer',borderRadius:'0.5rem',fontFamily:'Orbitron,sans-serif',fontSize:'0.78rem',letterSpacing:'0.06em',opacity:updating?0.6:1,minHeight:'unset'}}>
              {updating?'UPDATING...':'UPDATE ORDER'}
            </button>
            <button onClick={()=>setEditOrder(null)}
              style={{padding:'0.875rem 1.25rem',background:'transparent',border:'1px solid var(--border-color)',color:'var(--text-secondary)',cursor:'pointer',borderRadius:'0.5rem',fontFamily:'Inter,sans-serif',fontWeight:600,minHeight:'unset'}}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN PRODUCTS
// ══════════════════════════════════════════════════════════════════════════════
const EMPTY_PRODUCT = {
  name:'', sku:'', price:'', comparePrice:'', cost:'',
  stock:'', brand:'Race District',
  shortDescription:'', description:'',
  sizes:'', features:'',
  isFeatured:false, isNewArrival:false, isActive:true, images:[]
};

export function AdminProducts() {
  const { addToast } = useToast();
  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [showForm, setShowForm]           = useState(false);
  const [editProduct, setEditProduct]     = useState(null);
  const [form, setForm]                   = useState(EMPTY_PRODUCT);
  const [saving, setSaving]               = useState(false);
  const [formError, setFormError]         = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError]                 = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = {limit:100};
      if (search.trim()) params.search = search.trim();
      const res = await adminAPI.getProducts(params);
      setProducts(res.data.products||res.data||[]);
    } catch(e) { setError(e.message||'Failed to load products'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(EMPTY_PRODUCT); setEditProduct(null); setFormError(''); setShowForm(true); };
  const openEdit = (p) => {
    setForm({
      name:p.name||'', sku:p.sku||'',
      price:p.price||'', comparePrice:p.comparePrice||'', cost:p.cost||'',
      stock:p.stock!=null?p.stock:'', brand:p.brand||'Race District',
      shortDescription:p.shortDescription||'', description:p.description||'',
      sizes:Array.isArray(p.sizes)?p.sizes.join(', '):(p.sizes||''),
      features:Array.isArray(p.features)?p.features.join('\n'):(p.features||''),
      isFeatured:p.isFeatured||false, isNewArrival:p.isNewArrival||false,
      isActive:p.isActive!==false, images:p.images||[]
    });
    setEditProduct(p); setFormError(''); setShowForm(true);
  };

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleImageUpload = async (files) => {
    if (!files.length) return;
    const remaining = 4-form.images.length;
    if (remaining<=0) { addToast('Maximum 4 images allowed','error'); return; }
    setUploadingImages(true);
    const uploadedUrls = [];
    try {
      for (let file of files.slice(0,remaining)) {
        const fd = new FormData(); fd.append('image',file);
        const res = await adminAPI.uploadImage(fd);
        uploadedUrls.push({url:res.data.url,alt:file.name||'',isPrimary:form.images.length===0&&uploadedUrls.length===0});
      }
      setForm(f=>({...f,images:[...f.images,...uploadedUrls]}));
      addToast(`${uploadedUrls.length} image(s) uploaded successfully`);
    } catch { addToast('Failed to upload images','error'); }
    finally { setUploadingImages(false); }
  };

  const removeImage     = i => setForm(f=>({...f,images:f.images.filter((_,idx)=>idx!==i)}));
  const setPrimaryImage = i => setForm(f=>({...f,images:f.images.map((img,idx)=>({...img,isPrimary:idx===i}))}));

  const handleSave = async () => {
    if (!form.name.trim())              { setFormError('Product name is required'); return; }
    if (!form.price||isNaN(form.price)) { setFormError('Valid price is required'); return; }
    if (form.images.length<1)           { setFormError('At least 1 image is required'); return; }
    if (form.images.length>4)           { setFormError('Maximum 4 images allowed'); return; }
    setSaving(true); setFormError('');
    try {
      const payload = {
        name:form.name.trim(), price:parseFloat(form.price),
        comparePrice:form.comparePrice?parseFloat(form.comparePrice):undefined,
        cost:form.cost?parseFloat(form.cost):undefined,
        stock:form.stock!==''&&form.stock!=null?parseInt(form.stock):undefined,
        brand:form.brand||'Race District',
        shortDescription:form.shortDescription.trim(),
        description:form.description.trim()||form.shortDescription.trim()||form.name.trim(),
        sizes:form.sizes?form.sizes.split(',').map(s=>s.trim()).filter(Boolean):[],
        features:form.features?form.features.split('\n').map(s=>s.trim()).filter(Boolean):[],
        isFeatured:form.isFeatured, isNewArrival:form.isNewArrival, isActive:form.isActive,
        images:form.images
      };
      if (form.sku.trim()) payload.sku = form.sku.trim();
      if (editProduct) { await adminAPI.updateProduct(editProduct._id,payload); }
      else             { await adminAPI.createProduct(payload); }
      setShowForm(false); setEditProduct(null); load();
      addToast(editProduct?'Product updated successfully':'Product created successfully');
    } catch(e) { setFormError(e.message||'Save failed. Check all fields and try again.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (p) => {
    try { await adminAPI.deleteProduct(p._id); setDeleteConfirm(null); load(); addToast('Product deactivated'); }
    catch(e) { alert(e.message||'Delete failed'); }
  };
  const handleRestore = async (p) => {
    try { await adminAPI.restoreProduct(p._id); load(); addToast('Product restored'); }
    catch(e) { alert(e.message||'Restore failed'); }
  };

  return (
    <AdminLayout title="PRODUCT MANAGEMENT">
      <LowStockAlerts products={products}/>

      {/* Toolbar */}
      <div className="ap-products-toolbar" style={{marginBottom:'1.25rem'}}>
        <div style={{display:'flex',gap:'0.625rem',alignItems:'center',flex:1,minWidth:0}}>
          <input style={{...inputStyle,minWidth:0}} placeholder="Search products..." value={search}
            onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()}/>
          <ThemeChanger/>
        </div>
        <button onClick={openAdd} className="ap-add-btn"
          style={{padding:'0.625rem 1.25rem',background:'#0066FF',border:'2px solid #0066FF',color:'white',fontWeight:700,cursor:'pointer',fontFamily:'Orbitron,sans-serif',borderRadius:'0.5rem',fontSize:'0.75rem',letterSpacing:'0.06em',whiteSpace:'nowrap',minHeight:'unset'}}>
          + ADD PRODUCT
        </button>
      </div>

      {error && <div style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'0.75rem',padding:'0.875rem 1rem',marginBottom:'0.875rem',color:'#F87171',fontSize:'0.875rem'}}>{error}</div>}

      <div style={{background:'var(--bg-card)',border:'1px solid var(--border-color)',borderRadius:'0.75rem',overflow:'hidden'}}>
        {loading ? (
          <div style={{padding:'4rem',textAlign:'center'}}><div className="spinner" style={{margin:'0 auto'}}/></div>
        ) : products.length===0 ? (
          <div style={{padding:'4rem 2rem',textAlign:'center',color:'var(--text-muted)'}}>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🏎️</div>
            <p>No products found. <button onClick={openAdd} className="btn-no-min" style={{background:'none',border:'none',color:'#0066FF',cursor:'pointer',fontFamily:'Inter,sans-serif',fontSize:'1rem',textDecoration:'underline',padding:0}}>Add your first product</button></p>
          </div>
        ) : (
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr><Th>Product</Th><Th>SKU</Th><Th>Price</Th><Th>Stock</Th><Th>Sales</Th><Th>Flags</Th><Th>Actions</Th></tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id} style={{opacity:p.isActive?1:0.55,transition:'all 0.15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(0,102,255,0.04)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>

                    <Td data-label="Product">
                      <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                        {p.images?.[0]?.url
                          ? <img src={p.images[0].url} alt={p.name} style={{width:42,height:42,borderRadius:'0.5rem',objectFit:'cover',flexShrink:0}}/>
                          : <div style={{width:42,height:42,borderRadius:'0.5rem',background:'rgba(0,102,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.25rem',flexShrink:0}}>📦</div>
                        }
                        <div style={{minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:'0.9rem',color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                          <div style={{fontSize:'0.72rem',color:'var(--text-muted)',marginTop:'0.1rem'}}>{p.brand}</div>
                          <div style={{fontSize:'0.8rem',marginTop:'0.2rem',display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
                            <span style={{fontWeight:700,color:'var(--text-primary)'}}>${p.price}</span>
                            {p.stock!=null&&<span style={{color:p.stock===0?'#EF4444':p.stock<=(p.lowStockThreshold||5)?'#FBBF24':'#34D399',fontWeight:600}}>{p.stock===0?'Out of stock':`${p.stock} in stock`}</span>}
                          </div>
                        </div>
                      </div>
                    </Td>

                    <Td data-label="SKU" className="ap-col-hide"><span style={{fontFamily:'monospace',fontSize:'0.78rem',color:'var(--text-secondary)'}}>{p.sku}</span></Td>
                    <Td data-label="Price" className="ap-col-hide">
                      <span className="font-orbitron" style={{fontWeight:700,color:'var(--text-primary)'}}>${p.price}</span>
                      {p.comparePrice>p.price&&<span style={{color:'var(--text-muted)',fontSize:'0.75rem',textDecoration:'line-through',marginLeft:'0.4rem'}}>${p.comparePrice}</span>}
                    </Td>
                    <Td data-label="Stock" className="ap-col-hide">
                      {p.stock==null?<span style={{color:'var(--text-muted)',fontSize:'0.78rem'}}>—</span>
                        :<span style={{fontWeight:700,color:p.stock===0?'#EF4444':p.stock<=(p.lowStockThreshold||5)?'#FBBF24':'#34D399'}}>{p.stock}</span>}
                    </Td>
                    <Td data-label="Sales" className="ap-col-hide" style={{color:'var(--text-secondary)',fontSize:'0.875rem'}}>{p.sales||0}</Td>
                    <Td data-label="Flags">
                      <div style={{display:'flex',flexWrap:'wrap',gap:'0.25rem'}}>
                        {p.isFeatured&&<span style={{fontSize:'0.62rem',padding:'0.2rem 0.5rem',background:'rgba(52,211,153,0.15)',color:'#34D399',borderRadius:'0.25rem',whiteSpace:'nowrap'}}>⭐ Featured</span>}
                        {p.isNewArrival&&<span style={{fontSize:'0.62rem',padding:'0.2rem 0.5rem',background:'rgba(0,102,255,0.15)',color:'#60A5FA',borderRadius:'0.25rem',whiteSpace:'nowrap'}}>🆕 New</span>}
                        {!p.isActive&&<span style={{fontSize:'0.62rem',padding:'0.2rem 0.5rem',background:'rgba(239,68,68,0.15)',color:'#F87171',borderRadius:'0.25rem',whiteSpace:'nowrap'}}>Inactive</span>}
                      </div>
                    </Td>
                    <Td data-label=" ">
                      <div className="ap-product-actions">
                        <button onClick={()=>openEdit(p)} className="btn-no-min"
                          style={{padding:'0.4rem 0.875rem',background:'transparent',border:'1px solid rgba(0,102,255,0.3)',color:'#60A5FA',cursor:'pointer',borderRadius:'0.5rem',fontFamily:'Inter,sans-serif',fontSize:'0.8rem',fontWeight:600}}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(0,102,255,0.1)'}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>✏️ Edit</button>
                        {p.isActive?(
                          <button onClick={()=>setDeleteConfirm(p)} className="btn-no-min"
                            style={{padding:'0.4rem 0.75rem',background:'transparent',border:'1px solid rgba(239,68,68,0.3)',color:'#F87171',cursor:'pointer',borderRadius:'0.5rem',fontFamily:'Inter,sans-serif',fontSize:'0.8rem',fontWeight:600}}
                            onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.08)'}
                            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>🗑️</button>
                        ):(
                          <button onClick={()=>handleRestore(p)} className="btn-no-min"
                            style={{padding:'0.4rem 0.75rem',background:'transparent',border:'1px solid rgba(52,211,153,0.3)',color:'#34D399',cursor:'pointer',borderRadius:'0.5rem',fontFamily:'Inter,sans-serif',fontSize:'0.8rem',fontWeight:600}}>✅</button>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{padding:'0.875rem 1rem',borderTop:'1px solid var(--border-color)',color:'var(--text-muted)',fontSize:'0.8rem'}}>
          {products.length} product{products.length!==1?'s':''} shown
        </div>
      </div>

      {showForm && (
        <Modal title={editProduct?`EDIT — ${editProduct.name}`:'ADD NEW PRODUCT'} onClose={()=>{setShowForm(false);setEditProduct(null);}} wide>
          {formError&&<div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'0.5rem',padding:'0.75rem 1rem',marginBottom:'1rem',color:'#F87171',fontSize:'0.875rem'}}>⚠️ {formError}</div>}
          <div className="ap-product-form-grid">
            <div style={{gridColumn:'1/-1'}}><FL label="Product Name *"><input style={inputStyle} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Velocity Pro Jacket"/></FL></div>
            <FL label="SKU (auto if blank)"><input style={inputStyle} value={form.sku} onChange={e=>set('sku',e.target.value)} placeholder="e.g. RD-VPJ-001"/></FL>
            <FL label="Price ($) *"><input style={inputStyle} type="number" inputMode="decimal" min="0" step="0.01" value={form.price} onChange={e=>set('price',e.target.value)} placeholder="299"/></FL>
            <FL label="Compare Price ($)"><input style={inputStyle} type="number" inputMode="decimal" min="0" step="0.01" value={form.comparePrice} onChange={e=>set('comparePrice',e.target.value)} placeholder="399"/></FL>
            <FL label="Cost Price ($)"><input style={inputStyle} type="number" inputMode="decimal" min="0" step="0.01" value={form.cost} onChange={e=>set('cost',e.target.value)} placeholder="95"/></FL>
            <FL label="Stock Quantity"><input style={inputStyle} type="number" inputMode="numeric" min="0" value={form.stock} onChange={e=>set('stock',e.target.value)} placeholder="Leave blank to hide"/></FL>
            <FL label="Brand"><input style={inputStyle} value={form.brand} onChange={e=>set('brand',e.target.value)} placeholder="Race District"/></FL>
            <div style={{gridColumn:'1/-1'}}><FL label="Short Description"><input style={inputStyle} value={form.shortDescription} onChange={e=>set('shortDescription',e.target.value)} placeholder="One-line description shown on product cards"/></FL></div>
            <div style={{gridColumn:'1/-1'}}><FL label="Full Description"><textarea style={{...inputStyle,resize:'vertical'}} rows={3} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Detailed product description..."/></FL></div>
            <FL label="Sizes (comma separated)"><input style={inputStyle} value={form.sizes} onChange={e=>set('sizes',e.target.value)} placeholder="XS, S, M, L, XL, XXL"/></FL>
            <FL label="Features (one per line)"><textarea style={{...inputStyle,resize:'vertical'}} rows={3} value={form.features} onChange={e=>set('features',e.target.value)} placeholder={"Aerodynamic cut\nWaterproof 20,000mm"}/></FL>

            <div style={{gridColumn:'1/-1'}}>
              <FL label={`Product Images (min 1, max 4) — ${form.images.length}/4`}>
                {form.images.length<4&&(
                  <div style={{border:'2px dashed var(--border-color)',borderRadius:'0.75rem',padding:'1.5rem 1rem',textAlign:'center',background:'rgba(0,102,255,0.02)',cursor:'pointer',transition:'all 0.2s',marginBottom:'0.75rem'}}
                    onClick={()=>fileInputRef.current?.click()}
                    onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor='#0066FF';e.currentTarget.style.background='rgba(0,102,255,0.08)';}}
                    onDragLeave={e=>{e.currentTarget.style.borderColor='var(--border-color)';e.currentTarget.style.background='rgba(0,102,255,0.02)';}}
                    onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor='var(--border-color)';e.currentTarget.style.background='rgba(0,102,255,0.02)';handleImageUpload(Array.from(e.dataTransfer.files));}}>
                    <input ref={fileInputRef} type="file" multiple accept="image/*" style={{display:'none'}} onChange={e=>handleImageUpload(Array.from(e.target.files))}/>
                    <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>📷</div>
                    <div style={{color:'var(--text-secondary)',fontSize:'0.875rem',fontWeight:600}}>{uploadingImages?'Uploading...':'Tap to add images'}</div>
                    <div style={{color:'var(--text-muted)',fontSize:'0.75rem',marginTop:'0.25rem'}}>or drag & drop — JPG, PNG, WebP</div>
                  </div>
                )}
                {form.images.length>0&&(
                  <div className="ap-image-grid">
                    {form.images.map((img,idx)=>(
                      <div key={idx} style={{position:'relative',aspectRatio:'1',borderRadius:'0.5rem',overflow:'hidden',border:img.isPrimary?'2px solid #0066FF':'1px solid var(--border-color)'}}>
                        <img src={img.url} alt={img.alt||`Product ${idx+1}`} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        {img.isPrimary&&<div style={{position:'absolute',top:'0.25rem',left:'0.25rem',background:'#0066FF',color:'white',fontSize:'0.6rem',padding:'0.1rem 0.35rem',borderRadius:'0.2rem',fontWeight:700}}>PRIMARY</div>}
                        <div style={{position:'absolute',top:'0.25rem',right:'0.25rem',display:'flex',gap:'0.2rem'}}>
                          {!img.isPrimary&&<button onClick={e=>{e.stopPropagation();setPrimaryImage(idx);}} className="btn-no-min" style={{background:'rgba(0,0,0,0.7)',border:'none',color:'white',width:26,height:26,borderRadius:'0.25rem',cursor:'pointer',fontSize:'0.75rem'}}>★</button>}
                          <button onClick={e=>{e.stopPropagation();removeImage(idx);}} className="btn-no-min" style={{background:'rgba(239,68,68,0.85)',border:'none',color:'white',width:26,height:26,borderRadius:'0.25rem',cursor:'pointer',fontSize:'0.75rem'}}>×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {form.images.length===0&&<div style={{color:'#FBBF24',fontSize:'0.8rem',marginTop:'0.5rem',display:'flex',alignItems:'center',gap:'0.4rem'}}>⚠️ At least 1 image is required</div>}
              </FL>
            </div>

            <div className="ap-product-flags" style={{gridColumn:'1/-1',padding:'0.875rem',background:'var(--bg-secondary)',borderRadius:'0.75rem'}}>
              {[['isFeatured','⭐ Featured'],['isNewArrival','🆕 New Arrival'],['isActive','✅ Active']].map(([k,l])=>(
                <label key={k} style={{display:'flex',alignItems:'center',gap:'0.625rem',cursor:'pointer',userSelect:'none',padding:'0.25rem 0'}}>
                  <input type="checkbox" checked={!!form[k]} onChange={e=>set(k,e.target.checked)} style={{accentColor:'#0066FF',width:18,height:18}}/>
                  <span style={{fontSize:'0.9rem',color:'var(--text-secondary)',fontFamily:'Inter,sans-serif'}}>{l}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="ap-product-modal-actions" style={{marginTop:'1.25rem'}}>
            <button onClick={handleSave} disabled={saving}
              style={{flex:1,padding:'0.9rem',background:'#0066FF',border:'2px solid #0066FF',color:'white',fontWeight:700,cursor:'pointer',borderRadius:'0.5rem',fontFamily:'Orbitron,sans-serif',fontSize:'0.78rem',letterSpacing:'0.06em',opacity:saving?0.6:1,minHeight:'unset'}}>
              {saving?'SAVING...':(editProduct?'SAVE CHANGES':'CREATE PRODUCT')}
            </button>
            <button onClick={()=>{setShowForm(false);setEditProduct(null);}}
              style={{padding:'0.9rem 1.25rem',background:'transparent',border:'1px solid var(--border-color)',color:'var(--text-secondary)',cursor:'pointer',borderRadius:'0.5rem',fontFamily:'Inter,sans-serif',fontWeight:600,minHeight:'unset'}}>
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {deleteConfirm&&(
        <Modal title="CONFIRM DEACTIVATE" onClose={()=>setDeleteConfirm(null)}>
          <div style={{textAlign:'center',padding:'1rem 0'}}>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>📦</div>
            <p style={{color:'var(--text-secondary)',marginBottom:'0.5rem'}}>Deactivate <strong style={{color:'var(--text-primary)'}}>{deleteConfirm.name}</strong>?</p>
            <p style={{color:'var(--text-muted)',fontSize:'0.82rem',marginBottom:'1.5rem'}}>Hidden from store but not deleted. You can restore it later.</p>
            <div className="ap-delete-modal-actions">
              <button onClick={()=>handleDelete(deleteConfirm)}
                style={{flex:1,padding:'0.875rem',background:'#EF4444',border:'none',color:'white',fontWeight:700,cursor:'pointer',borderRadius:'0.5rem',fontFamily:'Orbitron,sans-serif',fontSize:'0.78rem',letterSpacing:'0.06em',minHeight:'unset'}}>
                DEACTIVATE
              </button>
              <button onClick={()=>setDeleteConfirm(null)}
                style={{flex:1,padding:'0.875rem',background:'transparent',border:'1px solid var(--border-color)',color:'var(--text-secondary)',cursor:'pointer',borderRadius:'0.5rem',fontFamily:'Inter,sans-serif',fontWeight:600,minHeight:'unset'}}>
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN USERS
// ══════════════════════════════════════════════════════════════════════════════
export function AdminUsers() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = {limit:100};
      if (search.trim()) params.search = search.trim();
      const res = await adminAPI.getUsers(params);
      setUsers(res.data.users||[]);
    } catch(e) { setError(e.message||'Failed to load users'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  return (
    <AdminLayout title="CUSTOMER MANAGEMENT">
      <div className="ap-users-toolbar" style={{marginBottom:'1.25rem'}}>
        <input style={inputStyle} placeholder="Search by name or email..." value={search}
          onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()}/>
        <button onClick={load} className="btn-no-min"
          style={{padding:'0.625rem 1rem',background:'rgba(0,102,255,0.15)',border:'1px solid rgba(0,102,255,0.3)',borderRadius:'0.5rem',color:'#60A5FA',cursor:'pointer',fontFamily:'Inter,sans-serif',fontSize:'0.875rem',fontWeight:600,flexShrink:0,whiteSpace:'nowrap'}}>
          Search
        </button>
      </div>

      {error&&<div style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'0.75rem',padding:'0.875rem 1rem',marginBottom:'0.875rem',color:'#F87171',fontSize:'0.875rem'}}>{error}</div>}

      <div style={{background:'var(--bg-card)',border:'1px solid var(--border-color)',borderRadius:'0.75rem',overflow:'hidden'}}>
        {loading?(
          <div style={{padding:'4rem',textAlign:'center'}}><div className="spinner" style={{margin:'0 auto'}}/></div>
        ):(
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr><Th>Customer</Th><Th>Auth</Th><Th>Role</Th><Th>Status</Th><Th>Joined</Th><Th>Last Login</Th></tr>
              </thead>
              <tbody>
                {users.length===0&&<tr><td colSpan={6} style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>No customers found</td></tr>}
                {users.map(u=>(
                  <tr key={u._id}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(0,102,255,0.04)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>

                    <Td data-label="Customer">
                      <div style={{display:'flex',alignItems:'center',gap:'0.625rem'}}>
                        <div style={{width:36,height:36,borderRadius:'50%',background:'#0066FF',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,flexShrink:0,overflow:'hidden',fontSize:'0.875rem',color:'white'}}>
                          {u.avatar?<img src={u.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:u.name?.[0]?.toUpperCase()||'?'}
                        </div>
                        <div style={{minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:'0.875rem',color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.name}</div>
                          <div style={{fontSize:'0.72rem',color:'var(--text-muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.email}</div>
                          <div style={{display:'flex',gap:'0.375rem',marginTop:'0.25rem',flexWrap:'wrap'}}>
                            <span style={{fontSize:'0.62rem',padding:'0.15rem 0.4rem',borderRadius:'0.25rem',background:u.role==='superadmin'?'rgba(192,132,252,0.15)':u.role==='admin'?'rgba(147,197,253,0.15)':'rgba(0,102,255,0.15)',color:u.role==='superadmin'?'#C084FC':u.role==='admin'?'#93C5FD':'#60A5FA'}}>{u.role}</span>
                            <span style={{fontSize:'0.62rem',padding:'0.15rem 0.4rem',borderRadius:'0.25rem',background:u.isActive?'rgba(52,211,153,0.15)':'rgba(239,68,68,0.15)',color:u.isActive?'#34D399':'#F87171'}}>{u.isActive?'Active':'Inactive'}</span>
                          </div>
                        </div>
                      </div>
                    </Td>

                    <Td data-label="Auth" className="ap-col-hide"><span style={{fontSize:'0.68rem',padding:'0.2rem 0.5rem',background:'rgba(52,211,153,0.15)',color:'#34D399',borderRadius:'0.25rem'}}>{u.authProvider||'email'}</span></Td>
                    <Td data-label="Role" className="ap-col-hide"><span style={{fontSize:'0.68rem',padding:'0.2rem 0.5rem',borderRadius:'0.25rem',background:u.role==='superadmin'?'rgba(192,132,252,0.15)':u.role==='admin'?'rgba(147,197,253,0.15)':'rgba(0,102,255,0.15)',color:u.role==='superadmin'?'#C084FC':u.role==='admin'?'#93C5FD':'#60A5FA'}}>{u.role}</span></Td>
                    <Td data-label="Status" className="ap-col-hide"><span style={{fontSize:'0.68rem',padding:'0.2rem 0.5rem',borderRadius:'0.25rem',background:u.isActive?'rgba(52,211,153,0.15)':'rgba(239,68,68,0.15)',color:u.isActive?'#34D399':'#F87171'}}>{u.isActive?'Active':'Inactive'}</span></Td>
                    <Td data-label="Joined" className="ap-col-hide" style={{color:'var(--text-muted)',fontSize:'0.8rem',whiteSpace:'nowrap'}}>{new Date(u.createdAt).toLocaleDateString()}</Td>
                    <Td data-label="Last Login" className="ap-col-hide" style={{color:'var(--text-muted)',fontSize:'0.8rem',whiteSpace:'nowrap'}}>{u.lastLogin?new Date(u.lastLogin).toLocaleDateString():'Never'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{padding:'0.875rem 1rem',borderTop:'1px solid var(--border-color)',color:'var(--text-muted)',fontSize:'0.8rem'}}>
          {users.length} customer{users.length!==1?'s':''} found
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminOrders;
