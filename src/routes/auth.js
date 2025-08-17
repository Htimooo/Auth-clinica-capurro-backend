const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { decryptPassword, generateToken, authMiddleware } = require('../auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Missing email or password' });
  try {
    const existing = await db.getUserByEmail(email);
    if (existing) return res.status(409).json({ message: 'User already exists' });
    const plain = decryptPassword(password);
    const hash = await bcrypt.hash(plain, 10);
    const user = { id: uuidv4(), email, password: hash, role: role || 'user' };
    await db.createUser(user);
    res.status(201).json({ email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Missing email or password' });
  try {
    const user = await db.getUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const plain = decryptPassword(password);
    const ok = await bcrypt.compare(plain, user.password || '');
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = generateToken(user);
    res.json({ email: user.email, token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/change-password', authMiddleware, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: 'Missing password' });
  try {
    const plain = decryptPassword(password);
    const hash = await bcrypt.hash(plain, 10);
    await db.updatePassword(req.user.id, hash);
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ message: 'Change password failed' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Missing email' });
  try {
    const user = await db.getUserByEmail(email);
    if (!user) return res.json({ message: 'If that account exists, a reset token has been generated' });
    const token = uuidv4();
    await db.setResetToken(user.id, token);
    res.json({ message: 'Password reset initiated', resetToken: token });
  } catch (err) {
    res.status(500).json({ message: 'Forgot password failed' });
  }
});

module.exports = router;
