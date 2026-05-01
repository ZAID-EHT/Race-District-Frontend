import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 'instant' is required for mobile — 'smooth' silently fails on some browsers
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    // Fallback for older mobile browsers that don't support the options object
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}

export default ScrollToTop;