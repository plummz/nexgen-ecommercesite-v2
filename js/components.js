// ============================================================
//  components.js — Shared Navbar, Footer, Toast, Cart Badge
//  Inject with: Components.init()
// ============================================================

const Components = {
  // ── Cart count (backed by API when logged in, localStorage fallback) ──
  _cartCount: 0,

  async updateCartBadge() {
    try {
      if (Auth.isLoggedIn()) {
        const items = await Api.cart.get();
        this._cartCount = items.reduce((s, i) => s + i.quantity, 0);
      } else {
        const local = JSON.parse(localStorage.getItem('nexgen_cart_guest') || '[]');
        this._cartCount = local.reduce((s,i) => s + i.qty, 0);
      }
    } catch { this._cartCount = 0; }
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.textContent   = this._cartCount;
      badge.style.display = this._cartCount > 0 ? 'flex' : 'none';
    }
  },

  // ── Navbar ──
  renderNavbar(activePage = '') {
    const user = Auth.getUser();
    return `
<div class="announce-bar">
  ⚡ FREE SHIPPING on orders ₱500+ &nbsp;•&nbsp; COD AVAILABLE &nbsp;•&nbsp;
  📱 09671756325 &nbsp;•&nbsp; Use code <strong>WELCOME50</strong> for ₱50 off!
</div>
<nav class="navbar">
  <a href="/index.html" class="nav-logo">JOHN REY'S <span>NEXGEN</span></a>
  <div class="nav-search">
    <input type="text" id="searchInput" placeholder="Search products, brands, categories..."
           onkeydown="if(event.key==='Enter')doSearch()" autocomplete="off"/>
    <button onclick="doSearch()">🔍 Search</button>
    <div class="search-dropdown" id="searchDropdown"></div>
  </div>
  <div class="nav-icons">
    <a href="/deals.html"    class="nav-icon ${activePage==='deals'?'active':''}"><span class="icon">🔥</span><span>Deals</span></a>
    <a href="/wishlist.html" class="nav-icon ${activePage==='wishlist'?'active':''}"><span class="icon">♡</span><span>Wishlist</span></a>
    <a href="/cart.html"     class="nav-icon ${activePage==='cart'?'active':''}">
      <span class="icon">🛒</span>
      <div id="cart-badge" style="display:none">0</div>
      <span>Cart</span>
    </a>
    <a href="${user ? '/profile.html' : '/profile.html'}" class="nav-icon ${activePage==='profile'?'active':''}">
      <span class="icon">👤</span>
      <span id="nav-user-label">${user ? user.name.split(' ')[0] : 'Login'}</span>
    </a>
    ${Auth.isAdmin() ? `<a href="/admin/index.html" class="nav-icon nav-admin"><span class="icon">⚙️</span><span>Admin</span></a>` : ''}
  </div>
</nav>
<div class="cat-nav" id="catNav"></div>`;
  },

  // ── Footer ──
  renderFooter() {
    return `
<footer class="footer">
  <div class="footer-grid">
    <div class="footer-brand">
      <div class="footer-logo">JOHN REY'S <span>NEXGEN</span></div>
      <p>Your one-stop Filipino shop for Pokémon collectibles, electronics, fashion, food, and more. Trusted by thousands nationwide!</p>
      <div class="footer-social" style="margin-top:14px;display:flex;gap:12px;">
        <a href="#" class="social-btn">📘 Facebook</a>
        <a href="#" class="social-btn">📸 Instagram</a>
      </div>
    </div>
    <div class="footer-col">
      <h4>Shop</h4>
      <a href="/products.html?cat=pokemon">Pokémon Figures</a>
      <a href="/products.html?cat=phones">Phones</a>
      <a href="/products.html?cat=laptops">Laptops</a>
      <a href="/products.html?cat=gaming">Gaming</a>
      <a href="/deals.html">Flash Deals</a>
    </div>
    <div class="footer-col">
      <h4>Account</h4>
      <a href="/profile.html">My Profile</a>
      <a href="/cart.html">My Cart</a>
      <a href="/wishlist.html">Wishlist</a>
      <a href="/profile.html#orders">My Orders</a>
      <a href="/coupons.html">Coupons</a>
    </div>
    <div class="footer-col">
      <h4>Help</h4>
      <a href="/faq.html">FAQ</a>
      <a href="/about.html">About Us</a>
      <a href="/faq.html#shipping">Shipping Info</a>
      <a href="/faq.html#returns">Return Policy</a>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© 2025 John Rey's NexGen Shop. All rights reserved.</span>
    <span>📱 09671756325 &nbsp;•&nbsp; Mon–Sat 8AM–8PM</span>
  </div>
</footer>`;
  },

  // ── Category Nav ──
  async renderCatNav() {
    try {
      const cats = await Api.products.categories();
      const el   = document.getElementById('catNav');
      if (!el) return;
      const params = new URLSearchParams(window.location.search);
      const active = params.get('cat') || '';
      el.innerHTML = [{ slug:'all', name:'All Products', icon:'🏪' }, ...cats].map(c =>
        `<a class="cat-link${c.slug===active?' active':''}" href="/products.html?cat=${c.slug}">${c.icon} ${c.name}</a>`
      ).join('');
    } catch { /* silently fail if API is down */ }
  },

  // ── Toast ──
  showToast(msg, type = 'success') {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      document.body.appendChild(t);
    }
    t.textContent  = msg;
    t.className    = `toast toast-${type} show`;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 3000);
  },

  // ── Product Card ──
  buildProductCard(p, wishlistIds = []) {
    const wishlisted = wishlistIds.includes(p.id || p.product_id);
    const disc = p.original_price ? Math.round((1 - p.price / p.original_price) * 100) : 0;
    const stars = this._stars(p.rating);
    const imgBase = p.image ? p.image.replace(/\.(png|jpg|jpeg)$/i,'') : '';
    const imgSrc  = imgBase ? `/assets/${imgBase}.webp` : '';
    const imgFall = p.image ? `/assets/${p.image}` : '';
    return `
<div class="product-card" data-id="${p.id}">
  <a href="/product.html?id=${p.id}" class="card-img-link">
    <div class="card-img">
      ${imgSrc
        ? `<picture>
             <source srcset="${imgSrc}" type="image/webp">
             <img src="${imgFall}" alt="${this._esc(p.name)}" loading="lazy"
                  onerror="this.parentElement.parentElement.nextElementSibling.style.display='flex'">
           </picture>`
        : ''}
      <div class="card-img-placeholder" style="${imgSrc ? 'display:none' : ''}">
        <span>${this._catEmoji(p.category)}</span>
      </div>
      ${p.badge ? `<div class="card-badge">${this._esc(p.badge)}</div>` : ''}
      ${disc    ? `<div class="card-disc">-${disc}%</div>` : ''}
      ${p.stock <= 5 && p.stock > 0 ? `<div class="card-low-stock">Only ${p.stock} left!</div>` : ''}
      ${p.stock === 0 ? `<div class="card-out-stock">Out of Stock</div>` : ''}
    </div>
  </a>
  <button class="wish-btn ${wishlisted ? 'active' : ''}"
          onclick="Components.toggleWishlist(${p.id}, this)" aria-label="Wishlist">
    ${wishlisted ? '♥' : '♡'}
  </button>
  <div class="card-body">
    <a href="/product.html?id=${p.id}" class="card-name">${this._esc(p.name)}</a>
    <div class="card-rating">${stars} <span>${p.rating} (${Number(p.sold_count).toLocaleString()} sold)</span></div>
    <div class="card-price">
      <span class="price-now">₱${Number(p.price).toLocaleString()}</span>
      ${p.original_price ? `<span class="price-old">₱${Number(p.original_price).toLocaleString()}</span>` : ''}
    </div>
    <button class="btn-addcart ${p.stock === 0 ? 'disabled' : ''}"
            onclick="${p.stock > 0 ? `Components.quickAdd(${p.id})` : ''}"
            ${p.stock === 0 ? 'disabled' : ''}>
      ${p.stock > 0 ? '🛒 Add to Cart' : 'Out of Stock'}
    </button>
  </div>
</div>`;
  },

  async quickAdd(productId) {
    if (!Auth.isLoggedIn()) {
      window.location.href = `/profile.html?redirect=${encodeURIComponent(window.location.href)}`;
      return;
    }
    try {
      const product = await Api.products.get(productId);
      const firstVar = product.variations[0];
      await Api.cart.add({
        product_id:   productId,
        variation_id: firstVar?.id || null,
        variation:    firstVar?.name || 'default',
        quantity:     1,
      });
      this.showToast(`${product.name} added to cart!`);
      await this.updateCartBadge();
    } catch (err) {
      this.showToast(err.message || 'Could not add to cart.', 'error');
    }
  },

  async toggleWishlist(productId, btn) {
    if (!Auth.isLoggedIn()) {
      window.location.href = `/profile.html?redirect=${encodeURIComponent(window.location.href)}`;
      return;
    }
    try {
      const isActive = btn.classList.contains('active');
      if (isActive) {
        await Api.wishlist.remove(productId);
        btn.classList.remove('active');
        btn.textContent = '♡';
        this.showToast('Removed from wishlist.');
      } else {
        await Api.wishlist.add(productId);
        btn.classList.add('active');
        btn.textContent = '♥';
        this.showToast('Added to wishlist!');
      }
    } catch (err) {
      this.showToast(err.message || 'Error updating wishlist.', 'error');
    }
  },

  // ── Helpers ──
  _stars(r) {
    let s = '';
    for (let i = 1; i <= 5; i++) s += i <= Math.floor(r) ? '★' : (i - r < 1 ? '½' : '☆');
    return s;
  },
  _esc(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },
  _catEmoji(cat) {
    return { pokemon:'🎮', watches:'⌚', laptops:'💻', phones:'📱', headphones:'🎧',
             keyboards:'⌨️', shoes:'👟', fashion:'👕', bags:'👜', food:'🍫',
             toys:'🧸', books:'📚', cameras:'📷', gaming:'🕹️', skincare:'✨' }[cat] || '🛍️';
  },

  // ── Init ──
  async init(activePage = '') {
    // Inject navbar
    const navTarget = document.getElementById('navbar-root');
    if (navTarget) navTarget.innerHTML = this.renderNavbar(activePage);

    // Inject footer
    const footerTarget = document.getElementById('footer-root');
    if (footerTarget) footerTarget.innerHTML = this.renderFooter();

    // Category nav
    await this.renderCatNav();

    // Cart badge
    await this.updateCartBadge();
  },
};

// Global search function used by navbar
function doSearch() {
  const q = document.getElementById('searchInput')?.value.trim();
  if (q) window.location.href = `/products.html?q=${encodeURIComponent(q)}`;
}

// Show toast globally
function showToast(msg, type = 'success') { Components.showToast(msg, type); }
