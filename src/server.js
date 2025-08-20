require('dotenv').config();
const config = require('./config');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { v4: uuidv4 } = require('uuid');
const authRoutes = require('./routes/auth');
const { generateToken } = require('./auth');
const db = require('./db');

passport.use(new GoogleStrategy({
  clientID: config.googleClientId,
  clientSecret: config.googleClientSecret,
  callbackURL: '/oauth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    let user = await db.getUserByEmail(email);
    if (!user) {
      user = { id: uuidv4(), email, password: null, role: 'user' };
      await db.createUser(user);
    }
    done(null, user);
  } catch (err) {
    done(err);
  }
}));

const app = express();

const allowedOrigins = process.env.NODE_ENV === 'production' && process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : '*';

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(passport.initialize());
app.use('/', authRoutes);

app.get('/oauth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/oauth/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), (req, res) => {
  const token = generateToken(req.user);
  res.json({ email: req.user.email, token, role: req.user.role });
});

const PORT = config.port;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
