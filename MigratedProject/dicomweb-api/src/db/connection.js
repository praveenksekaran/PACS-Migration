const { Pool } = require('pg');
const config = require('config');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      host: config.get('db.host'),
      port: config.get('db.port'),
      database: config.get('db.database'),
      user: config.get('db.user'),
      password: config.get('db.password'),
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function query(sql, params) {
  return getPool().query(sql, params);
}

async function end() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { query, end };
