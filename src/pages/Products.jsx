import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const [added, setAdded] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  const images = product.images && product.images.length > 0 ? product.images : [];

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    setAdded(true);
    addToast(`${product.name} added to cart!`);
    setTimeout(() => setAdded(false), 1000);
  };

  return (
    <Link
      to={`/product/${product._id || product.id}`}
      className="product-card"
      style={{ background: 'var(--bg-card)', display: 'block', textDecoration: 'none' }}
    >
      <div
        style={{ height: '20rem', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}
        onMouseEnter={() => images.length > 1 && setImgIndex(1)}
        onMouseLeave={() => setImgIndex(0)}
      >
        {images.length > 0 ? (
          <img
            src={images[imgIndex]?.url}
            alt={images[imgIndex]?.alt || product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={{ color: '#4B5563', fontSize: '0.875rem' }}>No image</div>
        )}
        {images.length > 1 && (
          <div style={{ position: 'absolute', bottom: '0.5rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.25rem' }}>
            {images.map((_, i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === imgIndex ? '#0066FF' : 'rgba(255,255,255,0.4)' }} />
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <h3 className="font-orbitron" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', flex: 1, marginRight: '0.5rem' }}>
            {product.name}
          </h3>
          <span style={{ color: '#0066FF', fontWeight: 700, fontSize: '1rem', whiteSpace: 'nowrap' }}>
            LKR {product.price?.toLocaleString()}
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {product.shortDescription || product.description}
        </p>
        <button
          onClick={handleAdd}
          style={{
            width: '100%', padding: '0.5rem',
            background: added ? '#059669' : 'transparent',
            border: added ? '2px solid #059669' : '1px solid rgba(59,130,246,0.3)',
            color: added ? 'white' : '#3B82F6',
            fontWeight: 700, borderRadius: '0.375rem', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', transition: 'all 0.3s', fontSize: '0.875rem'
          }}
          onMouseEnter={e => { if (!added) { e.currentTarget.style.background = '#2563EB'; e.currentTarget.style.color = 'white'; } }}
          onMouseLeave={e => { if (!added) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3B82F6'; } }}
        >
          {added ? 'Added! ✓' : 'Add to Garage'}
        </button>
      </div>
    </Link>
  );
}

export default function Products({ cartOpen, setCartOpen }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (searchQuery) params.search = searchQuery;
      const res = await productAPI.getAll(params);
      setProducts(res.data.products || res.data || []);
    } catch (err) {
      console.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadProducts();
  }, [loadProducts]);

  return (
    <div className="page-fade" style={{ paddingTop: '5rem', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '5rem 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 className="font-orbitron" style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            RACE <span style={{ color: '#0066FF' }}>COLLECTION</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '42rem', margin: '0 auto' }}>
            Premium F1-inspired frames engineered for performance.
          </p>
          {searchQuery && (
            <p style={{ color: '#0066FF', marginTop: '1rem' }}>
              Search results for: "{searchQuery}"
            </p>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="spinner" />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {products.map(p => <ProductCard key={p._id || p.id} product={p} />)}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <p>No products found.</p>
          </div>
        )}
      </div>
    </div>
  );
}