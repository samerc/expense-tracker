const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

// All routes require authentication and super admin role
router.use(authenticateToken);
router.use(requireSuperAdmin);

// Households management
router.get('/households', superAdminController.getAllHouseholds);
router.post('/households', superAdminController.createHousehold);
router.get('/households/:householdId', superAdminController.getHouseholdDetails);
router.put('/households/:householdId', superAdminController.updateHousehold);
router.put('/households/:householdId/plan', superAdminController.updateHouseholdPlan);
router.put('/households/:householdId/status', superAdminController.toggleHouseholdStatus);

// Users management
router.post('/users', superAdminController.createUser);
router.put('/users/:userId', superAdminController.updateUser);
router.delete('/users/:userId', superAdminController.deleteUser);
router.post('/users/:userId/reset-password', superAdminController.resetUserPassword);

// Plans management
router.get('/plans', superAdminController.getAllPlans);
router.post('/plans', superAdminController.createPlan);
router.put('/plans/:planId', superAdminController.updatePlan);

module.exports = router;
