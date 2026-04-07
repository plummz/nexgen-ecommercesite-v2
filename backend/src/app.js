require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const path        = require('path');
const fs          = require('fs');
const rateLimit   = require('express-rate-limit');
const db          = require('./config/db');

const app = express();

// ── Security & Parsing ──
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'http://localhost:5500').split(','),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ──
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again later.' },
});
app.use('/api', apiLimiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Static uploads ──
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Routes ──
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart',     require('./routes/cart'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/reviews',  require('./routes/reviews'));
app.use('/api/coupons',  require('./routes/coupons'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/upload',   require('./routes/upload'));

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', env: process.env.NODE_ENV });
});

// ── 404 ──
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  const status = err.status || 500;
  const msg    = process.env.NODE_ENV === 'production' && status === 500
    ? 'Internal server error.'
    : err.message;
  res.status(status).json({ error: msg });
});

async function runMigrations() {
  const migrationPath = path.join(__dirname, '../migrations/001_schema.sql');
  if (!fs.existsSync(migrationPath)) return;
  const client = await db.getClient();
  try {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    // Split on semicolons and run each statement individually
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    for (const stmt of statements) {
      try {
        await client.query(stmt);
      } catch (err) {
        console.warn('[DB] Migration stmt warning:', err.message.substring(0, 100));
      }
    }
    console.log('[DB] Schema migration applied.');
  } catch (err) {
    console.error('[DB] Migration error:', err.message);
  } finally {
    client.release();
  }
}

async function runSeeds() {
  try {
    const { rows } = await db.query("SELECT COUNT(*) FROM users WHERE role='admin'");
    if (parseInt(rows[0].count) === 0) {
      console.log('[DB] No admin found — running seeds...');
      const seed = require('../seeds/seed');
      await seed();
      console.log('[DB] Seeds complete.');
    } else {
      console.log('[DB] Seeds already applied, skipping.');
    }
  } catch (err) {
    console.error('[DB] Seed error (non-fatal):', err.message);
  }
}

const PORT = process.env.PORT || 3000;
(async () => {
  await runMigrations();
  await runSeeds();
  app.listen(PORT, () => {
    console.log(`NexGen API v2 running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
})();

module.exports = app;
