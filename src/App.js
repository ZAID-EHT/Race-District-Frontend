import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';

import Header from './components/common/Header';
import Footer from './components/common/Footer';
import CartDrawer from './components/cart/CartDrawer';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import About from './pages/About';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Account from './pages/Account';
import TrackOrder from './pages/TrackOrder';
import ComingSoon from './pages/ComingSoon';
import AdminDashboard from './pages/admin/Dashboard';
import { AdminOrders, AdminProducts } from './pages/admin/AdminPages';
import AdminCustomers from './pages/admin/Customers';
import ScrollToTop from './components/common/ScrollToTop';

import './styles/globals.css';

/* Custom cursor */
function CustomCursor() {
  const cursorRef = React.useRef(null);
  const followerRef = React.useRef(null);

  // ── ADDED: swap border colour when light-mode class toggles on <body> ──
  const applyColor = () => {
    const color = document.body.classList.contains('light-mode') ? '#0d2a8a' : '#0066FF';
    if (cursorRef.current)   cursorRef.current.style.borderColor   = color;
    if (followerRef.current) followerRef.current.style.borderColor = color;
  };

  useEffect(() => {
    const observer = new MutationObserver(applyColor);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    applyColor(); // set correct colour on first render
    return () => observer.disconnect();
  }, []);
  // ── END ADDED ──

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

/*
  StoreLayout — owns cartOpen state and renders CartDrawer alongside Header.
  NO more cloneElement. CartDrawer also listens to the 'rd:open-cart' window
  event, so both the desktop button (Header) and mobile button fire the same
  event and the drawer always opens correctly.
*/
function StoreLayout({ children }) {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <Header cartOpen={cartOpen} setCartOpen={setCartOpen} />
      {/* CartDrawer lives here — same level as Header, shares state */}
      <CartDrawer cartOpen={cartOpen} setCartOpen={setCartOpen} />
      {children}
      <Footer />
    </>
  );
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Store pages */}
        <Route path="/" element={<StoreLayout><Home /></StoreLayout>} />
        <Route path="/shop" element={<StoreLayout><Products /></StoreLayout>} />
        <Route path="/products" element={<StoreLayout><Products /></StoreLayout>} />

        {/* ✅ FIX: Product detail route — matches /products/:id links in ProductCard & Home */}
        <Route path="/products/:id" element={<StoreLayout><ProductDetail /></StoreLayout>} />

        <Route path="/about" element={<StoreLayout><About /></StoreLayout>} />
        <Route path="/login" element={<Login />} />
        <Route path="/track-order" element={<StoreLayout><TrackOrder /></StoreLayout>} />
        <Route path="/coming-soon" element={<StoreLayout><ComingSoon /></StoreLayout>} />
        <Route path="/account" element={<ProtectedRoute><StoreLayout><Account /></StoreLayout></ProtectedRoute>} />
        <Route path="/account/:tab" element={<ProtectedRoute><StoreLayout><Account /></StoreLayout></ProtectedRoute>} />
        <Route path="/checkout" element={<StoreLayout><Checkout /></StoreLayout>} />

        {/* Admin pages */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
        <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminCustomers /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
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
          {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}
          <CustomCursor />
          <Router>
            <AppRoutes />
          </Router>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}