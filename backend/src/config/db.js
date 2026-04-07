const { Pool } = require('pg');

// Railway injects DATABASE_URL — use it when available, fall back to individual vars
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  : new Pool({
      host:     process.env.DB_HOST || process.env.PGHOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || process.env.PGPORT || '5432'),
      database: process.env.DB_NAME || process.env.PGDATABASE || 'nexgen_shop',
      user:     process.env.DB_USER || process.env.PGUSER     || 'postgres',
      password: process.env.DB_PASSWORD || process.env.PGPASSWORD || '',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err);
});

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DB] ${text.substring(0, 60)}... (${Date.now() - start}ms)`);
  }
  return res;
}

async function getClient() {
  return pool.connect();
}

module.exports = { query, getClient, pool };
