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

// ─── Global custom cursor ────────────────────────────────────────────────────
// Renders ONE ring, positioned here in App so it's truly global and can never
// be duplicated by a child component.
//
// Colour logic:
//   • Dark mode  → #0066FF  (vivid blue — pops on dark bg)
//   • Light mode → #020b1c  (near-black navy — darker than the dark-theme ring)
function GlobalCursor() {
  const cursorRef = useRef(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const getColor = () => {
      const isLight =
        document.documentElement.classList.contains('light-mode') ||
        document.body.classList.contains('light-mode') ||
        window.matchMedia('(prefers-color-scheme: light)').matches;
      // Light mode → very dark navy (darker than the blue used in dark mode)
      // Dark mode  → vivid blue
      return isLight ? '#020b1c' : '#0066FF';
    };

    const onMove = (e) => {
      if (!cursorRef.current) return;
      cursorRef.current.style.left = e.clientX + 'px';
      cursorRef.current.style.top  = e.clientY + 'px';
      cursorRef.current.style.borderColor = getColor();
    };

    // React to theme-class changes so the colour switches instantly
    const observer = new MutationObserver(() => {
      if (cursorRef.current) cursorRef.current.style.borderColor = getColor();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.body,            { attributes: true, attributeFilter: ['class'] });

    // Set initial colour
    if (cursorRef.current) cursorRef.current.style.borderColor = getColor();

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      observer.disconnect();
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <div
      ref={cursorRef}
      data-rd-cursor="true"
      style={{
        width: '32px',
        height: '32px',
        background: 'transparent',
        border: '2.5px solid #0066FF', // overwritten immediately by effect
        borderRadius: '50%',
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 99999,
        transform: 'translate(-50%, -50%)',
        left: '-999px',
        top: '-999px',
      }}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-rd-dark text-white font-inter overflow-x-hidden">
            {/* Single global cursor — rendered once, above everything */}
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