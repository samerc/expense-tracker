const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// API routes
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const allocationRoutes = require('./routes/allocationRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const householdRoutes = require('./routes/householdRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/households', householdRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/super-admin', superAdminRoutes);

// API info endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Expense Tracker API', 
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      api: 'GET /api',
      
      // Authentication
      login: 'POST /api/auth/login',
      register: 'POST /api/auth/register',
      currentUser: 'GET /api/auth/me',
      
      // Subscriptions (NEW)
      currentSubscription: 'GET /api/subscriptions/current',
      availablePlans: 'GET /api/subscriptions/plans',
      usageLimits: 'GET /api/subscriptions/usage',
      
      // Admin - Plan Management (NEW)
      viewPlans: 'GET /api/admin/plans',
      viewPlan: 'GET /api/admin/plans/:planId',
      updatePlanFeatures: 'PUT /api/admin/plans/:planId/features (admin)',
      createCustomPlan: 'POST /api/admin/plans/custom (admin)',
      assignPlan: 'POST /api/admin/plans/assign (admin)',
      grantUserFeatures: 'POST /api/admin/users/grant-features (admin)',
      
      // Accounts
      accounts: 'GET /api/accounts',
      getAccount: 'GET /api/accounts/:id',
      createAccount: 'POST /api/accounts (admin)',
      updateAccount: 'PUT /api/accounts/:id (admin)',
      adjustBalance: 'POST /api/accounts/:id/adjust-balance (admin)',
      deleteAccount: 'DELETE /api/accounts/:id (admin)',
      
      // Categories
      categories: 'GET /api/categories',
      getCategory: 'GET /api/categories/:id',
      createCategory: 'POST /api/categories (admin)',
      updateCategory: 'PUT /api/categories/:id (admin)',
      deleteCategory: 'DELETE /api/categories/:id (admin)',
      
      // Transactions
      transactions: 'GET /api/transactions (requires: manual_transactions)',
      getTransaction: 'GET /api/transactions/:id',
      createTransaction: 'POST /api/transactions (requires: manual_transactions, checks limit)',
      updateTransaction: 'PUT /api/transactions/:id',
      deleteTransaction: 'DELETE /api/transactions/:id',
      
      // Allocations
      allocations: 'GET /api/allocations',
      getAllocation: 'GET /api/allocations/:id',
      suggestAllocations: 'GET /api/allocations/suggestions',
      createAllocation: 'POST /api/allocations (admin)',
      updateAllocation: 'PUT /api/allocations/:id (admin)',
      deleteAllocation: 'DELETE /api/allocations/:id (admin)',
      
      // Budgets
      budgets: 'GET /api/budgets',
      getBudget: 'GET /api/budgets/:id',
      budgetSummary: 'GET /api/budgets/summary/:month',
      createBudget: 'POST /api/budgets (admin)',
      updateBudget: 'PUT /api/budgets/:id (admin)',
      deleteBudget: 'DELETE /api/budgets/:id (admin)',
      
      // Reports
      dashboard: 'GET /api/reports/dashboard (requires: basic_reports)',
      expensesByCategory: 'GET /api/reports/expenses-by-category (requires: advanced_reports)',
      incomeByCategory: 'GET /api/reports/income-by-category (requires: advanced_reports)',
      spendingTrends: 'GET /api/reports/spending-trends (requires: advanced_reports)',
      accountBalances: 'GET /api/reports/account-balances (requires: advanced_reports)',
      topExpenses: 'GET /api/reports/top-expenses (requires: advanced_reports)',
      exportCSV: 'GET /api/reports/export/csv (requires: export_csv, Pro plan)',

      // Users
      userProfile: 'GET /api/users/profile',
      updateProfile: 'PUT /api/users/profile',
      userPreferences: 'GET /api/users/preferences',
      updatePreferences: 'PUT /api/users/preferences',
      changePassword: 'PUT /api/users/password',
      
      // Households
      householdInfo: 'GET /api/households/info',
      updateHousehold: 'PUT /api/households/info (admin)',
      householdMembers: 'GET /api/households/members',

      // Admin
      adminUsers: 'GET /api/admin/users (admin)',
      updateUserRole: 'PUT /api/admin/users/:userId/role (admin)',
      toggleUserStatus: 'PUT /api/admin/users/:userId/status (admin)',

      // Super Admin
      getAllHouseholds: 'GET /api/super-admin/households (super_admin)',
      getHouseholdDetails: 'GET /api/super-admin/households/:householdId (super_admin)',
      updateHouseholdPlan: 'PUT /api/super-admin/households/:householdId/plan (super_admin)',
      toggleHouseholdStatus: 'PUT /api/super-admin/households/:householdId/status (super_admin)',
      getAllPlans: 'GET /api/super-admin/plans (super_admin)',
      createPlan: 'POST /api/super-admin/plans (super_admin)',
      updatePlan: 'PUT /api/super-admin/plans/:planId (super_admin)',
    },
    
    plans: {
      free: {
        price: '$0',
        features: '200 transactions/month, 1 user, basic reports'
      },
      basic: {
        price: '$2.99/month',
        features: 'Unlimited transactions, 3 users, advanced reports, exports'
      },
      pro: {
        price: '$4.99/month',
        features: 'Everything + web access, bulk import, API access'
      }
    }
  });
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../web-admin/dist');

  // Serve static files
  app.use(express.static(clientBuildPath));

  // Handle React routing - serve index.html for all non-API routes
  app.use((req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // 404 handler for development (API only)
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error' 
  });
});

module.exports = app;