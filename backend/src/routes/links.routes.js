const express = require('express');
const { body, validationResult } = require('express-validator');
const { Links } = require('../db/db');
const { requireAuth } = require('../middleware/auth.middleware');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

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

const linkMutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: 'Too many link update requests, please try again later.' }
});

const isActiveLink = (link) => !link.deletedAt && link.status !== 'deleted';

const sanitizeLinkForResponse = (link) => ({
  ...link,
  status: !isActiveLink(link) ? 'deleted' : (link.settings?.hasPassword ? 'protected' : (link.settings?.expiry && new Date(link.settings.expiry) < new Date() ? 'expired' : 'active'))
});

// Get all links for the logged-in user
router.get('/', requireAuth, (req, res) => {
  const { q = '', sortBy = 'time', order = 'desc', page = '1', limit = '50' } = req.query;
  const searchQuery = String(q).trim().toLowerCase();
  const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 100);

  let userLinks = Links.find({ userId: req.user.id }).filter(isActiveLink);

  if (searchQuery) {
    userLinks = userLinks.filter((link) => {
      const slug = (link.slug || '').toLowerCase();
      const originalUrl = (link.originalUrl || '').toLowerCase();
      const shortCode = (link.shortCode || '').toLowerCase();
      return slug.includes(searchQuery) || originalUrl.includes(searchQuery) || shortCode.includes(searchQuery);
    });
  }

  const direction = String(order).toLowerCase() === 'asc' ? 1 : -1;
  userLinks.sort((a, b) => {
    if (sortBy === 'views') return ((a.clicks || 0) - (b.clicks || 0)) * direction;
    return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
  });

  const total = userLinks.length;
  const start = (pageNum - 1) * limitNum;
  const paginated = userLinks.slice(start, start + limitNum).map(sanitizeLinkForResponse);

  res.json({
    links: paginated,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(Math.ceil(total / limitNum), 1)
    }
  });
});

router.get('/:id', requireAuth, (req, res) => {
  const link = Links.findOne({ id: req.params.id, userId: req.user.id });
  if (!link || !isActiveLink(link)) return res.status(404).json({ error: 'Link not found' });
  res.json({ link: sanitizeLinkForResponse(link) });
});

// Create a new short link
router.post('/', requireAuth, [
  body('originalUrl').trim().notEmpty().withMessage('Valid URL is required')
], linkMutationLimiter, (req, res) => {
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
  if (slug) {
    const existing = Links.find({ userId: req.user.id }).find((l) => isActiveLink(l) && (l.slug || '') === slug);
    if (existing) {
      return res.status(400).json({ error: 'Custom slug already exists for your account' });
    }
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
    clicks: 0,
    status: 'active',
    deletedAt: null
  });

  res.status(201).json({ link: sanitizeLinkForResponse(newLink) });
});

// Edit a link
router.put('/:id', requireAuth, [
  body('originalUrl').optional({ checkFalsy: true }).trim().notEmpty().withMessage('Valid URL is required'),
  body('customSlug').optional({ nullable: true }),
], linkMutationLimiter, (req, res) => {
  const link = Links.findOne({ id: req.params.id, userId: req.user.id });
  if (!link || !isActiveLink(link)) {
    return res.status(404).json({ error: 'Link not found' });
  }

  const { originalUrl, customSlug, password, expiry, geoTargeting, deviceTargeting } = req.body;
  const update = {};

  if (typeof originalUrl === 'string' && originalUrl.trim()) {
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
    update.originalUrl = normalizedOriginalUrl;
  }

  if (customSlug !== undefined) {
    const slug = customSlug ? String(customSlug).trim() : '';
    if (slug && !/^[a-zA-Z0-9-]{2,50}$/.test(slug)) {
      return res.status(400).json({ error: 'Custom slug can only include letters, numbers, and hyphens' });
    }
    const existing = Links.find({ userId: req.user.id }).find((l) => l.id !== link.id && isActiveLink(l) && (l.slug || '') === slug);
    if (existing) {
      return res.status(400).json({ error: 'Custom slug already exists for your account' });
    }

    // Safe rotation: when slug changes, rotate unique ID so old short URL stops resolving.
    const hasSlugChanged = (link.slug || '') !== slug;
    if (hasSlugChanged) {
      let uniqueId = '';
      let isUnique = false;
      while (!isUnique) {
        uniqueId = generateShortId(7);
        if (!Links.findOne({ uniqueId }) && !Links.findOne({ shortCode: uniqueId })) {
          isUnique = true;
        }
      }
      update.slug = slug || null;
      update.uniqueId = uniqueId;
      update.shortCode = slug ? `${slug}/${uniqueId}` : uniqueId;
    }
  }

  const nextSettings = { ...(link.settings || {}) };
  if (password !== undefined) {
    if (password) {
      nextSettings.password = crypto.createHash('sha256').update(password).digest('hex');
      nextSettings.hasPassword = true;
    } else {
      nextSettings.password = null;
      nextSettings.hasPassword = false;
    }
  }
  if (expiry !== undefined) {
    if (expiry) {
      const expiryDate = new Date(expiry);
      if (Number.isNaN(expiryDate.getTime())) {
        return res.status(400).json({ error: 'Expiry must be a valid date' });
      }
      nextSettings.expiry = expiry;
    } else {
      nextSettings.expiry = null;
    }
  }
  if (geoTargeting !== undefined) nextSettings.geoTargeting = Array.isArray(geoTargeting) ? geoTargeting : [];
  if (deviceTargeting !== undefined) nextSettings.deviceTargeting = typeof deviceTargeting === 'object' && deviceTargeting !== null ? deviceTargeting : {};
  update.settings = nextSettings;

  const updated = Links.updateOne({ id: link.id, userId: req.user.id }, update);
  res.json({ link: sanitizeLinkForResponse(updated) });
});

// Delete a link
router.delete('/:id', requireAuth, (req, res) => {
  const link = Links.findOne({ id: req.params.id, userId: req.user.id });
  
  if (!link || !isActiveLink(link)) {
    return res.status(404).json({ error: 'Link not found' });
  }

  Links.updateOne({ id: req.params.id, userId: req.user.id }, {
    status: 'deleted',
    deletedAt: new Date().toISOString()
  });
  res.json({ message: 'Link deleted successfully' });
});

module.exports = router;
