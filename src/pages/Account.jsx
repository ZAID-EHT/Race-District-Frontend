import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { orderAPI } from '../services/api';

const badge = {
  pending:'badge-pending', confirmed:'badge-confirmed', processing:'badge-processing',
  shipped:'badge-shipped', out_for_delivery:'badge-out_for_delivery',
  delivered:'badge-delivered', cancelled:'badge-cancelled', returned:'badge-returned'
};

function AddressForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(initial || { label:'Home',firstName:'',lastName:'',street:'',apartment:'',city:'',state:'',zip:'',country:'LK',phone:'',isDefault:false });
  const s = (k,v) => setF(x => ({...x,[k]:v}));
  return (
    <form onSubmit={e=>{e.preventDefault();onSave(f);}}
      style={{ background:'rgba(0,102,255,0.04)', border:'1px solid rgba(0,102,255,0.15)', borderRadius:'0.5rem', padding:'1.5rem', marginTop:'1rem' }}>
      <div className="address-form-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 1rem' }}>
        <div style={{gridColumn:'1/-1', marginBottom:'0.75rem'}}>
          <label style={{display:'block',fontSize:'0.75rem',color:'#9CA3AF',marginBottom:'0.35rem',textTransform:'uppercase',letterSpacing:'0.08em'}}>Label</label>
          <select className="form-input" value={f.label} onChange={e=>s('label',e.target.value)}>
            {['Home','Work','Other'].map(l=><option key={l} style={{background:'#111827'}}>{l}</option>)}
          </select>
        </div>
        {[['firstName','First Name'],['lastName','Last Name']].map(([k,l])=>(
          <div key={k} style={{marginBottom:'0.75rem'}}>
            <label style={{display:'block',fontSize:'0.75rem',color:'#9CA3AF',marginBottom:'0.35rem',textTransform:'uppercase',letterSpacing:'0.08em'}}>{l}</label>
            <input required className="form-input" value={f[k]} onChange={e=>s(k,e.target.value)} />
          </div>
        ))}
        <div style={{gridColumn:'1/-1',marginBottom:'0.75rem'}}>
          <label style={{display:'block',fontSize:'0.75rem',color:'#9CA3AF',marginBottom:'0.35rem',textTransform:'uppercase',letterSpacing:'0.08em'}}>Street Address</label>
          <input required className="form-input" value={f.street} onChange={e=>s('street',e.target.value)} placeholder="123 Main Street" />
        </div>
        {[['city','City'],['state','District'],['zip','Postal Code'],['phone','Phone']].map(([k,l])=>(
          <div key={k} style={{marginBottom:'0.75rem'}}>
            <label style={{display:'block',fontSize:'0.75rem',color:'#9CA3AF',marginBottom:'0.35rem',textTransform:'uppercase',letterSpacing:'0.08em'}}>{l}</label>
            <input required={k!=='phone'} className="form-input" value={f[k]} onChange={e=>s(k,e.target.value)} />
          </div>
        ))}
      </div>
      <label style={{display:'flex',alignItems:'center',gap:'0.5rem',cursor:'pointer',fontSize:'0.875rem',color:'#9CA3AF',marginBottom:'1rem'}}>
        <input type="checkbox" checked={f.isDefault} onChange={e=>s('isDefault',e.target.checked)} style={{accentColor:'#0066FF'}} />
        Set as default address
      </label>
      <div style={{display:'flex',gap:'0.75rem'}}>
        <button type="submit" style={{padding:'0.625rem 1.5rem',background:'#2563EB',border:'2px solid #2563EB',color:'white',fontWeight:700,cursor:'pointer',borderRadius:'0.375rem',fontSize:'0.875rem',fontFamily:'Inter,sans-serif'}}>Save</button>
        <button type="button" onClick={onCancel} style={{padding:'0.625rem 1.5rem',background:'transparent',border:'1px solid #374151',color:'#9CA3AF',fontWeight:700,cursor:'pointer',borderRadius:'0.375rem',fontSize:'0.875rem',fontFamily:'Inter,sans-serif'}}>Cancel</button>
      </div>
    </form>
  );
}

export default function Account() {
  const { tab: urlTab } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(urlTab || 'orders');
  const { user, updateProfile, addAddress, updateAddress, deleteAddress } = useAuth();
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editAddr, setEditAddr] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const loadOrders = () => {
    setOrdersLoading(true);
    orderAPI.getMyOrders()
      .then(r => setOrders(r.data.orders || r.data || []))
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'orders') loadOrders();
  }, [activeTab]);

  const switchTab = t => { setActiveTab(t); navigate(`/account/${t}`); };

  const handleCancelOrder = async (order) => {
    if (!window.confirm(`Cancel order ${order.orderNumber}? This cannot be undone.`)) return;
    setCancellingId(order._id);
    try {
      await orderAPI.cancelOrder(order._id);
      addToast('Order cancelled successfully');
      loadOrders();
    } catch (e) {
      addToast(e.message || 'Failed to cancel order', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const canCancel = (status) => ['pending', 'confirmed'].includes(status);

  const tabBtn = (id, label, icon) => (
    <button key={id} onClick={() => switchTab(id)}
      style={{
        display:'flex', alignItems:'center', gap:'0.5rem',
        padding:'0.625rem 0.875rem', borderRadius:'0.375rem',
        border:'none', cursor:'pointer', fontFamily:'Inter,sans-serif',
        fontSize:'0.875rem', fontWeight: activeTab===id ? 700 : 500,
        background: activeTab===id ? 'rgba(0,102,255,0.12)' : 'transparent',
        color: activeTab===id ? '#60A5FA' : '#9CA3AF',
        borderLeft: activeTab===id ? '2px solid #0066FF' : '2px solid transparent',
        transition:'all 0.15s', whiteSpace:'nowrap',
      }}>
      <span>{icon}</span> {label}
    </button>
  );

  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh', background: 'black' }}>
      <style>{`
        @media (max-width: 768px) {
          .account-layout { grid-template-columns: 1fr !important; gap: 0.75rem !important; padding: 1rem !important; }
          .account-sidebar { position: static !important; }
          .account-sidebar-inner { padding: 0.875rem !important; border-radius: 0.5rem !important; }
          .account-tab-nav { display: flex !important; flex-direction: row !important; overflow-x: auto !important; gap: 0.25rem !important; padding-bottom: 0.25rem !important; scrollbar-width: none !important; }
          .account-tab-nav::-webkit-scrollbar { display: none; }
          .account-tab-nav button { flex-shrink: 0 !important; padding: 0.5rem 0.75rem !important; font-size: 0.8rem !important; }
          .account-user-info { margin-bottom: 0.75rem !important; padding-bottom: 0.75rem !important; }
          .account-addresses-grid { grid-template-columns: 1fr !important; }
          .account-order-header { flex-direction: column !important; align-items: flex-start !important; gap: 0.35rem !important; }
          .account-order-footer { flex-direction: column !important; align-items: flex-start !important; gap: 0.5rem !important; }
          .account-order-footer button { width: 100% !important; }
          .account-add-header { flex-direction: column !important; align-items: flex-start !important; gap: 0.75rem !important; }
          .address-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="account-layout" style={{ maxWidth: '80rem', margin: '0 auto', padding: '2.5rem 1rem', display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2rem' }}>

        {/* Sidebar */}
        <aside className="account-sidebar">
          <div className="account-sidebar-inner" style={{ background: 'rgba(10,10,10,0.9)', border: '1px solid rgba(0,102,255,0.15)', borderRadius: '0.75rem', padding: '1.5rem' }}>
            <div className="account-user-info" style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem', paddingBottom:'1.25rem', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:'#0066FF', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'1.1rem', flexShrink:0, overflow:'hidden' }}>
                {user?.avatar ? <img src={user.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : user?.name?.[0]?.toUpperCase()}
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontWeight:700,fontSize:'0.875rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'white'}}>{user?.name}</div>
                <div style={{fontSize:'0.7rem',color:'#6B7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.email}</div>
              </div>
            </div>
            <nav className="account-tab-nav" style={{ display:'flex', flexDirection:'column', gap:'0.125rem' }}>
              {tabBtn('orders','My Orders','📦')}
              {tabBtn('addresses','Addresses','📍')}
              {tabBtn('wishlist','Wishlist','❤️')}
              {tabBtn('settings','Settings','⚙️')}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main>

          {/* ── ORDERS TAB ── */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="font-orbitron" style={{ fontSize:'1.5rem', fontWeight:700, marginBottom:'1.5rem', letterSpacing:'0.08em' }}>MY ORDERS</h2>
              {ordersLoading ? <div className="spinner"/> : orders.length===0 ? (
                <div style={{textAlign:'center',padding:'3rem',background:'rgba(10,10,10,0.9)',border:'1px solid rgba(0,102,255,0.1)',borderRadius:'0.75rem',color:'#6B7280'}}>
                  <div style={{fontSize:'3rem',marginBottom:'1rem'}}>📦</div>
                  <p>No orders yet. <Link to="/" style={{color:'#0066FF'}}>Start shopping!</Link></p>
                </div>
              ) : orders.map(order => (
                <div key={order._id} style={{background:'rgba(10,10,10,0.9)',border:'1px solid rgba(0,102,255,0.1)',borderRadius:'0.5rem',padding:'1.25rem',marginBottom:'0.875rem'}}>
                  <div className="account-order-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem',flexWrap:'wrap',gap:'0.5rem'}}>
                    <span className="font-orbitron" style={{color:'#0066FF',fontWeight:700,fontSize:'0.9rem'}}>{order.orderNumber}</span>
                    <div style={{display:'flex',alignItems:'center',gap:'0.75rem',flexWrap:'wrap'}}>
                      <span style={{color:'#6B7280',fontSize:'0.8rem'}}>{new Date(order.createdAt).toLocaleDateString()}</span>
                      <span className={`badge ${badge[order.status]||'badge-pending'}`}>{order.status?.replace(/_/g,' ')}</span>
                    </div>
                  </div>

                  <div style={{display:'flex',gap:'0.5rem',marginBottom:'0.75rem',flexWrap:'wrap'}}>
                    {order.items?.map((it,i)=>(
                      <span key={i} style={{fontSize:'0.8rem',color:'#9CA3AF',background:'rgba(255,255,255,0.04)',padding:'0.2rem 0.5rem',borderRadius:'0.25rem'}}>
                        {it.emoji} {it.name} ×{it.quantity}
                      </span>
                    ))}
                  </div>

                  <div className="account-order-footer" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'0.75rem',flexWrap:'wrap'}}>
                    <span className="font-orbitron" style={{fontWeight:700,color:'white'}}>LKR {order.total?.toLocaleString()}</span>
                    <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
                      <button onClick={()=>navigate(`/track-order?order=${order.orderNumber}`)}
                        style={{padding:'0.4rem 0.875rem',background:'transparent',border:'1px solid rgba(0,102,255,0.3)',color:'#0066FF',cursor:'pointer',borderRadius:'0.25rem',fontFamily:'Inter,sans-serif',fontSize:'0.8rem',fontWeight:600}}>
                        🚚 Track
                      </button>
                      {canCancel(order.status) && (
                        <button
                          onClick={() => handleCancelOrder(order)}
                          disabled={cancellingId === order._id}
                          style={{padding:'0.4rem 0.875rem',background:'transparent',border:'1px solid rgba(239,68,68,0.3)',color:'#EF4444',cursor:'pointer',borderRadius:'0.25rem',fontFamily:'Inter,sans-serif',fontSize:'0.8rem',fontWeight:600,opacity:cancellingId===order._id?0.5:1}}>
                          {cancellingId===order._id ? '...' : '✕ Cancel'}
                        </button>
                      )}
                    </div>
                  </div>

                  {order.adminNote && (
                    <div style={{marginTop:'0.75rem',padding:'0.5rem 0.75rem',background:'rgba(251,191,36,0.06)',borderRadius:'0.375rem',fontSize:'0.8rem',color:'#FBBF24'}}>
                      📝 Note: {order.adminNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── ADDRESSES TAB ── */}
          {activeTab === 'addresses' && (
            <div>
              <div className="account-add-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
                <h2 className="font-orbitron" style={{fontSize:'1.5rem',fontWeight:700,letterSpacing:'0.08em'}}>SAVED ADDRESSES</h2>
                <button onClick={()=>{setShowAdd(true);setEditAddr(null);}}
                  style={{padding:'0.5rem 1.25rem',background:'#2563EB',border:'2px solid #2563EB',color:'white',fontWeight:700,cursor:'pointer',borderRadius:'0.375rem',fontSize:'0.875rem',fontFamily:'Inter,sans-serif'}}>
                  + Add Address
                </button>
              </div>
              {showAdd && !editAddr && (
                <AddressForm
                  onSave={async f=>{try{await addAddress(f);addToast('Address saved!');setShowAdd(false);}catch(e){addToast(e.message,'error');}}}
                  onCancel={()=>setShowAdd(false)}
                />
              )}
              <div className="account-addresses-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginTop:'1rem'}}>
                {(user?.addresses||[]).map(addr=>(
                  <div key={addr._id} style={{background:'rgba(10,10,10,0.9)',border:`1px solid ${addr.isDefault?'rgba(0,102,255,0.3)':'rgba(0,102,255,0.1)'}`,borderRadius:'0.5rem',padding:'1.25rem',position:'relative'}}>
                    {addr.isDefault && (
                      <span style={{position:'absolute',top:'0.75rem',right:'0.75rem',background:'rgba(0,102,255,0.15)',color:'#60A5FA',fontSize:'0.65rem',fontWeight:700,padding:'0.15rem 0.5rem',borderRadius:'0.25rem',letterSpacing:'0.06em',fontFamily:'Orbitron,sans-serif'}}>DEFAULT</span>
                    )}
                    <div className="font-orbitron" style={{fontSize:'0.7rem',color:'#0066FF',marginBottom:'0.5rem',letterSpacing:'0.1em'}}>{addr.label?.toUpperCase()}</div>
                    <div style={{fontWeight:700,marginBottom:'0.25rem',color:'white'}}>{addr.firstName} {addr.lastName}</div>
                    <div style={{color:'#9CA3AF',fontSize:'0.875rem',lineHeight:1.6}}>
                      {addr.street}{addr.apartment&&`, ${addr.apartment}`}<br/>
                      {addr.city}, {addr.state} {addr.zip}<br/>
                      {addr.country}{addr.phone&&<><br/>{addr.phone}</>}
                    </div>
                    <div style={{display:'flex',gap:'0.5rem',marginTop:'1rem'}}>
                      <button onClick={()=>setEditAddr(addr)} style={{padding:'0.35rem 0.75rem',background:'transparent',border:'1px solid #374151',color:'#9CA3AF',cursor:'pointer',borderRadius:'0.25rem',fontFamily:'Inter,sans-serif',fontSize:'0.8rem'}}>Edit</button>
                      <button onClick={async()=>{if(!window.confirm('Delete this address?'))return;try{await deleteAddress(addr._id);addToast('Address removed.');}catch(e){addToast(e.message,'error');}}}
                        style={{padding:'0.35rem 0.75rem',background:'transparent',border:'1px solid rgba(239,68,68,0.3)',color:'#EF4444',cursor:'pointer',borderRadius:'0.25rem',fontFamily:'Inter,sans-serif',fontSize:'0.8rem'}}>Delete</button>
                    </div>
                    {editAddr?._id===addr._id && (
                      <AddressForm
                        initial={addr}
                        onSave={async f=>{try{await updateAddress(addr._id,f);addToast('Updated!');setEditAddr(null);}catch(e){addToast(e.message,'error');}}}
                        onCancel={()=>setEditAddr(null)}
                      />
                    )}
                  </div>
                ))}
                {(user?.addresses||[]).length===0&&!showAdd&&(
                  <div style={{gridColumn:'1/-1',textAlign:'center',padding:'3rem',background:'rgba(10,10,10,0.9)',border:'1px dashed rgba(0,102,255,0.2)',borderRadius:'0.5rem',color:'#6B7280'}}>
                    <div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>📍</div>
                    <p>No saved addresses yet. Add one to speed up checkout!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === 'settings' && (
            <div style={{maxWidth:'500px'}}>
              <h2 className="font-orbitron" style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem',letterSpacing:'0.08em'}}>SETTINGS</h2>
              <form
                onSubmit={async e=>{e.preventDefault();setSaving(true);try{await updateProfile(profileForm);addToast('Profile updated!');}catch(er){addToast(er.message,'error');}finally{setSaving(false);}}}
                style={{background:'rgba(10,10,10,0.9)',border:'1px solid rgba(0,102,255,0.15)',borderRadius:'0.75rem',padding:'2rem',marginBottom:'1rem'}}>
                <h3 className="font-orbitron" style={{fontSize:'0.85rem',letterSpacing:'0.1em',marginBottom:'1.25rem',color:'#9CA3AF'}}>PROFILE INFO</h3>
                {[['name','Full Name','text'],['phone','Phone Number','tel']].map(([k,l,t])=>(
                  <div key={k} style={{marginBottom:'1rem'}}>
                    <label style={{display:'block',fontSize:'0.75rem',color:'#9CA3AF',marginBottom:'0.35rem',textTransform:'uppercase',letterSpacing:'0.08em'}}>{l}</label>
                    <input className="form-input" type={t} value={profileForm[k]||''} onChange={e=>setProfileForm(f=>({...f,[k]:e.target.value}))} />
                  </div>
                ))}
                <div style={{marginBottom:'1.25rem'}}>
                  <label style={{display:'block',fontSize:'0.75rem',color:'#9CA3AF',marginBottom:'0.35rem',textTransform:'uppercase',letterSpacing:'0.08em'}}>Email (cannot change)</label>
                  <input className="form-input" value={user?.email||''} disabled style={{opacity:0.5,cursor:'not-allowed'}} />
                </div>
                <button type="submit" disabled={saving}
                  style={{padding:'0.625rem 1.5rem',background:'#2563EB',border:'2px solid #2563EB',color:'white',fontWeight:700,cursor:'pointer',borderRadius:'0.375rem',fontSize:'0.875rem',fontFamily:'Inter,sans-serif',opacity:saving?0.6:1}}>
                  {saving?'Saving...':'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* ── WISHLIST TAB ── */}
          {activeTab === 'wishlist' && (
            <div>
              <h2 className="font-orbitron" style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem',letterSpacing:'0.08em'}}>WISHLIST</h2>
              <div style={{textAlign:'center',padding:'3rem',background:'rgba(10,10,10,0.9)',border:'1px solid rgba(0,102,255,0.1)',borderRadius:'0.75rem',color:'#6B7280'}}>
                <div style={{fontSize:'3rem',marginBottom:'1rem',opacity:0.3}}>❤️</div>
                <p>Save products to your wishlist by clicking the heart on any product.</p>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}