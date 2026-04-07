// ============================================================
//  api.js — Centralized API client for NexGen V2
//  Set window.NEXGEN_API before loading this file to override
// ============================================================

const API_BASE = (typeof window !== 'undefined' && window.NEXGEN_API)
  ? window.NEXGEN_API
  : 'http://localhost:3000/api';

const Api = {
  _token() { return localStorage.getItem('nexgen_token') || ''; },
  _headers(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    const t = this._token();
    if (t) h['Authorization'] = `Bearer ${t}`;
    return h;
  },

  async _req(method, path, body) {
    const opts = { method, headers: this._headers() };
    if (body) opts.body = JSON.stringify(body);
    try {
      const res  = await fetch(API_BASE + path, opts);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw { status: res.status, message: data.error || 'Request failed.' };
      return data;
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        throw { status: 0, message: 'API offline. Run the backend locally to use this feature.' };
      }
      throw err;
    }
  },

  get:    (path)       => Api._req('GET',    path),
  post:   (path, body) => Api._req('POST',   path, body),
  put:    (path, body) => Api._req('PUT',    path, body),
  delete: (path)       => Api._req('DELETE', path),

  auth: {
    register: (d)    => Api.post('/auth/register', d),
    login:    (d)    => Api.post('/auth/login',    d),
    me:       ()     => Api.get('/auth/me'),
    profile:  (d)    => Api.put('/auth/profile',   d),
    password: (d)    => Api.put('/auth/password',  d),
    addresses: {
      list:   ()       => Api.get('/auth/addresses'),
      add:    (d)      => Api.post('/auth/addresses',      d),
      update: (id, d)  => Api.put(`/auth/addresses/${id}`, d),
      remove: (id)     => Api.delete(`/auth/addresses/${id}`),
    },
  },
  products: {
    list:       (p={}) => Api.get('/products?' + new URLSearchParams(p)),
    featured:   ()     => Api.get('/products/featured'),
    categories: ()     => Api.get('/products/categories'),
    get:        (id)   => Api.get(`/products/${id}`),
    reviews:    (id,p={}) => Api.get(`/products/${id}/reviews?` + new URLSearchParams(p)),
    related:    (id)   => Api.get(`/products/${id}/related`),
  },
  cart: {
    get:    ()      => Api.get('/cart'),
    add:    (d)     => Api.post('/cart', d),
    update: (id, d) => Api.put(`/cart/${id}`, d),
    remove: (id)    => Api.delete(`/cart/${id}`),
    clear:  ()      => Api.delete('/cart'),
  },
  orders: {
    list:   (p={}) => Api.get('/orders?' + new URLSearchParams(p)),
    get:    (id)   => Api.get(`/orders/${id}`),
    create: (d)    => Api.post('/orders', d),
    cancel: (id)   => Api.post(`/orders/${id}/cancel`),
  },
  reviews: {
    create: (d)  => Api.post('/reviews', d),
    delete: (id) => Api.delete(`/reviews/${id}`),
  },
  coupons: {
    list:     ()  => Api.get('/coupons'),
    validate: (d) => Api.post('/coupons/validate', d),
  },
  wishlist: {
    get:    ()   => Api.get('/wishlist'),
    ids:    ()   => Api.get('/wishlist/ids'),
    add:    (id) => Api.post('/wishlist', { product_id: id }),
    remove: (id) => Api.delete(`/wishlist/${id}`),
  },
  admin: {
    dashboard: () => Api.get('/admin/dashboard'),
    products: {
      list:   (p={})   => Api.get('/admin/products?' + new URLSearchParams(p)),
      create: (d)      => Api.post('/admin/products', d),
      update: (id, d)  => Api.put(`/admin/products/${id}`, d),
      delete: (id)     => Api.delete(`/admin/products/${id}`),
    },
    orders: {
      list:      (p={})  => Api.get('/admin/orders?' + new URLSearchParams(p)),
      get:       (id)    => Api.get(`/admin/orders/${id}`),
      setStatus: (id, d) => Api.put(`/admin/orders/${id}/status`, d),
    },
    users: {
      list:   (p={})  => Api.get('/admin/users?' + new URLSearchParams(p)),
      role:   (id, d) => Api.put(`/admin/users/${id}/role`, d),
      toggle: (id)    => Api.put(`/admin/users/${id}/toggle`),
    },
    inventory: {
      list:   ()      => Api.get('/admin/inventory'),
      update: (id, d) => Api.put(`/admin/inventory/${id}`, d),
    },
  },
};
