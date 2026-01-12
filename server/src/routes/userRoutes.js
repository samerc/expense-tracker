const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get user profile
router.get('/profile', usersController.getProfile);

// Update user profile
router.put('/profile', usersController.updateProfile);

// Get user preferences
router.get('/preferences', usersController.getPreferences);

// Update user preferences
router.put('/preferences', usersController.updatePreferences);

// Change password
router.put('/password', usersController.changePassword);

module.exports = router;
