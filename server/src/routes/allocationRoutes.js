const express = require('express');
const router = express.Router();
const allocationsController = require('../controllers/allocationsController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get allocations for a month
router.get('/', allocationsController.getAllocations);

// Get unallocated categories
router.get('/unallocated', allocationsController.getUnallocatedCategories);

// Create or update allocation (budget plan)
router.post('/', allocationsController.upsertAllocation);

// Fund allocations with income
router.post('/fund', allocationsController.fundAllocations);

// Move money between allocations
router.post('/move', allocationsController.moveAllocation);

// Delete allocation
router.delete('/:id', allocationsController.deleteAllocation);

// Get transactions for an allocation
router.get('/:allocationId/transactions', allocationsController.getAllocationTransactions);

module.exports = router;