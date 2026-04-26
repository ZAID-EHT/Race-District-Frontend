import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    window.showToast(`${product.name} added to cart!`);
  };

  // Resolve image URL from either images array or legacy image field
  const imageUrl =
    product.images && product.images.length > 0
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
            onError={e => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="w-full h-full flex items-center justify-center text-6xl"
          style={{ display: imageUrl ? 'none' : 'flex' }}
        >
          {product.image || '📦'}
        </div>
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