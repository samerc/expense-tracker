const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

// All routes require authentication and super admin role
router.use(authenticateToken);
router.use(requireSuperAdmin);

// Households management
router.get('/households', superAdminController.getAllHouseholds);
router.get('/households/:householdId', superAdminController.getHouseholdDetails);
router.put('/households/:householdId/plan', superAdminController.updateHouseholdPlan);
router.put('/households/:householdId/status', superAdminController.toggleHouseholdStatus);

// Plans management
router.get('/plans', superAdminController.getAllPlans);
router.post('/plans', superAdminController.createPlan);
router.put('/plans/:planId', superAdminController.updatePlan);

module.exports = router;
