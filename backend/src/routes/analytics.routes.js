const express = require('express');
const { Links, ClickLogs } = require('../db/db');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

// Get overall analytics for user
router.get('/overview', requireAuth, (req, res) => {
  const userLinks = Links.find({ userId: req.user.id });
  const linkIds = userLinks.map(l => l.id);
  
  const allClicks = ClickLogs.find().filter(c => linkIds.includes(c.linkId));

  const totalLinks = userLinks.length;
  const totalClicks = allClicks.length;

  // Basic growth stat (comparing last 7 days to previous 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const clicksLast7Days = allClicks.filter(c => new Date(c.timestamp) >= sevenDaysAgo).length;
  const clicksPrev7Days = allClicks.filter(c => {
    const d = new Date(c.timestamp);
    return d >= fourteenDaysAgo && d < sevenDaysAgo;
  }).length;

  let growth = 0;
  if (clicksPrev7Days > 0) {
    growth = ((clicksLast7Days - clicksPrev7Days) / clicksPrev7Days) * 100;
  } else if (clicksLast7Days > 0) {
    growth = 100;
  }

  // Daily clicks for the last 7 days (for Recharts)
  const dailyGraph = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateString = date.toISOString().split('T')[0];
    const clicksThatDay = allClicks.filter(c => c.timestamp.startsWith(dateString)).length;
    dailyGraph.push({ name: dateString, clicks: clicksThatDay });
  }

  res.json({
    totalLinks,
    totalClicks,
    growth: Math.round(growth),
    dailyGraph
  });
});

// Get analytics for a specific link
router.get('/:linkId', requireAuth, (req, res) => {
  const { linkId } = req.params;
  const range = String(req.query.range || '7d');
  const link = Links.findOne({ id: linkId, userId: req.user.id });

  if (!link) {
    return res.status(404).json({ error: 'Link not found' });
  }

  const clicks = ClickLogs.find({ linkId });
  const sortedClicks = clicks.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const uniqueClicks = new Set(clicks.map(c => `${c.ip}-${c.device}`)).size;
  const lastActivity = sortedClicks.length ? sortedClicks[sortedClicks.length - 1].timestamp : null;

  // Breakdown by Referrer, Country, Device
  const referrerMap = {};
  const countryMap = {};
  const deviceMap = {};

  clicks.forEach(c => {
    referrerMap[c.referrer] = (referrerMap[c.referrer] || 0) + 1;
    countryMap[c.country] = (countryMap[c.country] || 0) + 1;
    deviceMap[c.device] = (deviceMap[c.device] || 0) + 1;
  });

  const formatMap = (map) => {
    const total = clicks.length || 1;
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, percent: Math.round((value / total) * 100) }))
      .sort((a,b) => b.value - a.value);
  };

  const rangeMap = {
    '7d': { days: 7, step: 1 },
    '30d': { days: 30, step: 1 },
    '90d': { days: 90, step: 3 },
    '1y': { days: 365, step: 7 }
  };
  const selectedRange = rangeMap[range] || rangeMap['7d'];
  const now = new Date();
  const fromDate = new Date(now.getTime() - selectedRange.days * 24 * 60 * 60 * 1000);
  const rangedClicks = clicks.filter(c => new Date(c.timestamp) >= fromDate);
  const dailyGraph = [];
  for (let i = selectedRange.days - 1; i >= 0; i -= selectedRange.step) {
    const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateString = dayStart.toISOString().split('T')[0];
    const dayClicks = rangedClicks.filter(c => c.timestamp.startsWith(dateString)).length;
    dailyGraph.push({ name: dateString, clicks: dayClicks });
  }

  res.json({
    totalClicks: clicks.length,
    uniqueClicks,
    lastActivity,
    range,
    dailyGraph,
    referrers: formatMap(referrerMap),
    countries: formatMap(countryMap),
    devices: formatMap(deviceMap)
  });
});

module.exports = router;
