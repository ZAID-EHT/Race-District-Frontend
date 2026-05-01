import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// useLayoutEffect fires synchronously after DOM update but BEFORE browser paint.
// This is the correct hook for scroll resets — it prevents the flash of the
// old scroll position that useEffect causes on fast devices, and the delayed
// scroll that setTimeout causes on slow/mobile devices.
//
// We also keep a setTimeout fallback for iOS Safari which sometimes ignores
// synchronous scrollTo calls during navigation transitions.

function ScrollToTop() {
  const { pathname } = useLocation();
  const prevPathname = useRef(pathname);

  useLayoutEffect(() => {
    // Only scroll if the path actually changed (not on first mount)
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
    }
    // Scroll immediately — fires before paint so no flicker
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  useEffect(() => {
    // Belt-and-suspenders: iOS Safari and some Android browsers defer layout,
    // so we also scroll after paint just in case the layout effect was ignored.
    const id = setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 50);
    return () => clearTimeout(id);
  }, [pathname]);

  return null;
}

export default ScrollToTop;