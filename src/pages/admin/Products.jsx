import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

const UPLOAD_URL = '/api/admin/upload';

function ImageUploader({ images = [], onChange }) {
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 4) {
      alert('Maximum 4 images allowed.');
      return;
    }
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch(UPLOAD_URL, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: formData
        });
        const data = await res.json();
        if (data.url) {
          uploaded.push({ url: data.url, alt: '', isPrimary: images.length === 0 && uploaded.length === 0 });
        }
      }
      onChange([...images, ...uploaded]);
    } catch (err) {
      alert('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    const updated = images.filter((_, i) => i !== index);
    // If removed was primary, make first one primary
    if (images[index]?.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const setPrimary = (index) => {
    onChange(images.map((img, i) => ({ ...img, isPrimary: i === index })));
  };

  return (
    <div className="form-group" style={{ gridColumn: '1/-1' }}>
      <label className="form-label">
        Product Images <span style={{ color: 'var(--rd-muted)', fontWeight: 400 }}>(min 2, max 4)</span>
      </label>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {images.map((img, i) => (
          <div key={i} style={{ position: 'relative', width: 90, height: 90, borderRadius: 8, overflow: 'hidden', border: img.isPrimary ? '2px solid var(--rd-blue)' : '1px solid var(--rd-border2)' }}>
            <img src={img.url} alt={img.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: 0, transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}
            >
              {!img.isPrimary && (
                <button onClick={() => setPrimary(i)} style={{ background: 'var(--rd-blue)', border: 'none', color: 'white', borderRadius: 4, padding: '2px 6px', fontSize: '0.65rem', cursor: 'pointer' }}>
                  Set Primary
                </button>
              )}
              <button onClick={() => removeImage(i)} style={{ background: 'rgba(255,30,60,0.85)', border: 'none', color: 'white', borderRadius: 4, padding: '2px 6px', fontSize: '0.65rem', cursor: 'pointer' }}>
                Remove
              </button>
            </div>
            {img.isPrimary && (
              <div style={{ position: 'absolute', top: 3, left: 3, background: 'var(--rd-blue)', color: 'white', fontSize: '0.55rem', padding: '1px 4px', borderRadius: 3, fontWeight: 700 }}>PRIMARY</div>
            )}
          </div>
        ))}

        {images.length < 4 && (
          <label style={{ width: 90, height: 90, border: '2px dashed var(--rd-border2)', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--rd-muted)', fontSize: '0.7rem', gap: 4 }}>
            <i className="fas fa-plus" style={{ fontSize: '1.25rem' }} />
            {uploading ? 'Uploading...' : 'Add Image'}
            <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFiles} disabled={uploading} />
          </label>
        )}
      </div>

      {images.length < 2 && (
        <p style={{ color: 'var(--rd-yellow)', fontSize: '0.75rem', margin: 0 }}>
          ⚠ Please upload at least 2 images before saving.
        </p>
      )}
    </div>
  );
}

export function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editProduct, setEditProduct] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getProducts({ limit: 50, search });
      setProducts(res.data.products || res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openEdit = (product) => { setEditProduct(product); setForm(product); setShowAdd(false); };
  const openAdd = () => {
    setEditProduct(null);
    setForm({ images: [], stock: 0, price: 0, category: 'frames', brand: 'Race District', isFeatured: false, isActive: true });
    setShowAdd(true);
  };

  const handleSave = async () => {
    if (!form.images || form.images.length < 2) {
      alert('Please upload at least 2 images.');
      return;
    }
    setSaving(true);
    try {
      if (editProduct) { await adminAPI.updateProduct(editProduct._id, form); }
      else { await adminAPI.createProduct(form); }
      setEditProduct(null); setShowAdd(false); fetchProducts();
    } catch (e) { alert(e.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    await adminAPI.deleteProduct(id);
    fetchProducts();
  };

  const F = ({ label, field, type = 'text' }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {type === 'checkbox'
        ? <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.checked }))} style={{ accentColor: 'var(--rd-blue)' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--rd-muted2)' }}>Yes</span>
          </label>
        : <input className="form-input" type={type} value={form[field] || ''} onChange={e => setForm(f => ({ ...f, [field]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))} />
      }
    </div>
  );

  return (
    <AdminLayout title="PRODUCT MANAGEMENT">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center' }}>
        <input className="form-input" style={{ width: '240px', padding: '0.5rem 0.875rem', fontSize: '0.875rem' }} placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={openAdd} className="btn btn-primary btn-sm"><i className="fas fa-plus" style={{ marginRight: '0.4rem' }} />Add Product</button>
      </div>

      <div style={{ background: 'var(--rd-card)', border: '1px solid var(--rd-border2)', borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div> : (
          <table className="rd-table">
            <thead><tr><th>Product</th><th>SKU</th><th>Price</th><th>Stock</th><th>Sales</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {products.map(p => {
                const thumb = p.images?.find(i => i.isPrimary) || p.images?.[0];
                return (
                  <tr key={p._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        {thumb ? (
                          <img src={thumb.url} alt={p.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--rd-border2)', flexShrink: 0 }} />
                        )}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--rd-muted)' }}>{p.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--rd-muted2)' }}>{p.sku}</span></td>
                    <td><span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>${p.price}</span>{p.comparePrice > p.price && <span style={{ color: 'var(--rd-muted)', fontSize: '0.75rem', textDecoration: 'line-through', marginLeft: '0.35rem' }}>${p.comparePrice}</span>}</td>
                    <td><span style={{ fontWeight: 700, color: p.stock === 0 ? 'var(--rd-red)' : p.stock <= 5 ? 'var(--rd-yellow)' : 'var(--rd-green)' }}>{p.stock}</span></td>
                    <td style={{ color: 'var(--rd-muted2)', fontSize: '0.875rem' }}>{p.sales}</td>
                    <td>
                      {p.isFeatured && <span className="badge badge-confirmed" style={{ marginRight: '0.35rem', fontSize: '0.65rem' }}>Featured</span>}
                      <span className={`badge ${p.isActive ? 'badge-delivered' : 'badge-cancelled'}`} style={{ fontSize: '0.65rem' }}>{p.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => openEdit(p)} className="btn btn-outline btn-sm"><i className="fas fa-pen" /></button>
                        <button onClick={() => handleDelete(p._id)} className="btn btn-sm" style={{ background: 'rgba(255,30,60,0.08)', color: 'var(--rd-red)', border: '1px solid rgba(255,30,60,0.2)' }}><i className="fas fa-ban" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {(editProduct || showAdd) && (
        <div className="modal-overlay" onClick={() => { setEditProduct(null); setShowAdd(false); }}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', letterSpacing: '0.08em' }}>{editProduct ? 'EDIT PRODUCT' : 'ADD PRODUCT'}</h3>
              <button onClick={() => { setEditProduct(null); setShowAdd(false); }} style={{ background: 'none', border: 'none', color: 'var(--rd-muted)', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
              <ImageUploader
                images={form.images || []}
                onChange={imgs => setForm(f => ({ ...f, images: imgs }))}
              />
              <div style={{ gridColumn: '1/-1' }}><F label="Product Name" field="name" /></div>
              <F label="SKU" field="sku" />
              <F label="Price ($)" field="price" type="number" />
              <F label="Compare Price ($)" field="comparePrice" type="number" />
              <F label="Cost ($)" field="cost" type="number" />
              <F label="Stock" field="stock" type="number" />
              <F label="Brand" field="brand" />
              <div style={{ gridColumn: '1/-1' }}><F label="Short Description" field="shortDescription" /></div>
              <div style={{ gridColumn: '1/-1' }}>
                <div className="form-group">
                  <label className="form-label">Full Description</label>
                  <textarea className="form-input" rows={3} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
                </div>
              </div>
              <F label="Featured" field="isFeatured" type="checkbox" />
              <F label="New Arrival" field="isNewArrival" type="checkbox" />
              <F label="Active" field="isActive" type="checkbox" />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>{saving ? 'Saving...' : 'Save Product'}</button>
              <button onClick={() => { setEditProduct(null); setShowAdd(false); }} className="btn btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ search, limit: 50 });
      setUsers(res.data.users || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return (
    <AdminLayout title="CUSTOMER MANAGEMENT">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
        <input className="form-input" style={{ width: '240px', padding: '0.5rem 0.875rem', fontSize: '0.875rem' }} placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={{ background: 'var(--rd-card)', border: '1px solid var(--rd-border2)', borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div> : (
          <table className="rd-table">
            <thead><tr><th>Customer</th><th>Auth</th><th>Role</th><th>Status</th><th>Joined</th><th>Last Login</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      {u.avatar ? <img src={u.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} /> : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--rd-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>{u.name?.[0]}</div>}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--rd-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-confirmed" style={{ fontSize: '0.7rem' }}>{u.authProvider}</span></td>
                  <td><span className={`badge ${u.role === 'superadmin' ? 'badge-out_for_delivery' : u.role === 'admin' ? 'badge-shipped' : 'badge-processing'}`} style={{ fontSize: '0.7rem' }}>{u.role}</span></td>
                  <td><span className={`badge ${u.isActive ? 'badge-delivered' : 'badge-cancelled'}`} style={{ fontSize: '0.7rem' }}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ color: 'var(--rd-muted)', fontSize: '0.8rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={{ color: 'var(--rd-muted)', fontSize: '0.8rem' }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminProducts;
