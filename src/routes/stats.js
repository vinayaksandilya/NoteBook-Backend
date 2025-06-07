const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const LoggingService = require('../services/loggingService');

// Get user statistics
router.get('/user', auth, async (req, res) => {
  try {
    const stats = await LoggingService.getUserStats(req.user.id);
    if (!stats) {
      return res.status(404).json({ error: 'User statistics not found' });
    }
    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get model usage statistics
router.get('/model-usage', auth, async (req, res) => {
  try {
    const stats = await LoggingService.getModelUsageStats(req.user.id);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching model usage stats:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get recent activity
router.get('/recent-activity', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const activity = await LoggingService.getRecentActivity(req.user.id, limit);
    res.json(activity);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 