const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { generateToken, authMiddleware } = require('../auth');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const config = require('../config');
const { body } = require('express-validator');
const validate = require('../middleware/validation');

const router = express.Router();

// Ensure authentication routes are accessed over HTTPS
router.use((req, res, next) => {
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    return next();
  }
  res.status(400).json({ message: 'HTTPS required' });
});

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[A-Za-z]/)
      .withMessage('Password must contain letters')
      .matches(/[0-9]/)
      .withMessage('Password must contain numbers'),
    validate
  ],
  async (req, res) => {
    const { email, password, role } = req.body;
    try {
      const existing = await db.getUserByEmail(email);
      if (existing) return res.status(409).json({ message: 'User already exists' });
      const hash = await bcrypt.hash(password, 10);
      const user = { id: uuidv4(), email, password: hash, role: role || 'user' };
      await db.createUser(user);
      res.status(201).json({ email: user.email, role: user.role });
    } catch (err) {
      res.status(500).json({ message: 'Registration failed' });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[A-Za-z]/)
      .withMessage('Password must contain letters')
      .matches(/[0-9]/)
      .withMessage('Password must contain numbers'),
    validate
  ],
  async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await db.getUserByEmail(email);
      if (!user) return res.status(401).json({ message: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.password || '');
      if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
      const token = generateToken(user);
      res.json({ email: user.email, token, role: user.role });
    } catch (err) {
      res.status(500).json({ message: 'Login failed' });
    }
  }
);

router.post(
  '/change-password',
  authMiddleware,
  [
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[A-Za-z]/)
      .withMessage('Password must contain letters')
      .matches(/[0-9]/)
      .withMessage('Password must contain numbers'),
    validate
  ],
  async (req, res) => {
    const { password } = req.body;
    try {
      const hash = await bcrypt.hash(password, 10);
      await db.updatePassword(req.user.id, hash);
      res.json({ message: 'Password updated' });
    } catch (err) {
      res.status(500).json({ message: 'Change password failed' });
    }
  }
);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Invalid email'), validate],
  async (req, res) => {
    const { email } = req.body;
    try {
      const user = await db.getUserByEmail(email);
      if (!user) return res.json({ message: 'If that account exists, a reset email has been sent' });
      const token = uuidv4();
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 3600000);
      await db.setResetToken(user.id, tokenHash, expiresAt);

    try {
      if (config.email && config.email.host) {
        const transporter = nodemailer.createTransport({
          host: config.email.host,
          port: config.email.port,
          auth: config.email.user ? { user: config.email.user, pass: config.email.pass } : undefined
        });
        await transporter.sendMail({
          from: config.email.from || config.email.user,
          to: email,
          subject: 'Password Reset',
          text: `Use this token to reset your password: ${token}`
        });
      } else {
        console.log(`Reset token for ${email}: ${token}`);
      }
    } catch (mailErr) {
      console.error('Error sending reset email', mailErr);
    }

    res.json({ message: 'Password reset initiated' });
  } catch (err) {
    res.status(500).json({ message: 'Forgot password failed' });
  }
  }
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[A-Za-z]/)
      .withMessage('Password must contain letters')
      .matches(/[0-9]/)
      .withMessage('Password must contain numbers'),
    validate
  ],
  async (req, res) => {
    const { token, password } = req.body;
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const user = await db.getUserByResetToken(tokenHash);
      if (!user || !user.resetTokenExpiry) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
    if (new Date(user.resetTokenExpiry) < new Date()) {
      await db.clearResetToken(user.id);
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    const hash = await bcrypt.hash(password, 10);
    await db.updatePassword(user.id, hash);
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ message: 'Reset password failed' });
  }
  }
);

module.exports = router;
