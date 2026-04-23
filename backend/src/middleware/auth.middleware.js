const jwt = require('jsonwebtoken');
const { Users } = require('../db/db');

const requireAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    console.warn('[auth][middleware] Missing authorization token', {
      method: req.method,
      path: req.originalUrl
    });
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = Users.findOne({ id: decoded.userId });

    if (!user) {
      console.warn('[auth][middleware] Token user not found', { userId: decoded.userId });
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.warn('[auth][middleware] Invalid token', {
      method: req.method,
      path: req.originalUrl,
      error: err.message
    });
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { requireAuth, requireAdmin };
