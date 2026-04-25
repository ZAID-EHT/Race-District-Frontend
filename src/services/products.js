import api from './api';

export const productService = {
  getAll:      (params)   => api.get('/products', { params }),
  getFeatured: ()         => api.get('/products/featured'),
  getById:     (id)       => api.get(`/products/${id}`),
  addReview:   (id, data) => api.post(`/products/${id}/reviews`, data)
};

export default productService;