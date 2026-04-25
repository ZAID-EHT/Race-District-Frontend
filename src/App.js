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

import './styles/globals.css';

function CustomCursor() {
  const cursorRef = React.useRef(null);
  const followerRef = React.useRef(null);
  useEffect(() => {
    const move = (e) => {
      if (cursorRef.current) { cursorRef.current.style.left = e.clientX + 'px'; cursorRef.current.style.top = e.clientY + 'px'; }
      if (followerRef.current) { setTimeout(() => { if (followerRef.current) { followerRef.current.style.left = e.clientX + 'px'; followerRef.current.style.top = e.clientY + 'px'; } }, 100); }
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

function LoadingScreen({ onDone }) {
  useEffect(() => { const t = setTimeout(() => onDone(), 1500); return () => clearTimeout(t); }, [onDone]);
  return <div className="loader" id="loader"><div className="font-orbitron loader-text">RACE DISTRICT</div></div>;
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div className="spinner" />
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { isAdmin, loading, isAuthenticated } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div className="spinner" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function StoreLayout({ children, cartOpen, setCartOpen }) {
  return (
    <>
      <Header cartOpen={cartOpen} setCartOpen={setCartOpen} />
      <CartDrawer cartOpen={cartOpen} setCartOpen={setCartOpen} />
      {React.cloneElement(children, { cartOpen, setCartOpen })}
      <Footer />
    </>
  );
}

function AppRoutes() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <Routes>
      <Route path="/"             element={<StoreLayout cartOpen={cartOpen} setCartOpen={setCartOpen}><Home /></StoreLayout>} />
      <Route path="/shop"         element={<StoreLayout cartOpen={cartOpen} setCartOpen={setCartOpen}><Products /></StoreLayout>} />
      <Route path="/products"     element={<StoreLayout cartOpen={cartOpen} setCartOpen={setCartOpen}><Products /></StoreLayout>} />
      <Route path="/product/:id"  element={<StoreLayout cartOpen={cartOpen} setCartOpen={setCartOpen}><ProductDetail /></StoreLayout>} />
      <Route path="/about"        element={<StoreLayout cartOpen={cartOpen} setCartOpen={setCartOpen}><About /></StoreLayout>} />
      <Route path="/track-order"  element={<StoreLayout cartOpen={cartOpen} setCartOpen={setCartOpen}><TrackOrder /></StoreLayout>} />
      <Route path="/coming-soon"  element={<StoreLayout cartOpen={cartOpen} setCartOpen={setCartOpen}><ComingSoon /></StoreLayout>} />
      <Route path="/login"        element={<Login />} />
      <Route path="/checkout"     element={<StoreLayout cartOpen={cartOpen} setCartOpen={setCartOpen}><Checkout /></StoreLayout>} />
      <Route path="/account"      element={<ProtectedRoute><StoreLayout cartOpen={cartOpen} setCartOpen={setCartOpen}><Account /></StoreLayout></ProtectedRoute>} />
      <Route path="/account/:tab" element={<ProtectedRoute><StoreLayout cartOpen={cartOpen} setCartOpen={setCartOpen}><Account /></StoreLayout></ProtectedRoute>} />
      <Route path="/admin"          element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/orders"   element={<AdminRoute><AdminOrders /></AdminRoute>} />
      <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
      <Route path="/admin/users"    element={<AdminRoute><AdminCustomers /></AdminRoute>} />
      <Route path="*"             element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) {
      const cursor = document.getElementById('rd-cursor');
      const follower = document.getElementById('rd-cursor-follower');
      if (window.innerWidth >= 768) {
        if (cursor) cursor.style.display = 'block';
        if (follower) follower.style.display = 'block';
      }
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