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
    resetToken TEXT
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
      'UPDATE users SET password = $1, resetToken = NULL WHERE id = $2',
      [password, id]
    );
  },

  async setResetToken(id, token) {
    await pool.query(
      'UPDATE users SET resetToken = $1 WHERE id = $2',
      [token, id]
    );
  },

  async getUserByResetToken(token) {
    const res = await pool.query(
      'SELECT * FROM users WHERE resetToken = $1',
      [token]
    );
    return res.rows[0];
  }
};

