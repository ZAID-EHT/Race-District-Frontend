// frontend/src/services/api.js
// Changes from original:
//   - orderAPI: added verifyKokoOrder(params) — called by KokoReturn.jsx

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://race-district-backend-production.up.railway.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  withCredentials: true
});

// ✅ FIX: Use a Promise-based singleton for CSRF token fetching.
let csrfToken = null;
let csrfFetchPromise = null;

export const fetchCSRFToken = async (forceRefresh = false) => {
  // forceRefresh=true is called by Checkout right before placing an order.
  // This busts the cache so mobile browsers (which may have received the
  // csrf-session cookie only after the initial page load) get a fresh token
  // that matches the cookie now present on their device.
  if (forceRefresh) {
    csrfToken = null;
    csrfFetchPromise = null;
  }

  if (csrfToken) return csrfToken;
  if (csrfFetchPromise) return csrfFetchPromise;

  csrfFetchPromise = (async () => {
    try {
      const response = await api.get('/csrf-token');
      csrfToken = response.data.csrfToken;
      return csrfToken;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      csrfFetchPromise = null;
      return null;
    }
  })();

  return csrfFetchPromise;
};

// ✅ FIX: Eagerly fetch the CSRF token when the module first loads.
fetchCSRFToken();

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('rd_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const stateChangingMethods = ['post', 'put', 'patch', 'delete'];
  if (stateChangingMethods.includes(config.method?.toLowerCase())) {
    const csrf = await fetchCSRFToken();
    if (csrf) config.headers['X-CSRF-Token'] = csrf;
  }

  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 403 &&
      error.response?.data?.message?.toLowerCase().includes('csrf') &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
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
  create:             (data)        => api.post('/orders', data),
  createGuest:        (data)        => api.post('/orders/guest', data),
  getMyOrders:        (params)      => api.get('/orders/my-orders', { params }),
  getById:            (id)          => api.get(`/orders/${id}`),
  cancelOrder:        (id)          => api.put(`/orders/${id}/cancel`),
  track:              (orderNumber) => api.get(`/orders/track/${orderNumber}`, { timeout: 30000 }),
  // ✅ Added: called by KokoReturn.jsx to verify payment status server-side
  verifyKokoOrder:    (params)      => api.get('/orders/koko-verify', { params }),
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