const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all categories
router.get('/', categoriesController.getAllCategories);

// Get single category
router.get('/:id', categoriesController.getCategoryById);

// Get category spending history
router.get('/:id/spending', categoriesController.getCategorySpendingHistory);

// Admin-only routes
router.post('/', requireAdmin, categoriesController.createCategory);
router.put('/:id', requireAdmin, categoriesController.updateCategory);
router.delete('/:id', requireAdmin, categoriesController.deleteCategory);

module.exports = router;
