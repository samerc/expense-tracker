const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticateToken } = require('../middleware/auth');
const { requireFeature } = require('../middleware/featureAccess');

// All routes require authentication
router.use(authenticateToken);

// Test endpoint for web access (Pro plan only)
router.get('/web-only-test', 
  requireFeature('web_access'),
  (req, res) => {
    res.json({ 
      message: 'You have web access!',
      plan: req.user.planName || 'unknown'
    });
  }
);

// Basic reports (available on all plans)
router.get('/dashboard', 
  requireFeature('basic_reports'),
  reportsController.getDashboardSummary
);

// Advanced reports (Basic & Pro only)
router.get('/expenses-by-category', 
  requireFeature('advanced_reports'),
  reportsController.getExpensesByCategory
);

router.get('/income-by-category', 
  requireFeature('advanced_reports'),
  reportsController.getIncomeByCategory
);

router.get('/spending-trends', 
  requireFeature('advanced_reports'),
  reportsController.getSpendingTrends
);

router.get('/account-balances', 
  requireFeature('advanced_reports'),
  reportsController.getAccountBalancesOverTime
);

router.get('/top-expenses', 
  requireFeature('advanced_reports'),
  reportsController.getTopExpenses
);

// Export features (Pro only)
router.get('/export/csv', 
  requireFeature('export_csv'),
  reportsController.exportTransactionsCSV
);

// Get transactions for a specific category
router.get('/category/:categoryId/transactions',
  requireFeature('advanced_reports'),
  reportsController.getCategoryTransactions
);

module.exports = router;
