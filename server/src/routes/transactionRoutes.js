const express = require('express');
const router = express.Router();
const transactionsController = require('../controllers/transactionsController');
const { authenticateToken } = require('../middleware/auth');
const { requireFeature, checkTransactionLimit } = require('../middleware/featureAccess');

// All routes require authentication
router.use(authenticateToken);

// Get all transactions (with filters)
router.get('/', transactionsController.getAllTransactions);

// Get single transaction
router.get('/:id', transactionsController.getTransactionById);

// Create transaction - check limit and feature
router.post('/', 
  authenticateToken,
  checkTransactionLimit,
  requireFeature('manual_transactions'),
  transactionsController.createTransaction
);

// Update transaction
router.put('/:id', transactionsController.updateTransaction);

// Delete transaction (soft delete)
router.delete('/:id', transactionsController.deleteTransaction);

module.exports = router;
