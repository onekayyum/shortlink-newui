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

const normalizeUrl = (value = '') => {
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

// Get all links for the logged-in user
router.get('/', requireAuth, (req, res) => {
  const userLinks = Links.find({ userId: req.user.id });
  res.json({ links: userLinks });
});

// Create a new short link
router.post('/', requireAuth, [
  body('originalUrl').trim().notEmpty().withMessage('Valid URL is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { originalUrl, customSlug, password, expiry, geoTargeting, deviceTargeting } = req.body;
  const normalizedOriginalUrl = normalizeUrl(originalUrl);
  let parsedUrl;
  try {
    parsedUrl = new URL(normalizedOriginalUrl);
  } catch (err) {
    return res.status(400).json({ error: 'Valid URL is required' });
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return res.status(400).json({ error: 'Valid URL is required' });
  }

  const slug = typeof customSlug === 'string' ? customSlug.trim() : '';
  if (slug && !/^[a-zA-Z0-9-]{2,50}$/.test(slug)) {
    return res.status(400).json({ error: 'Custom slug can only include letters, numbers, and hyphens' });
  }

  // Generate unique ID (6–8 chars). We use 7 chars for compact uniqueness.
  let uniqueId = '';
  let isUnique = false;
  while (!isUnique) {
    uniqueId = generateShortId(7);
    if (!Links.findOne({ uniqueId }) && !Links.findOne({ shortCode: uniqueId })) {
      isUnique = true;
    }
  }
  const shortCode = slug ? `${slug}/${uniqueId}` : uniqueId;

  // Hash password if provided for link protection
  let hashedPassword = null;
  if (password) {
    // Using simple SHA-256 for link password just to avoid plain text. Bcrypt could also be used.
    hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
  }

  const newLink = Links.create({
    userId: req.user.id,
    originalUrl: normalizedOriginalUrl,
    slug: slug || null,
    uniqueId,
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
