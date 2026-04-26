import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';

import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail'; // ← make sure this page exists
import About from './pages/About';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Account from './pages/Account';
import TrackOrder from './pages/TrackOrder';
import ComingSoon from './pages/ComingSoon';
import AdminDashboard from './pages/admin/Dashboard';
import { AdminOrders, AdminProducts } from './pages/admin/AdminPages';
import AdminCustomers from './pages/admin/Customers';

import './styles/globals.css';

// ─── Cart UI Context ───────────────────────────────────────────────────────────
// Keeps cartOpen state in a context so Header and any page can access it
// without prop-drilling through StoreLayout/cloneElement.
const CartUIContext = createContext({ cartOpen: false, setCartOpen: () => {} });
export const useCartUI = () => useContext(CartUIContext);

function CartUIProvider({ children }) {
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <CartUIContext.Provider value={{ cartOpen, setCartOpen }}>
      {children}
    </CartUIContext.Provider>
  );
}

/* Custom cursor */
function CustomCursor() {
  const cursorRef = React.useRef(null);
  const followerRef = React.useRef(null);

  useEffect(() => {
    const move = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px';
        cursorRef.current.style.top = e.clientY + 'px';
      }
      if (followerRef.current) {
        setTimeout(() => {
          if (followerRef.current) {
            followerRef.current.style.left = e.clientX + 'px';
            followerRef.current.style.top = e.clientY + 'px';
          }
        }, 100);
      }
    };
    document.addEventListener('mousemove', move);
    return () => document.removeEventListener('mousemove', move);
  }, []);

  return (
    <>
      <div ref={cursorRef} className="rd-cursor" style={{ display: 'none' }} id="rd-cursor" />
      <div ref={followerRef} className="rd-cursor-follower" style={{ display: 'none' }} id="rd-cursor-follower" />
    </>
  );
}

/* Loading screen */
function LoadingScreen({ onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone(), 1500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="loader" id="loader">
      <div className="font-orbitron loader-text">RACE DISTRICT</div>
    </div>
  );
}

/* Guards */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}><div className="spinner" /></div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { isAdmin, loading, isAuthenticated } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}><div className="spinner" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

// ─── StoreLayout ──────────────────────────────────────────────────────────────
// No longer owns cartOpen state — reads it from CartUIContext instead.
// No more cloneElement hack needed.
function StoreLayout({ children }) {
  const { cartOpen, setCartOpen } = useCartUI();

  return (
    <>
      <Header cartOpen={cartOpen} setCartOpen={setCartOpen} />
      {children}
      <Footer />
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Store pages */}
      <Route path="/" element={<StoreLayout><Home /></StoreLayout>} />
      <Route path="/shop" element={<StoreLayout><Products /></StoreLayout>} />
      <Route path="/products" element={<StoreLayout><Products /></StoreLayout>} />

      {/* ↓ FIX: product detail routes so clicking a product doesn't 404 */}
      <Route path="/products/:id" element={<StoreLayout><ProductDetail /></StoreLayout>} />
      <Route path="/shop/:id" element={<StoreLayout><ProductDetail /></StoreLayout>} />

      <Route path="/about" element={<StoreLayout><About /></StoreLayout>} />
      <Route path="/login" element={<Login />} />
      <Route path="/track-order" element={<StoreLayout><TrackOrder /></StoreLayout>} />
      <Route path="/coming-soon" element={<StoreLayout><ComingSoon /></StoreLayout>} />
      <Route path="/account" element={<ProtectedRoute><StoreLayout><Account /></StoreLayout></ProtectedRoute>} />
      <Route path="/account/:tab" element={<ProtectedRoute><StoreLayout><Account /></StoreLayout></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><StoreLayout><Checkout /></StoreLayout></ProtectedRoute>} />

      {/* Admin pages */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
      <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminCustomers /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const cursor = document.getElementById('rd-cursor');
    const follower = document.getElementById('rd-cursor-follower');
    if (window.innerWidth >= 768) {
      if (cursor) cursor.style.display = 'block';
      if (follower) follower.style.display = 'block';
    }
  }, [loaded]);

  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          {/* ↓ FIX: CartUIProvider wraps the Router so Header & pages share cartOpen */}
          <CartUIProvider>
            {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}
            <CustomCursor />
            <Router>
              <AppRoutes />
            </Router>
          </CartUIProvider>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}