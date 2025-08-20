// Integration tests for auth routes using Node's built-in test runner
const { test, beforeEach } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

// Set required environment variables for config
process.env.GOOGLE_CLIENT_ID = 'test';
process.env.GOOGLE_CLIENT_SECRET = 'test';
process.env.JWT_SECRET = 'testsecret';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'user';
process.env.DB_PASSWORD = 'password';
process.env.DB_NAME = 'testdb';

// Simple in-memory mock database
const users = new Map();
const mockDb = {
  users,
  async getUserByEmail(email) {
    for (const user of users.values()) {
      if (user.email === email) return user;
    }
    return null;
  },
  async createUser(user) {
    users.set(user.id, user);
  },
  async updatePassword(id, password) {
    const user = users.get(id);
    if (user) user.password = password;
  },
  async setResetToken() {},
  async getUserByResetToken() { return null; },
  async clearResetToken() {}
};

// Override the real database module with our mock
require.cache[require.resolve('../src/db')] = { exports: mockDb };

const app = require('../src/server');

// Helper to perform requests against the express app
function requestApp(method, path, body = {}, headers = {}) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const port = server.address().port;
      const data = JSON.stringify(body);
      const req = http.request({
        method,
        hostname: '127.0.0.1',
        port,
        path,
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-proto': 'https',
          ...headers
        }
      }, res => {
        let raw = '';
        res.on('data', chunk => { raw += chunk; });
        res.on('end', () => {
          server.close();
          const parsed = raw ? JSON.parse(raw) : {};
          resolve({ statusCode: res.statusCode, body: parsed });
        });
      });
      req.on('error', err => { server.close(); reject(err); });
      req.write(data);
      req.end();
    });
  });
}

beforeEach(() => {
  users.clear();
});

test('registers a new user', async () => {
  const res = await requestApp('POST', '/register', {
    email: 'user@example.com',
    password: 'Password1'
  });
  assert.strictEqual(res.statusCode, 201);
  assert.deepStrictEqual(res.body, { email: 'user@example.com', role: 'user' });
});

test('logs in an existing user', async () => {
  await requestApp('POST', '/register', {
    email: 'user@example.com',
    password: 'Password1'
  });
  const res = await requestApp('POST', '/login', {
    email: 'user@example.com',
    password: 'Password1'
  });
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.email, 'user@example.com');
  assert.ok(res.body.token);
});

test('changes password for authenticated user', async () => {
  await requestApp('POST', '/register', {
    email: 'user@example.com',
    password: 'Password1'
  });
  const login = await requestApp('POST', '/login', {
    email: 'user@example.com',
    password: 'Password1'
  });
  const token = login.body.token;

  const change = await requestApp(
    'POST',
    '/change-password',
    { password: 'Newpass1' },
    { Authorization: `Bearer ${token}` }
  );
  assert.strictEqual(change.statusCode, 200);
  assert.deepStrictEqual(change.body, { message: 'Password updated' });

  const relog = await requestApp('POST', '/login', {
    email: 'user@example.com',
    password: 'Newpass1'
  });
  assert.strictEqual(relog.statusCode, 200);
  assert.ok(relog.body.token);
});

