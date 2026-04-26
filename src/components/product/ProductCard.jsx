import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [imgError, setImgError] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    window.showToast(`${product.name} added to cart!`);
  };

  const imageUrl =
    !imgError && product.images && product.images.length > 0
      ? product.images[0].url
      : null;

  return (
    <Link to={`/products/${product._id || product.id}`} className="product-card bg-rd-card block">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden transition-transform duration-500"
        style={{ height: '20rem' }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.images[0]?.alt || product.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #1a2035, #0d1929)',
            flexDirection: 'column', gap: '0.5rem',
          }}>
            <svg width="48" height="48" fill="none" stroke="rgba(0,102,255,0.4)" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>NO IMAGE</span>
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-orbitron text-lg font-bold text-white group-hover:text-rd-blue transition-colors">
            {product.name}
          </h3>
          <span className="text-rd-blue font-bold">
            {product.price ? `LKR ${product.price.toLocaleString()}` : ''}
          </span>
        </div>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {product.shortDescription || product.description}
        </p>
        <button
          onClick={handleAddToCart}
          className="w-full py-2 border border-rd-blue/30 text-rd-blue hover:bg-rd-blue hover:text-white transition-all duration-300 font-medium rounded"
        >
          Add to Garage
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;