// ============================================================
//  auth.js — Client-side auth state management
// ============================================================

const Auth = {
  getUser()    { return JSON.parse(localStorage.getItem('nexgen_user') || 'null'); },
  getToken()   { return localStorage.getItem('nexgen_token') || null; },
  isLoggedIn() { return !!this.getToken(); },
  isAdmin()    { const u = this.getUser(); return u && u.role === 'admin'; },

  setSession(token, user) {
    localStorage.setItem('nexgen_token', token);
    localStorage.setItem('nexgen_user',  JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem('nexgen_token');
    localStorage.removeItem('nexgen_user');
  },

  async login(email, password) {
    const { token, user } = await Api.auth.login({ email, password });
    this.setSession(token, user);
    return user;
  },

  async register(name, email, password) {
    const { token, user } = await Api.auth.register({ name, email, password });
    this.setSession(token, user);
    return user;
  },

  logout() {
    this.clearSession();
    window.location.href = '/index.html';
  },

  requireLogin(redirect = window.location.href) {
    if (!this.isLoggedIn()) {
      window.location.href = `profile.html?redirect=${encodeURIComponent(redirect)}`;
      return false;
    }
    return true;
  },

  requireAdmin() {
    if (!this.isAdmin()) {
      window.location.href = '/index.html';
      return false;
    }
    return true;
  },
};
