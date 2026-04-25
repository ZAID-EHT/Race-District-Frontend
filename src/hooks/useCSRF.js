import { useEffect, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

let cachedToken = null; // module-level cache — one fetch per session

/**
 * useCSRF — fetches and caches the CSRF token from /api/csrf-token.
 * Returns { csrfToken, csrfHeaders } where csrfHeaders is ready to
 * spread into your fetch/axios headers.
 *
 * Usage:
 *   const { csrfHeaders } = useCSRF();
 *   fetch('/api/orders', { method: 'POST', headers: { ...csrfHeaders, ... } })
 */
export function useCSRF() {
  const [csrfToken, setCsrfToken] = useState(cachedToken);

  useEffect(() => {
    if (cachedToken) return; // already fetched

    fetch(`${API_BASE}/api/csrf-token`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        cachedToken = data.csrfToken;
        setCsrfToken(data.csrfToken);
      })
      .catch(() => {
        console.warn('Could not fetch CSRF token.');
      });
  }, []);

  return {
    csrfToken,
    csrfHeaders: csrfToken ? { 'x-csrf-token': csrfToken } : {}
  };
}
