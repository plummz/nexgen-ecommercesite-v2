-- NexGen E-Commerce V2 — PostgreSQL Schema
-- Run: psql -U postgres -d nexgen_shop -f migrations/001_schema.sql

-- Extensions removed for Railway compatibility (uuid-ossp, pg_trgm)

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          VARCHAR(20)   NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
  phone         VARCHAR(30),
  avatar        VARCHAR(10),
  is_active     BOOLEAN       NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ─────────────────────────────────────────
-- ADDRESSES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS addresses (
  id         SERIAL PRIMARY KEY,
  user_id    INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label      VARCHAR(50)  NOT NULL DEFAULT 'Home',
  full_name  VARCHAR(100) NOT NULL,
  phone      VARCHAR(30)  NOT NULL,
  line1      VARCHAR(255) NOT NULL,
  line2      VARCHAR(255),
  city       VARCHAR(100) NOT NULL,
  province   VARCHAR(100) NOT NULL,
  zip        VARCHAR(20)  NOT NULL,
  is_default BOOLEAN      NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

-- ─────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  slug       VARCHAR(50)  NOT NULL UNIQUE,
  name       VARCHAR(100) NOT NULL,
  icon       VARCHAR(10)  NOT NULL DEFAULT '🛍️',
  sort_order INT          NOT NULL DEFAULT 0
);

-- ─────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(255)   NOT NULL,
  slug           VARCHAR(255)   NOT NULL UNIQUE,
  category_id    INT            REFERENCES categories(id) ON DELETE SET NULL,
  price          NUMERIC(10,2)  NOT NULL,
  original_price NUMERIC(10,2),
  description    TEXT,
  image          VARCHAR(255),
  badge          VARCHAR(30),
  rating         NUMERIC(3,1)   NOT NULL DEFAULT 0,
  sold_count     INT            NOT NULL DEFAULT 0,
  stock          INT            NOT NULL DEFAULT 100,
  is_active      BOOLEAN        NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active   ON products(is_active);
-- Full-text index (pg_trgm not required; ILIKE used for search)

-- ─────────────────────────────────────────
-- PRODUCT VARIATIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_variations (
  id             SERIAL PRIMARY KEY,
  product_id     INT           NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name           VARCHAR(100)  NOT NULL,
  price_modifier NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock          INT           NOT NULL DEFAULT 50,
  sort_order     INT           NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_variations_product ON product_variations(product_id);

-- ─────────────────────────────────────────
-- PRODUCT IMAGES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
  id         SERIAL PRIMARY KEY,
  product_id INT          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        VARCHAR(255) NOT NULL,
  alt        VARCHAR(255),
  sort_order INT          NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id);

-- ─────────────────────────────────────────
-- CART ITEMS (persistent, per user)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
  id           SERIAL PRIMARY KEY,
  user_id      INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id   INT           NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variation_id INT           REFERENCES product_variations(id) ON DELETE SET NULL,
  variation    VARCHAR(100),
  quantity     INT           NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id, variation)
);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);

-- ─────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id             SERIAL PRIMARY KEY,
  user_id        INT            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  address_id     INT            REFERENCES addresses(id) ON DELETE SET NULL,
  -- snapshot address in case original gets deleted
  shipping_name     VARCHAR(100),
  shipping_phone    VARCHAR(30),
  shipping_line1    VARCHAR(255),
  shipping_city     VARCHAR(100),
  shipping_province VARCHAR(100),
  shipping_zip      VARCHAR(20),
  status         VARCHAR(30)    NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','packed','shipped','delivered','cancelled','refunded')),
  subtotal       NUMERIC(10,2)  NOT NULL,
  shipping_fee   NUMERIC(10,2)  NOT NULL DEFAULT 0,
  discount       NUMERIC(10,2)  NOT NULL DEFAULT 0,
  total          NUMERIC(10,2)  NOT NULL,
  payment_method VARCHAR(50)    NOT NULL DEFAULT 'cod',
  payment_status VARCHAR(20)    NOT NULL DEFAULT 'pending'
                   CHECK (payment_status IN ('pending','paid','failed','refunded')),
  coupon_code    VARCHAR(50),
  notes          TEXT,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_user   ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ─────────────────────────────────────────
-- ORDER ITEMS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INT           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT           REFERENCES products(id) ON DELETE SET NULL,
  name       VARCHAR(255)  NOT NULL,
  image      VARCHAR(255),
  variation  VARCHAR(100),
  quantity   INT           NOT NULL,
  price      NUMERIC(10,2) NOT NULL,
  subtotal   NUMERIC(10,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ─────────────────────────────────────────
-- ORDER STATUS HISTORY
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_status_history (
  id         SERIAL PRIMARY KEY,
  order_id   INT          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     VARCHAR(30)  NOT NULL,
  note       TEXT,
  created_by INT          REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- REVIEWS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id         SERIAL PRIMARY KEY,
  user_id    INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INT          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id   INT          REFERENCES orders(id) ON DELETE SET NULL,
  rating     SMALLINT     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body       TEXT,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id, order_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user    ON reviews(user_id);

-- ─────────────────────────────────────────
-- COUPONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id         SERIAL PRIMARY KEY,
  code       VARCHAR(50)   NOT NULL UNIQUE,
  type       VARCHAR(20)   NOT NULL CHECK (type IN ('percent','fixed','freeship')),
  discount   NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_order  NUMERIC(10,2) NOT NULL DEFAULT 0,
  category   VARCHAR(50),
  max_uses   INT,
  uses       INT           NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active  BOOLEAN       NOT NULL DEFAULT true
);

-- ─────────────────────────────────────────
-- WISHLIST
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlist (
  id         SERIAL PRIMARY KEY,
  user_id    INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INT         NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);

-- ─────────────────────────────────────────
-- UPDATED_AT trigger function
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_products_updated
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_orders_updated
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_reviews_updated
  BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION set_updated_at();
