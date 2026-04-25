import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import CartItem from '../components/cart/CartItem';

const Cart = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const subtotal = getCartTotal();
  const shipping = subtotal > 150 ? 0 : 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (cart.length === 0) {
    return (
      <div className="pt-20 min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-4">
          {/* Back Button */}
          <div style={{ padding: '1rem 0 0.5rem 0' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: 'none', border: 'none',
                color: '#9CA3AF', cursor: 'pointer',
                fontSize: '0.9rem', padding: 0
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
              </svg>
              Back to Home
            </button>
          </div>

          <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
            <i className="fas fa-shopping-cart text-6xl text-gray-700 mb-6"></i>
            <h1 className="font-orbitron text-3xl font-bold mb-4">Your Garage is Empty</h1>
            <p className="text-gray-400 mb-8">Time to gear up for the track!</p>
            <Link to="/shop" className="magnetic-btn px-8 py-4 bg-rd-blue text-white font-bold rounded-lg inline-block">
              SHOP NOW
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

        {/* ── BACK BUTTON — right below navbar, above everything ── */}
        <div style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '1.25rem' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'none', border: 'none',
              color: '#9CA3AF', cursor: 'pointer',
              fontSize: '0.9rem', padding: 0,
              transition: 'color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Back to Home
          </button>
        </div>

        {/* ── PRODUCTS LIST — directly below back button ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map(item => (
              <CartItem key={item.id} item={item} />
            ))}

            <div className="flex gap-4 pt-4">
              <Link to="/shop" className="px-6 py-3 border border-gray-600 rounded-lg hover:border-white transition-colors">
                Continue Shopping
              </Link>
              <button
                onClick={clearCart}
                className="px-6 py-3 text-red-500 hover:text-red-400 transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>

          {/* ── ORDER SUMMARY ── */}
          <div className="bg-gray-900/50 border border-rd-blue/20 rounded-lg p-6 h-fit">
            <h3 className="font-orbitron text-xl font-bold mb-6">ORDER SUMMARY</h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              {shipping === 0 && (
                <div className="text-green-500 text-sm">
                  <i className="fas fa-check-circle mr-2"></i>
                  You qualified for free shipping!
                </div>
              )}
            </div>

            <div className="border-t border-gray-800 pt-4 mb-6">
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-rd-blue">${total.toFixed(2)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="block w-full magnetic-btn py-4 bg-rd-blue text-white font-bold rounded-lg text-center hover:bg-blue-600 transition-all"
            >
              PROCEED TO CHECKOUT
            </Link>

            <div className="mt-6 flex items-center justify-center gap-4 text-2xl text-gray-600">
              <i className="fab fa-cc-visa"></i>
              <i className="fab fa-cc-mastercard"></i>
              <i className="fab fa-cc-amex"></i>
              <i className="fab fa-apple-pay"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;