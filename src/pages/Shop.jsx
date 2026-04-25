import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import api from '../services/api';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
  }, [category]);

  const fetchProducts = async () => {
    try {
      const res = await api.get(`/products?category=${category}`);
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Products', icon: '🏎️' },
    { id: 'apparel', name: 'Apparel', icon: '👕' },
    { id: 'accessories', name: 'Accessories', icon: '🎒' },
    { id: 'tech', name: 'Tech', icon: '⌚' },
    { id: 'footwear', name: 'Footwear', icon: '👟' },
    { id: 'helmets', name: 'Helmets', icon: '🏁' },
    { id: 'gear', name: 'Gear', icon: '🧤' }
  ];

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="shop-page">
      <div className="shop-header">
        <h1>🏎️ Race District Shop</h1>
        <p>Premium racing gear & accessories</p>
      </div>

      <div className="category-filter">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={category === cat.id ? 'active' : ''}
            onClick={() => setCategory(cat.id)}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      <div className="products-grid">
        {products.map(product => (
          <div key={product._id} className="product-card">
            <Link to={`/product/${product.slug || product._id}`}>
              <div className="product-image">
                {product.emoji && <span className="emoji">{product.emoji}</span>}
                {product.images?.[0] && <img src={product.images[0]} alt={product.name} />}
              </div>
              <h3>{product.name}</h3>
              <p className="price">${product.price?.toFixed(2)}</p>
            </Link>
            <button 
              className="add-to-cart-btn"
              onClick={() => addToCart(product)}
              disabled={product.stock === 0}
            >
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Shop;