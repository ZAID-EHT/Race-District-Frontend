import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://race-district-backend-production.up.railway.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  withCredentials: true
});

// ✅ FIX: Use a Promise-based singleton for CSRF token fetching.
//   Previously, the interceptor called `await fetchCSRFToken()` lazily on
//   every mutating request. On mobile, if two requests fired simultaneously
//   (e.g. login + CSRF check), they'd both fetch in parallel and one would
//   win while the other got an invalid stale value — causing "invalid CSRF token".
//   Now: the first call creates a single shared promise. All subsequent callers
//   wait on the SAME promise, so the token is only ever fetched once.
let csrfToken = null;
let csrfFetchPromise = null;

export const fetchCSRFToken = async () => {
  // Return cached token immediately
  if (csrfToken) return csrfToken;

  // If a fetch is already in-flight, wait for it (don't double-fetch)
  if (csrfFetchPromise) return csrfFetchPromise;

  csrfFetchPromise = (async () => {
    try {
      const response = await api.get('/csrf-token');
      csrfToken = response.data.csrfToken;
      return csrfToken;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      csrfFetchPromise = null; // Allow retry on next attempt
      return null;
    }
  })();

  return csrfFetchPromise;
};

// ✅ FIX: Eagerly fetch the CSRF token when the module first loads.
//   Previously it was fetched lazily inside the interceptor. On mobile,
//   if the user tapped "Login" before the token was ready, the request
//   would fire without a valid CSRF header and get rejected.
fetchCSRFToken();

api.interceptors.request.use(async (config) => {
  // Attach auth token
  const token = localStorage.getItem('rd_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Attach CSRF token for state-changing requests
  const stateChangingMethods = ['post', 'put', 'patch', 'delete'];
  if (stateChangingMethods.includes(config.method?.toLowerCase())) {
    // fetchCSRFToken() returns immediately if already cached (no await overhead)
    const csrf = await fetchCSRFToken();
    if (csrf) config.headers['X-CSRF-Token'] = csrf;
  }

  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // CSRF expired — clear cache and retry once
    if (
      error.response?.status === 403 &&
      error.response?.data?.message?.toLowerCase().includes('csrf') &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      // ✅ FIX: Clear both token AND promise so fetchCSRFToken() does a fresh fetch
      csrfToken = null;
      csrfFetchPromise = null;
      const newToken = await fetchCSRFToken();
      if (newToken) originalRequest.headers['X-CSRF-Token'] = newToken;
      return api(originalRequest);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('rd_token');
      localStorage.removeItem('rd_user');

      const isAuthMeCheck = originalRequest?.url?.includes('/auth/me');
      const alreadyOnLogin = window.location.pathname.includes('/login');

      if (!isAuthMeCheck && !alreadyOnLogin) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error.response?.data || error);
  }
);

export const authAPI = {
  register:       (data)       => api.post('/auth/register', data),
  login:          (data)       => api.post('/auth/login', data),
  googleAuth:     (idToken)    => api.post('/auth/google', { idToken }),
  getMe:          ()           => api.get('/auth/me'),
  updateProfile:  (data)       => api.put('/auth/profile', data),
  changePassword: (data)       => api.put('/auth/password', data),
  addAddress:     (data)       => api.post('/auth/addresses', data),
  updateAddress:  (id, data)   => api.put(`/auth/addresses/${id}`, data),
  deleteAddress:  (id)         => api.delete(`/auth/addresses/${id}`),
  toggleWishlist: (productId)  => api.post(`/auth/wishlist/${productId}`),
};

export const productAPI = {
  getAll:      (params) => api.get('/products', { params }),
  getFeatured: ()       => api.get('/products/featured'),
  getById:     (id)     => api.get(`/products/${id}`),
  addReview:   (id, d)  => api.post(`/products/${id}/reviews`, d),
};

export const orderAPI = {
  create:       (data)        => api.post('/orders', data),
  createGuest:  (data)        => api.post('/orders/guest', data),
  getMyOrders:  (params)      => api.get('/orders/my-orders', { params }),
  getById:      (id)          => api.get(`/orders/${id}`),
  cancelOrder:  (id)          => api.put(`/orders/${id}/cancel`),
  track:        (orderNumber) => api.get(`/orders/track/${orderNumber}`, { timeout: 30000 }),
};

export const adminAPI = {
  getStats:          ()           => api.get('/admin/stats'),
  getOrders:         (params)     => api.get('/admin/orders', { params }),
  updateOrderStatus: (id, data)   => api.put(`/admin/orders/${id}/status`, data),
  bulkUpdateOrders:  (data)       => api.post('/admin/orders/bulk-update', data),
  addOrderComment:   (id, data)   => api.post(`/admin/orders/${id}/comment`, data),
  getProducts:       (params)     => api.get('/admin/products', { params }),
  createProduct:     (data)       => api.post('/admin/products', data),
  updateProduct:     (id, data)   => api.put(`/admin/products/${id}`, data),
  deleteProduct:     (id)         => api.delete(`/admin/products/${id}`),
  restoreProduct:    (id)         => api.patch(`/admin/products/${id}/restore`),
  getUsers:          (params)     => api.get('/admin/users', { params }),
  getUserOrders:     (userId)     => api.get(`/admin/users/${userId}/orders`),
  toggleUserStatus:  (id, isActive) => api.put(`/admin/users/${id}/status`, { isActive }),
  uploadImage: (formData) => api.post('/admin/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  }),
};

export default api;