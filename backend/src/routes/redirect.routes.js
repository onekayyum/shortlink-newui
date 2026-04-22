const express = require('express');
const { Links, ClickLogs } = require('../db/db');
const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');
const crypto = require('crypto');

const router = express.Router();

// Simple in-memory store to prevent double counting
// In production, Redis with TTL is preferred
const recentClicks = new Map();

// Clean up recent clicks every 10 seconds to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of recentClicks.entries()) {
    if (now - timestamp > 5000) {
      recentClicks.delete(key);
    }
  }
}, 10000);

router.get('/:shortCode', (req, res) => {
  const { shortCode } = req.params;
  const link = Links.findOne({ shortCode });

  if (!link) {
    return res.status(404).send('Link not found');
  }

  // 1. Check Expiry
  if (link.settings?.expiry) {
    const expiryDate = new Date(link.settings.expiry);
    if (new Date() > expiryDate) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(302, `${frontendUrl}/expired`);
    }
  }

  // 2. Check Password Protection
  if (link.settings?.hasPassword) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(302, `${frontendUrl}/protected/${shortCode}`);
  }

  // Proceed to redirect & track analytics
  handleRedirect(req, res, link);
});

router.post('/:shortCode/verify', (req, res) => {
  const { shortCode } = req.params;
  const { password } = req.body;
  const link = Links.findOne({ shortCode });

  if (!link) return res.status(404).json({ error: 'Link not found' });

  if (link.settings?.hasPassword) {
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    if (hashedPassword !== link.settings.password) {
      return res.status(403).json({ error: 'Incorrect password' });
    }
  }

  // If password correct, return the target URL so frontend can redirect
  // Or handle the redirect directly here and track analytics
  handleRedirect(req, res, link, true);
});

function handleRedirect(req, res, link, isPost = false) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  const referrer = req.headers['referer'] || req.headers['referrer'] || 'Direct';

  // Deduplication to prevent double counting bug
  const clickId = `${ip}-${link.shortCode}`;
  const lastClickTime = recentClicks.get(clickId);
  const now = Date.now();
  
  if (!lastClickTime || now - lastClickTime > 2000) {
    recentClicks.set(clickId, now);

    // Parse User Agent
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    const device = result.device.type || 'desktop';
    const os = result.os.name || 'Unknown';

    // Parse GeoIP
    const geo = geoip.lookup(ip);
    const country = geo ? geo.country : 'Unknown';

    // Log Click
    ClickLogs.create({
      linkId: link.id,
      timestamp: new Date().toISOString(),
      ip,
      country,
      device,
      os,
      referrer
    });

    // Update total clicks on link
    Links.updateOne({ id: link.id }, { clicks: (link.clicks || 0) + 1 });
  }

  // Evaluate Targeting
  let targetUrl = link.originalUrl;

  // Geo Targeting
  if (link.settings?.geoTargeting && link.settings.geoTargeting.length > 0) {
    const geo = geoip.lookup(ip);
    const country = geo ? geo.country : null;
    const rule = link.settings.geoTargeting.find(g => g.country === country);
    if (rule && rule.url) {
      targetUrl = rule.url;
    }
  }

  // Device Targeting
  if (link.settings?.deviceTargeting) {
    const parser = new UAParser(userAgent);
    const deviceType = parser.getResult().device.type || 'desktop';
    if (deviceType === 'mobile' && link.settings.deviceTargeting.mobile) {
      targetUrl = link.settings.deviceTargeting.mobile;
    } else if (deviceType === 'desktop' && link.settings.deviceTargeting.desktop) {
      targetUrl = link.settings.deviceTargeting.desktop;
    }
  }

  if (isPost) {
    // If it was a POST request to verify password, return URL as JSON
    return res.json({ targetUrl });
  }

  // Standard redirect
  res.redirect(302, targetUrl);
}

module.exports = router;
