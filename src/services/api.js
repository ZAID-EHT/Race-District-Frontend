import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://race-district-backend-production.up.railway.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  withCredentials: true
});

let csrfToken = null;

export const fetchCSRFToken = async () => {
  try {
    const response = await api.get('/csrf-token');
    csrfToken = response.data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
};

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('rd_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const stateChangingMethods = ['post', 'put', 'patch', 'delete'];
  if (stateChangingMethods.includes(config.method?.toLowerCase())) {
    if (!csrfToken) await fetchCSRFToken();
    if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken;
  }

  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // CSRF retry
    if (
      error.response?.status === 403 &&
      error.response?.data?.message?.toLowerCase().includes('csrf') &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      csrfToken = null;
      await fetchCSRFToken();
      originalRequest.headers['X-CSRF-Token'] = csrfToken;
      return api(originalRequest);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('rd_token');
      localStorage.removeItem('rd_user');

      /*
        FIX: Do NOT auto-redirect on /auth/me failures.
        /auth/me is the token-validation call made at startup.
        If it 401s (stale/expired token), we should just clear the
        stored user and let the app render the homepage normally —
        NOT force the user to /login.

        Only redirect for explicit protected API calls (not the me-check).
      */
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
  bulkUpdateOrders:  (data)       => api.post('/admin/orders/bulk-status', data),
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