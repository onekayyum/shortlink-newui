const express = require('express');
const { body, validationResult } = require('express-validator');
const { Links } = require('../db/db');
const { requireAuth } = require('../middleware/auth.middleware');
const crypto = require('crypto');

const router = express.Router();

// Fallback simple ID generator if nanoid isn't available
const generateShortId = (length = 6) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Get all links for the logged-in user
router.get('/', requireAuth, (req, res) => {
  const userLinks = Links.find({ userId: req.user.id });
  res.json({ links: userLinks });
});

// Create a new short link
router.post('/', requireAuth, [
  body('originalUrl').isURL().withMessage('Valid URL is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { originalUrl, customSlug, password, expiry, geoTargeting, deviceTargeting } = req.body;

  let shortCode = customSlug;
  if (shortCode) {
    // Check if custom slug is already taken
    const existing = Links.findOne({ shortCode });
    if (existing) {
      return res.status(400).json({ error: 'Custom slug is already in use' });
    }
  } else {
    // Generate unique short code
    let isUnique = false;
    while (!isUnique) {
      shortCode = generateShortId();
      if (!Links.findOne({ shortCode })) {
        isUnique = true;
      }
    }
  }

  // Hash password if provided for link protection
  let hashedPassword = null;
  if (password) {
    // Using simple SHA-256 for link password just to avoid plain text. Bcrypt could also be used.
    hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
  }

  const newLink = Links.create({
    userId: req.user.id,
    originalUrl,
    shortCode,
    settings: {
      password: hashedPassword,
      hasPassword: !!password,
      expiry: expiry || null,
      geoTargeting: geoTargeting || [], // Array of { country: 'US', url: '...' }
      deviceTargeting: deviceTargeting || {} // { mobile: '...', desktop: '...' }
    },
    clicks: 0
  });

  res.status(201).json({ link: newLink });
});

// Delete a link
router.delete('/:id', requireAuth, (req, res) => {
  const link = Links.findOne({ id: req.params.id, userId: req.user.id });
  
  if (!link) {
    return res.status(404).json({ error: 'Link not found' });
  }

  Links.deleteOne({ id: req.params.id });
  res.json({ message: 'Link deleted successfully' });
});

module.exports = router;
