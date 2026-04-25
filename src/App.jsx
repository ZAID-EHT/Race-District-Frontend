import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { CartProvider } from './hooks/useCart';

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Account from './pages/Account';
import Login from './pages/Login';
import TrackOrder from './pages/TrackOrder';
import About from './pages/About';

// Components
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Toast from './components/common/Toast';

// Styles
import './styles/globals.css';

// Two separate cursor divs — dark mode (blue) and light mode (deep rich blue).
// Only one visible at a time. No colour-detection race conditions.
function GlobalCursor() {
  const darkCursorRef  = useRef(null);
  const lightCursorRef = useRef(null);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const [isLight, setIsLight] = useState(() =>
    typeof document !== 'undefined' && document.body.classList.contains('light-mode')
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Header.jsx adds/removes 'light-mode' on document.body — watch that
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLight(document.body.classList.contains('light-mode'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Move both cursors together — display:none hides the inactive one
  useEffect(() => {
    if (isMobile) return;
    const onMove = (e) => {
      const x = e.clientX + 'px';
      const y = e.clientY + 'px';
      if (darkCursorRef.current)  { darkCursorRef.current.style.left  = x; darkCursorRef.current.style.top  = y; }
      if (lightCursorRef.current) { lightCursorRef.current.style.left = x; lightCursorRef.current.style.top = y; }
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [isMobile]);

  if (isMobile) return null;

  const base = {
    width: '32px',
    height: '32px',
    background: 'transparent',
    borderRadius: '50%',
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 99999,
    transform: 'translate(-50%, -50%)',
    left: '-999px',
    top: '-999px',
  };

  return (
    <>
      {/* DARK MODE cursor — vivid blue */}
      <div
        ref={darkCursorRef}
        data-rd-cursor="dark"
        style={{ ...base, border: '2.5px solid #0066FF', display: isLight ? 'none' : 'block' }}
      />
      {/* LIGHT MODE cursor — deep rich dark blue */}
      <div
        ref={lightCursorRef}
        data-rd-cursor="light"
        style={{ ...base, border: '2.5px solid #003399', display: isLight ? 'block' : 'none' }}
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-rd-dark text-white font-inter overflow-x-hidden">
            <GlobalCursor />
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/account" element={<Account />} />
                <Route path="/login" element={<Login />} />
                <Route path="/track-order" element={<TrackOrder />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </main>
            <Footer />
            <Toast />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;