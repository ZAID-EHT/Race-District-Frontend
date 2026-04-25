import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';

/*
  FIX: Import AdminLayout from AdminPages (which has the mobile hamburger sidebar).
  The old components/admin/AdminLayout had no hamburger — this fixes the mobile admin panel.
*/
import { AdminLayout, ThemeChanger } from './AdminPages';

// ── Helpers ───────────────────────────────────────────────────────────────────
const lkr = (val) =>
  `LKR ${Number(val || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const lkrShort = (val) => {
  const n = Number(val || 0);
  if (n >= 1_000_000) return `LKR ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `LKR ${(n / 1_000).toFixed(1)}K`;
  return `LKR ${n.toFixed(0)}`;
};

const pct = (val) => `${Number(val || 0) >= 0 ? '+' : ''}${Number(val || 0).toFixed(1)}%`;

const STATUS_COLORS = {
  pending: '#f59e0b', confirmed: '#3b82f6', processing: '#8b5cf6',
  packed: '#06b6d4', shipped: '#0ea5e9', out_for_delivery: '#f97316',
  delivered: '#10b981', cancelled: '#ef4444', returned: '#f43f5e'
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, accent = '#0066ff', trend, isLoss }) {
  const trendPositive = parseFloat(trend) >= 0;
  const accentColor = isLoss ? '#ef4444' : accent;
  return (
    <div
      style={{
        position: 'relative', background: 'var(--bg-card)',
        border: '1px solid var(--border-color)', borderTop: `2px solid ${accentColor}`,
        borderRadius: 16, padding: '1.4rem 1.5rem',
        display: 'flex', flexDirection: 'column', gap: '0.6rem',
        overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${accentColor}22`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ position: 'absolute', top: -30, right: -20, width: 100, height: 100, borderRadius: '50%', background: accentColor, opacity: 0.07, filter: 'blur(30px)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accentColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`fas ${icon}`} style={{ color: accentColor, fontSize: '0.9rem' }} />
        </div>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Orbitron, sans-serif', color: isLoss ? '#ef4444' : 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sub}</div>}
        {trend !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', fontWeight: 700, color: trendPositive ? '#10b981' : '#ef4444', background: trendPositive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
            <i className={`fas fa-arrow-${trendPositive ? 'up' : 'down'}`} style={{ fontSize: '0.6rem' }} />
            {pct(trend)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mini Bar Chart ────────────────────────────────────────────────────────────
function MiniBarChart({ data, valueKey = 'revenue', labelKey = '_id', color = '#0066ff' }) {
  if (!data?.length) return (
    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1.5rem 0', textAlign: 'center' }}>No chart data yet</div>
  );
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  const show = data.slice(-14);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 64 }}>
      {show.map((d, i) => {
        const h = ((d[valueKey] || 0) / max) * 100;
        const isLast = i === show.length - 1;
        return (
          <div key={i} title={`${d[labelKey]}: ${lkr(d[valueKey])}`}
            style={{ flex: 1, height: `${Math.max(h, 5)}%`, background: isLast ? color : `${color}55`, borderRadius: '3px 3px 0 0', cursor: 'default', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = color}
            onMouseLeave={e => e.currentTarget.style.background = isLast ? color : `${color}55`}
          />
        );
      })}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
      <div style={{ width: 3, height: 14, background: '#0066ff', borderRadius: 2, flexShrink: 0 }} />
      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>{children}</span>
    </div>
  );
}

function Panel({ children, style = {} }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.25rem 1.5rem', ...style }}>
      {children}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState('month');
  const [error, setError]     = useState('');

  const load = () => {
    setLoading(true);
    adminAPI.getStats()
      .then(res => { setStats(res.data); setError(''); })
      .catch(e => setError(e.message || 'Failed to load stats'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <AdminLayout title="DASHBOARD">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 16 }}>
        <div className="spinner" />
        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', letterSpacing: '0.14em' }}>LOADING RACE DATA...</div>
      </div>
    </AdminLayout>
  );

  if (error) return (
    <AdminLayout title="DASHBOARD">
      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '2rem', textAlign: 'center', color: '#F87171' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
        <p style={{ marginBottom: '1rem' }}>{error}</p>
        <button onClick={load} style={{ padding: '0.625rem 1.5rem', background: '#0066FF', border: 'none', color: 'white', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 700 }}>Retry</button>
      </div>
    </AdminLayout>
  );

  const ov  = stats?.overview               || {};
  const sm  = stats?.stockMetrics           || {};
  const os  = stats?.orderStatus            || {};
  const sc  = stats?.salesChart             || [];
  const top = stats?.topProducts            || [];
  const rpm = stats?.revenueByPaymentMethod || [];

  const periodRevenue = period === 'today' ? ov.todayRevenue : period === 'week' ? ov.weekRevenue : ov.monthRevenue;
  const periodLabel   = period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month';
  const totalProfit   = ov.totalProfit  || 0;
  const monthProfit   = ov.monthProfit  || 0;
  const isLoss        = ov.isLoss;
  const profitMargin  = ov.profitMargin || 0;
  const totalStatusOrders = Object.values(os.all || {}).reduce((a, b) => a + b, 0);

  return (
    <AdminLayout title="DASHBOARD">
      <style>{`
        @media (max-width: 768px) {
          .dash-stat-grid { grid-template-columns: 1fr 1fr !important; gap: 0.75rem !important; }
          .dash-row2 { grid-template-columns: 1fr !important; }
          .dash-row3 { grid-template-columns: 1fr !important; }
          .dash-growth-row { flex-direction: column !important; }
          .dash-growth-row > div { border-right: none !important; border-bottom: 1px solid var(--border-color); padding: 0.75rem 1rem !important; }
          .dash-growth-row > div:last-child { border-bottom: none; }
          .dash-period-row { flex-wrap: wrap !important; gap: 0.5rem !important; }
          .dash-sales-summary { gap: 1rem !important; flex-wrap: wrap !important; }
        }
      `}</style>

      {/* Stock alerts */}
      {sm.outOfStockProducts?.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderLeft: '3px solid #ef4444', borderRadius: 12, padding: '0.875rem 1.25rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <i className="fas fa-circle-xmark" style={{ color: '#ef4444' }} />
          <span style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.78rem' }}>OUT OF STOCK ({sm.outOfStockProducts.length})</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{sm.outOfStockProducts.map(p => p.name).join(', ')}</span>
          <Link to="/admin/products" style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#ef4444', fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(239,68,68,0.3)', padding: '3px 12px', borderRadius: 20 }}>Manage →</Link>
        </div>
      )}
      {sm.reorderAlerts?.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)', borderLeft: '3px solid #f59e0b', borderRadius: 12, padding: '0.875rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <i className="fas fa-triangle-exclamation" style={{ color: '#f59e0b' }} />
          <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.78rem' }}>LOW STOCK ({sm.reorderAlerts.length})</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{sm.reorderAlerts.map(p => `${p.name} (${p.stock} left)`).join(', ')}</span>
        </div>
      )}

      {/* Period + theme */}
      <div className="dash-period-row" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginRight: 4 }}>PERIOD</span>
        {['today', 'week', 'month'].map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{ padding: '0.35rem 1rem', borderRadius: 20, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'all 0.2s', border: period === p ? '1px solid #0066ff' : '1px solid var(--border-color)', background: period === p ? 'rgba(0,102,255,0.18)' : 'var(--bg-card)', color: period === p ? '#4d94ff' : 'var(--text-muted)' }}>{p}</button>
        ))}
        <div style={{ marginLeft: 'auto' }}><ThemeChanger /></div>
        <button onClick={load} title="Refresh stats" style={{ padding: '0.35rem 0.75rem', borderRadius: 20, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-muted)' }}>↻ Refresh</button>
      </div>

      {/* Stats row */}
      <div style={{ marginBottom: '1.75rem' }}>
        <SectionLabel>Revenue & Orders</SectionLabel>
        <div className="dash-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          <StatCard label={`Revenue — ${periodLabel}`} value={lkrShort(periodRevenue)} sub={`All-time: ${lkrShort(ov.totalRevenue)}`} icon="fa-coins" accent="#0066ff" trend={ov.revenueGrowth} />
          <StatCard label={isLoss ? 'Total Loss' : 'Total Profit'} value={lkrShort(Math.abs(totalProfit))} sub={`Margin: ${profitMargin}%`} icon={isLoss ? 'fa-arrow-trend-down' : 'fa-arrow-trend-up'} accent={isLoss ? '#ef4444' : '#10b981'} isLoss={isLoss} />
          <StatCard label="Month Profit" value={lkrShort(Math.abs(monthProfit))} sub={monthProfit < 0 ? 'Loss this month' : 'Profit this month'} icon="fa-chart-line" accent={monthProfit < 0 ? '#ef4444' : '#10b981'} isLoss={monthProfit < 0} />
          <StatCard label="Avg Order Value" value={lkrShort(ov.avgOrderValue || 0)} sub={`${ov.totalOrders || 0} total orders`} icon="fa-receipt" accent="#0066ff" />
          <StatCard label="Today's Orders" value={ov.todayOrders ?? 0} sub={`Month: ${ov.monthOrders ?? 0} orders`} icon="fa-box" accent="#f97316" />
          <StatCard label="Total Customers" value={ov.totalCustomers ?? 0} sub={`+${ov.newCustomersMonth ?? 0} this month`} icon="fa-users" accent="#8b5cf6" />
        </div>
      </div>

      {/* Charts row */}
      <div className="dash-row2" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <Panel>
          <SectionLabel>Sales — Last 30 Days</SectionLabel>
          <MiniBarChart data={sc} valueKey="revenue" labelKey="_id" color="#0066ff" />
          <div className="dash-sales-summary" style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '2.5rem' }}>
            {[
              { label: 'Revenue', val: lkrShort(sc.reduce((a,d)=>a+(d.revenue||0),0)), color: 'var(--text-primary)' },
              { label: 'Orders',  val: sc.reduce((a,d)=>a+(d.orders||0),0),            color: 'var(--text-primary)' },
              { label: 'Profit',  val: lkrShort(sc.reduce((a,d)=>a+(d.profit||0),0)),  color: '#10b981' },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: item.color }}>{item.val}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionLabel>Order Status Breakdown</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {Object.entries(os.all || {}).map(([status, count]) => {
              const pctVal = totalStatusOrders > 0 ? (count / totalStatusOrders * 100) : 0;
              const color = STATUS_COLORS[status] || '#0066ff';
              return (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <div style={{ width: 88, fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'capitalize', flexShrink: 0 }}>{status.replace(/_/g,' ')}</div>
                  <div style={{ flex: 1, height: 4, background: 'var(--border-color)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${pctVal}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', minWidth: 22, textAlign: 'right' }}>{count}</div>
                </div>
              );
            })}
            {Object.keys(os.all || {}).length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', padding: '0.5rem 0' }}>No order data yet</div>
            )}
          </div>
        </Panel>
      </div>

      {/* Payment + Top Products */}
      <div className="dash-row3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <Panel>
          <SectionLabel>Revenue by Payment Method</SectionLabel>
          {rpm.length === 0
            ? <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', padding: '0.5rem 0' }}>No payment data yet</div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[...rpm].sort((a,b)=>b.revenue-a.revenue).map(p => {
                  const totalRev = rpm.reduce((a,x)=>a+x.revenue,0);
                  const share = totalRev>0?(p.revenue/totalRev*100).toFixed(1):0;
                  return (
                    <div key={p._id} style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      <div style={{ width:68, fontSize:'0.68rem', color:'var(--text-muted)', textTransform:'capitalize', flexShrink:0 }}>{p._id||'other'}</div>
                      <div style={{ flex:1, height:4, background:'var(--border-color)', borderRadius:2, overflow:'hidden' }}>
                        <div style={{ width:`${share}%`, height:'100%', background:'linear-gradient(90deg,#0066ff,#4d94ff)', borderRadius:2 }} />
                      </div>
                      <div style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-primary)', minWidth:68, textAlign:'right' }}>{lkrShort(p.revenue)}</div>
                      <div style={{ fontSize:'0.62rem', color:'var(--text-muted)', minWidth:30, textAlign:'right' }}>{share}%</div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </Panel>

        <Panel>
          <SectionLabel>Top Products by Sales</SectionLabel>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
            {top.length===0&&<div style={{color:'var(--text-muted)',fontSize:'0.78rem'}}>No product data yet</div>}
            {top.map((p,i) => (
              <div key={p._id} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.5rem 0', borderBottom: i<top.length-1?'1px solid var(--border-color)':'none' }}>
                <div style={{ width:22, height:22, borderRadius:6, background: i===0?'rgba(0,102,255,0.25)':'var(--bg-card)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:900, color: i===0?'#4d94ff':'var(--text-muted)', flexShrink:0 }}>{i+1}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>{p.sales} sold · {lkrShort(p.revenue)}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Growth summary */}
      <Panel style={{ marginBottom: '1.75rem' }}>
        <SectionLabel>Sales Growth vs Previous Period</SectionLabel>
        <div className="dash-growth-row" style={{ display: 'flex', flexWrap: 'wrap' }}>
          {[
            { label:'This Month',    val: lkrShort(ov.monthRevenue),                                      color:'var(--text-primary)' },
            { label:'Last Month',    val: lkrShort(ov.lastMonthRevenue||0),                               color:'var(--text-secondary)' },
            { label:'Growth',        val: pct(ov.revenueGrowth), icon:`fa-arrow-${(ov.revenueGrowth||0)>=0?'up':'down'}`, color:(ov.revenueGrowth||0)>=0?'#10b981':'#ef4444' },
            { label:'Total Revenue', val: lkrShort(ov.totalRevenue),                                      color:'var(--text-primary)' },
            { label:'Total Profit',  val: `${isLoss?'−':'+'}${lkrShort(Math.abs(totalProfit))}`,         color: isLoss?'#ef4444':'#10b981' },
          ].map((item,i,arr) => (
            <div key={item.label} style={{ flex:'1 1 130px', padding:'0.5rem 1.5rem', borderRight: i<arr.length-1?'1px solid var(--border-color)':'none' }}>
              <div style={{ fontSize:'0.6rem', color:'var(--text-muted)', letterSpacing:'0.1em', marginBottom:8 }}>{item.label}</div>
              <div style={{ fontSize:'1.25rem', fontWeight:900, fontFamily:'Orbitron,sans-serif', color:item.color, display:'flex', alignItems:'center', gap:6 }}>
                {item.icon&&<i className={`fas ${item.icon}`} style={{fontSize:'0.85rem'}}/>}
                {item.val}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Recent Orders */}
      <Panel style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--border-color)' }}>
          <SectionLabel>Recent Orders</SectionLabel>
          <Link to="/admin/orders" style={{ fontSize:'0.7rem', color:'#4d94ff', textDecoration:'none', fontWeight:700, letterSpacing:'0.06em' }}>VIEW ALL →</Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.82rem' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border-color)' }}>
                {['Order','Customer','Items','Total','Status','Date'].map(h => (
                  <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', fontSize:'0.6rem', color:'var(--text-muted)', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'Orbitron,sans-serif' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(stats?.recentOrders || []).map(order => (
                <tr key={order._id} style={{ borderBottom:'1px solid var(--border-color)', transition:'background 0.15s', cursor:'default' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(0,102,255,0.04)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'0.75rem 1rem'}}>
                    <span style={{fontFamily:'Orbitron,sans-serif',color:'#4d94ff',fontSize:'0.78rem',fontWeight:700}}>{order.orderNumber}</span>
                  </td>
                  <td style={{padding:'0.75rem 1rem'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                      <div style={{width:28,height:28,borderRadius:'50%',background:'rgba(0,102,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.68rem',fontWeight:800,color:'#4d94ff',flexShrink:0}}>
                        {order.customer?.name?.[0]||'G'}
                      </div>
                      <div>
                        <div style={{fontWeight:600,color:'var(--text-primary)',fontSize:'0.82rem'}}>{order.customer?.name||'Guest'}</div>
                        <div style={{fontSize:'0.66rem',color:'var(--text-muted)'}}>{order.customer?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{padding:'0.75rem 1rem',color:'var(--text-secondary)',fontSize:'0.78rem'}}>{order.items?.length} item{order.items?.length!==1?'s':''}</td>
                  <td style={{padding:'0.75rem 1rem',fontWeight:800,color:'var(--text-primary)',fontSize:'0.82rem'}}>{lkr(order.total)}</td>
                  <td style={{padding:'0.75rem 1rem'}}>
                    <span style={{ fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.04em', padding:'3px 10px', borderRadius:20, textTransform:'capitalize', background:`${STATUS_COLORS[order.status]||'#0066ff'}1a`, color:STATUS_COLORS[order.status]||'#4d94ff', border:`1px solid ${STATUS_COLORS[order.status]||'#0066ff'}33` }}>
                      {order.status?.replace(/_/g,' ')}
                    </span>
                  </td>
                  <td style={{padding:'0.75rem 1rem',color:'var(--text-muted)',fontSize:'0.73rem'}}>{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {!stats?.recentOrders?.length && (
                <tr><td colSpan={6} style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </AdminLayout>
  );
}