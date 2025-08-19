const { Pool } = require('pg');
const { db: dbConfig } = require('./config');

// Create a connection pool using environment variables for configuration.
// Required variables: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.name
});

// Initialize the schema if it does not exist.
pool
  .query(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT,
    resetTokenHash TEXT,
    resetTokenExpiry TIMESTAMPTZ
  )`)
  .catch(err => {
    console.error('Error initializing database', err);
  });

module.exports = {
  async getUserByEmail(email) {
    const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0];
  },

  async createUser(user) {
    const { id, email, password, role } = user;
    await pool.query(
      'INSERT INTO users (id, email, password, role) VALUES ($1, $2, $3, $4)',
      [id, email, password, role]
    );
  },

  async updatePassword(id, password) {
    await pool.query(
      'UPDATE users SET password = $1, resetTokenHash = NULL, resetTokenExpiry = NULL WHERE id = $2',
      [password, id]
    );
  },

  async setResetToken(id, tokenHash, expiresAt) {
    await pool.query(
      'UPDATE users SET resetTokenHash = $1, resetTokenExpiry = $2 WHERE id = $3',
      [tokenHash, expiresAt, id]
    );
  },

  async getUserByResetToken(tokenHash) {
    const res = await pool.query(
      'SELECT * FROM users WHERE resetTokenHash = $1',
      [tokenHash]
    );
    return res.rows[0];
  },

  async clearResetToken(id) {
    await pool.query(
      'UPDATE users SET resetTokenHash = NULL, resetTokenExpiry = NULL WHERE id = $1',
      [id]
    );
  }
};

