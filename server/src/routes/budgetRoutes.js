const express = require('express');
const router = express.Router();
const budgetsController = require('../controllers/budgetsController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all budgets
router.get('/', budgetsController.getAllBudgets);

// Get budget summary for a month
router.get('/summary/:month', budgetsController.getBudgetSummary);

// Get single budget
router.get('/:id', budgetsController.getBudgetById);

// Create/Update/Delete budgets - any authenticated user
router.post('/', budgetsController.createBudget);
router.put('/:id', budgetsController.updateBudget);
router.delete('/:id', budgetsController.deleteBudget);

module.exports = router;