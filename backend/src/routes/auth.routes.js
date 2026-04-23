const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { Users } = require('../db/db');
const { requireAuth } = require('../middleware/auth.middleware');
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();

const router = express.Router();

// Strict rate limit for login/signup
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { error: 'Too many authentication attempts, please try again after 15 minutes' }
});

router.post('/signup', authLimiter, [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  const requestId = crypto.randomUUID();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn(`[auth][signup][${requestId}] Validation failed`, {
      username: req.body?.username,
      errorCount: errors.array().length
    });
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  console.log(`[auth][signup][${requestId}] Signup attempt`, { username });

  if (Users.findOne({ username })) {
    console.warn(`[auth][signup][${requestId}] Username already exists`, { username });
    return res.status(400).json({ error: 'Username already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create first user as admin, others as user
  const isFirstUser = Users.find().length === 0;
  
  const newUser = Users.create({
    username,
    password: hashedPassword,
    role: isFirstUser ? 'admin' : 'user',
    apiKey: uuidv4(),
    settings: {
      defaultLinkSettings: {}
    },
    status: 'active'
  });

  const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });

  // Remove password from response
  const userResponse = { ...newUser };
  delete userResponse.password;

  console.log(`[auth][signup][${requestId}] Signup success`, { userId: newUser.id, username });
  res.status(201).json({ token, user: userResponse });
});

router.post('/login', authLimiter, [
  body('username').trim().notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  const requestId = crypto.randomUUID();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn(`[auth][login][${requestId}] Validation failed`, {
      username: req.body?.username,
      errorCount: errors.array().length
    });
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  console.log(`[auth][login][${requestId}] Login attempt`, { username });

  const user = Users.findOne({ username });
  if (!user) {
    console.warn(`[auth][login][${requestId}] User not found`, { username });
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  if (user.status === 'banned') {
    return res.status(403).json({ error: 'Account is banned' });
  }

  let isMatch = false;
  if (typeof user.password === 'string' && user.password.startsWith('$2')) {
    isMatch = await bcrypt.compare(password, user.password);
  } else {
    // Backward-compatible fallback for legacy plain-text records; migrate to bcrypt on successful login.
    isMatch = password === user.password;
    if (isMatch) {
      const migratedHash = await bcrypt.hash(password, 10);
      Users.updateOne({ id: user.id }, { password: migratedHash });
      console.warn(`[auth][login][${requestId}] Migrated legacy password hash`, { userId: user.id });
    }
  }
  if (!isMatch) {
    console.warn(`[auth][login][${requestId}] Password mismatch`, { username, userId: user.id });
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });

  const userResponse = { ...user };
  delete userResponse.password;

  console.log(`[auth][login][${requestId}] Login success`, { userId: user.id, username });
  res.json({ token, user: userResponse });
});

router.get('/me', requireAuth, (req, res) => {
  const userResponse = { ...req.user };
  delete userResponse.password;
  res.json({ user: userResponse });
});

// Refresh API Key
router.post('/apikey/refresh', requireAuth, (req, res) => {
  const newApiKey = uuidv4();
  Users.updateOne({ id: req.user.id }, { apiKey: newApiKey });
  res.json({ apiKey: newApiKey });
});

module.exports = router;
