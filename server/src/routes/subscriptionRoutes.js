const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get current subscription
router.get('/current', subscriptionController.getCurrentSubscription);

// Get available plans (for upgrade)
router.get('/plans', subscriptionController.getAvailablePlans);

// Get usage limits
router.get('/usage', subscriptionController.checkUsageLimits);

module.exports = router;
