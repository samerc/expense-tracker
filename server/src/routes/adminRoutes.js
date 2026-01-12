const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Get all users
router.get('/users', adminController.getAllUsers);

// Update user role
router.put('/users/:userId/role', adminController.updateUserRole);

// Toggle user status
router.put('/users/:userId/status', adminController.toggleUserStatus);

// Invite new user
router.post('/users/invite', adminController.inviteUser);

module.exports = router;