const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'auth.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT,
    resetToken TEXT
  )`);
});

module.exports = {
  getUserByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
        if (err) reject(err); else resolve(row);
      });
    });
  },

  createUser(user) {
    return new Promise((resolve, reject) => {
      const { id, email, password, role } = user;
      db.run(`INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)`,
        [id, email, password, role], function (err) {
          if (err) reject(err); else resolve();
        });
    });
  },

  updatePassword(id, password) {
    return new Promise((resolve, reject) => {
      db.run(`UPDATE users SET password = ?, resetToken = NULL WHERE id = ?`,
        [password, id], function (err) {
          if (err) reject(err); else resolve();
        });
    });
  },

  setResetToken(id, token) {
    return new Promise((resolve, reject) => {
      db.run(`UPDATE users SET resetToken = ? WHERE id = ?`,
        [token, id], function (err) {
          if (err) reject(err); else resolve();
        });
    });
  },

  getUserByResetToken(token) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE resetToken = ?`, [token], (err, row) => {
        if (err) reject(err); else resolve(row);
      });
    });
  }
};
