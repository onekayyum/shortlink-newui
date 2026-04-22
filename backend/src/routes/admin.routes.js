const express = require('express');
const { Users, Links, ClickLogs, Settings } = require('../db/db');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

// Dashboard stats
router.get('/stats', (req, res) => {
  const users = Users.find();
  const links = Links.find();
  const clicks = ClickLogs.find();

  res.json({
    totalUsers: users.length,
    totalLinks: links.length,
    totalClicks: clicks.length
  });
});

// User Management
router.get('/users', (req, res) => {
  const users = Users.find().map(u => {
    const userObj = { ...u };
    delete userObj.password;
    return userObj;
  });
  res.json({ users });
});

router.post('/users/:id/ban', (req, res) => {
  const user = Users.updateOne({ id: req.params.id }, { status: 'banned' });
  res.json({ message: 'User banned successfully', user });
});

router.post('/users/:id/unban', (req, res) => {
  const user = Users.updateOne({ id: req.params.id }, { status: 'active' });
  res.json({ message: 'User unbanned successfully', user });
});

router.delete('/users/:id', (req, res) => {
  // Delete user's links and clicks too
  const userLinks = Links.find({ userId: req.params.id });
  userLinks.forEach(l => {
    ClickLogs.deleteMany({ linkId: l.id });
  });
  Links.deleteMany({ userId: req.params.id });
  Users.deleteOne({ id: req.params.id });
  
  res.json({ message: 'User and associated data deleted successfully' });
});

// All Links Management
router.get('/links', (req, res) => {
  const links = Links.find();
  res.json({ links });
});

router.delete('/links/:id', (req, res) => {
  ClickLogs.deleteMany({ linkId: req.params.id });
  Links.deleteOne({ id: req.params.id });
  res.json({ message: 'Link deleted successfully' });
});

// Settings / SMTP Controls
router.get('/settings', (req, res) => {
  let settings = Settings.findOne({ id: 'global_settings' });
  if (!settings) {
    settings = Settings.create({
      id: 'global_settings',
      smtp: {
        enabled: false,
        host: '',
        port: 587,
        email: '',
        password: ''
      },
      features: {
        publicRegistration: true
      }
    });
  }
  res.json({ settings });
});

router.put('/settings', (req, res) => {
  const { smtp, features } = req.body;
  if (!smtp || !features || typeof smtp !== 'object' || typeof features !== 'object') {
    return res.status(400).json({ error: 'Invalid settings format' });
  }

  let settings = Settings.findOne({ id: 'global_settings' });
  
  if (!settings) {
    settings = Settings.create({ id: 'global_settings', smtp, features });
  } else {
    settings = Settings.updateOne({ id: 'global_settings' }, { smtp, features });
  }
  
  res.json({ settings });
});

module.exports = router;
