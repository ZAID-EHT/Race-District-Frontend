import { useEffect, useState } from 'react';
// ✅ FIX: Import from the centralized api.js singleton instead of fetching
//   independently. Previously useCSRF.js had its own module-level cache
//   that was separate from api.js's cache — so the app could end up with
//   two different CSRF tokens in memory, causing validation failures on mobile.
import { fetchCSRFToken } from '../services/api';

/**
 * useCSRF — returns the CSRF token and a ready-to-spread headers object.
 *
 * Usage:
 *   const { csrfHeaders } = useCSRF();
 *   fetch('/api/orders', { method: 'POST', headers: { ...csrfHeaders, ... } })
 *
 * Note: For requests made via the `api` axios instance (api.js), you do NOT
 * need this hook — the interceptor in api.js attaches the CSRF header
 * automatically. Only use this hook for raw `fetch()` calls.
 */
export function useCSRF() {
  const [csrfToken, setCsrfToken] = useState(null);

  useEffect(() => {
    // fetchCSRFToken() resolves immediately from cache if already fetched.
    // api.js eagerly fetches on module load, so this is nearly always instant.
    fetchCSRFToken().then(token => {
      if (token) setCsrfToken(token);
    });
  }, []);

  return {
    csrfToken,
    csrfHeaders: csrfToken ? { 'X-CSRF-Token': csrfToken } : {}
  };
}