const express = require('express');
const router = express.Router();
const accountsController = require('../controllers/accountsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all accounts - any authenticated user
router.get('/', accountsController.getAllAccounts);

// Get single account - any authenticated user
router.get('/:id', accountsController.getAccountById);

// Create/Update/Delete accounts - any authenticated user in the household
// (Users can only manage accounts in their own household, enforced by controller)
router.post('/', accountsController.createAccount);
router.put('/:id', accountsController.updateAccount);
router.delete('/:id', accountsController.deleteAccount);

// Admin-only: Adjust balance directly (bypasses transaction system)
router.post('/:id/adjust-balance', requireAdmin, accountsController.adjustBalance);

module.exports = router;