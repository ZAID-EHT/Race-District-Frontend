import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { productAPI } from '../services/api';

const decodeHtml = (str) => {
  if (!str) return '';
  return str.replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => { fetchProduct(); }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await productAPI.getById(id);
      setProduct(response.data);
      if (response.data?.sizes?.length) setSelectedSize(response.data.sizes[0]);
    } catch (error) {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    addToCart({ ...product, quantity, selectedSize });
    setAdded(true);
    addToast(`${product.name} added to cart!`);
    setTimeout(() => setAdded(false), 1500);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        <p className="font-orbitron" style={{ color: '#0066FF', letterSpacing: '0.2em' }}>LOADING...</p>
      </div>
    </div>
  );

  if (!product) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
      <p className="font-orbitron" style={{ color: 'var(--text-primary)', fontSize: '1.5rem' }}>PRODUCT NOT FOUND</p>
      <button onClick={() => navigate('/products')} style={{ padding: '0.75rem 2rem', background: '#0066FF', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
        BACK TO SHOP
      </button>
    </div>
  );

  const images = product.images && product.images.length > 0 ? product.images : [];
  const description = decodeHtml(product.description);
  const features = product.features?.map(f => decodeHtml(f)) || [];

  /* ── Shared Add-to-Cart Row (quantity + button) ── */
  const AddToCartRow = () => (
    <div style={{ display: 'flex', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(128,128,128,0.1)', border: '1px solid rgba(128,128,128,0.2)', borderRadius: '0.5rem', overflow: 'hidden' }}>
        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: '2.75rem', height: '3.25rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1.25rem' }}
          onMouseEnter={e => e.currentTarget.style.color = '#0066FF'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}>−</button>
        <span style={{ width: '2.5rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>{quantity}</span>
        <button onClick={() => setQuantity(quantity + 1)} style={{ width: '2.75rem', height: '3.25rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1.25rem' }}
          onMouseEnter={e => e.currentTarget.style.color = '#0066FF'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}>+</button>
      </div>
      <button onClick={handleAddToCart} style={{
        flex: 1, padding: '0 1.5rem', height: '3.25rem',
        background: added ? '#059669' : '#0066FF',
        border: `2px solid ${added ? '#059669' : '#0066FF'}`,
        color: 'white', fontWeight: 800, cursor: 'pointer', borderRadius: '0.5rem',
        fontSize: '0.875rem', letterSpacing: '0.1em', transition: 'all 0.3s', fontFamily: 'Inter, sans-serif'
      }}
        onMouseEnter={e => { if (!added) e.currentTarget.style.background = '#0052CC'; }}
        onMouseLeave={e => { if (!added) e.currentTarget.style.background = '#0066FF'; }}
      >
        {added ? '✓ ADDED TO CART' : `ADD TO CART — LKR ${((product.price || 0) * quantity).toLocaleString()}`}
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: '5rem', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: '90rem', margin: '0 auto', padding: '1.5rem 1.5rem 0' }}>
        <Link to="/products" style={{ color: '#6B7280', textDecoration: 'none', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#0066FF'}
          onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Products
        </Link>
      </div>

      <div style={{ maxWidth: '90rem', margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '4rem', alignItems: 'start' }}>

          {/* Images */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              position: 'relative', borderRadius: '1rem', overflow: 'hidden',
              background: 'linear-gradient(135deg, #1F2937, #111827)',
              border: '1px solid rgba(59,130,246,0.15)',
              maxHeight: '520px', height: '520px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ position: 'absolute', top: '30%', left: '30%', width: '40%', height: '40%', background: '#0066FF', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.08, pointerEvents: 'none' }} />
              {images.length > 0 ? (
                <img src={images[activeImage]?.url || images[0]?.url} alt={images[activeImage]?.alt || product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'opacity 0.3s' }}
                  onError={e => { e.target.style.display = 'none'; }} />
              ) : (
                <span style={{ fontSize: '8rem' }}>{product.emoji || '📦'}</span>
              )}
              {product.stock <= 5 && product.stock > 0 && (
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.4)', color: '#EAB308', padding: '0.35rem 0.75rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 700 }}>
                  Only {product.stock} left
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)} style={{
                    width: '5rem', height: '5rem', borderRadius: '0.5rem', overflow: 'hidden',
                    border: `2px solid ${activeImage === i ? '#0066FF' : 'rgba(255,255,255,0.1)'}`,
                    background: '#111827', cursor: 'pointer', padding: 0, transition: 'border-color 0.2s', flexShrink: 0
                  }}>
                    <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div>
              {product.brand && (
                <p style={{ color: '#0066FF', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  {product.brand}
                </p>
              )}
              <h1 className="font-orbitron" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, lineHeight: 1.1, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                {product.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ color: '#F59E0B', fontSize: '1.125rem' }}>
                  {'★'.repeat(Math.floor(product.rating || 0))}
                  <span style={{ color: '#374151' }}>{'★'.repeat(5 - Math.floor(product.rating || 0))}</span>
                </div>
                <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>({product.reviews || 0} reviews)</span>
              </div>
            </div>

            {/* Price */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span className="font-orbitron" style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0066FF' }}>
                  LKR {product.price?.toLocaleString()}
                </span>
              </div>
              {product.price && (
                <div className="koko-banner" style={{ marginTop: '8px' }}>
                  or pay in 3 x <b>LKR {(product.price / 3).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b> with{' '}
                  <a href="https://paykoko.com/customer-education" target="_blank" rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <img src="https://paykoko.com/img/logo1.7ff549c0.png" alt="Koko"
                      style={{ height: '26px', width: 'auto', position: 'relative', top: '1px' }} />
                  </a>
                  <a href="https://paykoko.com/customer-education" target="_blank" rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <img src="https://koko-merchant.oss-ap-southeast-1.aliyuncs.com/bnpl-site-cms-dev/koko-images/info.png"
                      alt="info" style={{ height: '14px', width: 'auto' }} />
                  </a>
                </div>
              )}
            </div>

            {/* ── MOBILE Add-to-Cart (right after price) ── */}
            <div className="mobile-atc-row" style={{ display: 'none' }}>
              <AddToCartRow />
            </div>

            <div style={{ height: '1px', background: 'linear-gradient(to right, rgba(59,130,246,0.3), transparent)' }} />

            <p className="pd-desc" style={{ lineHeight: 1.8, fontSize: '0.9375rem' }}>{description}</p>

            {features.length > 0 && (
              <div>
                <h3 className="pd-label" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Key Features</h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {features.map((feature, i) => (
                    <li key={i} className="pd-feature-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.875rem' }}>
                      <span style={{ color: '#0066FF', marginTop: '0.15rem', flexShrink: 0 }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div>
                <h3 className="pd-label" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  Size — <span style={{ color: '#0066FF' }}>{selectedSize}</span>
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {product.sizes.map(size => (
                    <button key={size} onClick={() => setSelectedSize(size)} style={{
                      width: '3rem', height: '3rem', borderRadius: '0.5rem',
                      border: `2px solid ${selectedSize === size ? '#0066FF' : 'rgba(255,255,255,0.1)'}`,
                      background: selectedSize === size ? 'rgba(0,102,255,0.15)' : 'transparent',
                      color: selectedSize === size ? '#0066FF' : '#9CA3AF',
                      fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.875rem'
                    }}>{size}</button>
                  ))}
                </div>
              </div>
            )}

            {/* ── DESKTOP Add-to-Cart (original position) ── */}
            <div className="desktop-atc-row">
              <AddToCartRow />
            </div>

          </div>
        </div>

      </div>

      {/* Mobile-only ATC styles + light mode text fixes */}
      <style>{`
        @media (max-width: 900px) {
          .mobile-atc-row { display: block !important; }
          .desktop-atc-row { display: none !important; }
        }
        @media (min-width: 901px) {
          .mobile-atc-row { display: none !important; }
          .desktop-atc-row { display: block !important; }
        }

        /* Dark mode defaults */
        .pd-desc { color: #9CA3AF; }
        .pd-label { color: #6B7280; }
        .pd-feature-item { color: #D1D5DB; }

        /* Light mode overrides — text must be dark and readable */
        .light-mode .pd-desc { color: #1e293b !important; }
        .light-mode .pd-label { color: #374151 !important; }
        .light-mode .pd-feature-item { color: #1e293b !important; }
        .light-mode .pd-reviews-text { color: #374151 !important; }

        @media (prefers-color-scheme: light) {
          .pd-desc { color: #1e293b; }
          .pd-label { color: #374151; }
          .pd-feature-item { color: #1e293b; }
        }
      `}</style>
    </div>
  );
};

export default ProductDetail;