import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Small delay lets the new page DOM mount fully before scrolling.
    // Without this, mobile browsers scroll to top of the *old* page content
    // then the new content renders below — making it look like the bottom.
    const id = setTimeout(() => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch {
        // Fallback for browsers that don't support options object
        window.scrollTo(0, 0);
      }
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);

    return () => clearTimeout(id);
  }, [pathname]);

  return null;
}

export default ScrollToTop;