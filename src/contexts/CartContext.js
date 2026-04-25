import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children, onCartOpen }) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('rd_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('rd_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity = 1, size = null, color = null) => {
    setCart(prev => {
      const key = `${product._id || product.id}-${size}-${color}`;
      const existing = prev.find(item => `${item._id || item.id}-${item.size}-${item.color}` === key);
      if (existing) {
        return prev.map(item =>
          `${item._id || item.id}-${item.size}-${item.color}` === key
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity, size, color, cartId: `${Date.now()}-${Math.random()}` }];
    });
    // Fire event so CartDrawer in App.js opens
    window.dispatchEvent(new Event('rd:open-cart'));
  };

  const removeFromCart = (cartId) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const updateQuantity = (cartId, quantity) => {
    if (quantity < 1) { removeFromCart(cartId); return; }
    setCart(prev => prev.map(item => item.cartId === cartId ? { ...item, quantity } : item));
  };

  const clearCart = () => setCart([]);

  const getTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const getCount = () => cart.reduce((sum, item) => sum + item.quantity, 0);
  const isInCart = (productId) => cart.some(item => (item._id || item.id) === productId);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart, removeFromCart, updateQuantity, clearCart,
      getTotal, getCount, isInCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};