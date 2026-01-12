const express = require('express');
const router = express.Router();
const householdsController = require('../controllers/householdsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get household info (all users)
router.get('/info', householdsController.getInfo);

// Update household info (admin only)
router.put('/info', requireAdmin, householdsController.updateInfo);

// Get household members (all users)
router.get('/members', householdsController.getMembers);

module.exports = router;
