import axios from 'axios';

// API base URL - in production, use relative path (same origin)
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API
// ============================================

export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  register: (data) =>
    api.post('/auth/register', data),

  getCurrentUser: () =>
    api.get('/auth/me'),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token, password) =>
    api.post('/auth/reset-password', { token, password }),
};

// ============================================
// SUBSCRIPTION API
// ============================================

export const subscriptionAPI = {
  getCurrent: () => 
    api.get('/subscriptions/current'),
  
  getPlans: () => 
    api.get('/subscriptions/plans'),
  
  getUsage: () => 
    api.get('/subscriptions/usage'),
};

// ============================================
// ACCOUNTS API
// ============================================

export const accountsAPI = {
  getAll: () => 
    api.get('/accounts'),
  
  getById: (id) => 
    api.get(`/accounts/${id}`),
  
  create: (data) => 
    api.post('/accounts', data),
  
  update: (id, data) => 
    api.put(`/accounts/${id}`, data),
  
  delete: (id) => 
    api.delete(`/accounts/${id}`),
  
  adjustBalance: (id, data) => 
    api.post(`/accounts/${id}/adjust-balance`, data),
};

// ============================================
// CATEGORIES API
// ============================================

export const categoriesAPI = {
  getAll: () =>
    api.get('/categories'),

  getById: (id) =>
    api.get(`/categories/${id}`),

  getSpendingHistory: (id, months = 12) =>
    api.get(`/categories/${id}/spending`, { params: { months } }),

  create: (data) =>
    api.post('/categories', data),

  update: (id, data) =>
    api.put(`/categories/${id}`, data),

  delete: (id) =>
    api.delete(`/categories/${id}`),
};

// ============================================
// TRANSACTIONS API
// ============================================

export const transactionsAPI = {
  getAll: (params) => 
    api.get('/transactions', { params }),
  
  getById: (id) => 
    api.get(`/transactions/${id}`),
  
  create: (data) => 
    api.post('/transactions', data),
  
  update: (id, data) => 
    api.put(`/transactions/${id}`, data),
  
  delete: (id) => 
    api.delete(`/transactions/${id}`),
};

// ============================================
// BUDGETS API
// ============================================

export const budgetsAPI = {
  getAll: (params) => 
    api.get('/budgets', { params }),
  
  getById: (id) => 
    api.get(`/budgets/${id}`),
  
  getSummary: (month) => 
    api.get(`/budgets/summary/${month}`),
  
  create: (data) => 
    api.post('/budgets', data),
  
  update: (id, data) => 
    api.put(`/budgets/${id}`, data),
  
  delete: (id) => 
    api.delete(`/budgets/${id}`),
};

// ============================================
// ALLOCATIONS API
// ============================================

export const allocationsAPI = {
  getAll: (month) => 
    api.get(`/allocations?month=${month}`),
  
  getUnallocated: (month) => 
    api.get(`/allocations/unallocated?month=${month}`),
  
  upsert: (data) => 
    api.post('/allocations', data),
  
  fund: (month, funding) => 
    api.post('/allocations/fund', { month, funding }),
  
  move: (fromId, toId, amount) => 
    api.post('/allocations/move', { fromAllocationId: fromId, toAllocationId: toId, amount }), // ADD THIS
  
  delete: (id) => 
    api.delete(`/allocations/${id}`),

  getTransactions: (allocationId) =>
    api.get(`/allocations/${allocationId}/transactions`),

};

// ============================================
// REPORTS API
// ============================================

export const reportsAPI = {
  getExpenseByCategory: (startDate, endDate) => 
    api.get('/reports/expenses-by-category', { params: { startDate, endDate } }),
  getIncomeByCategory: (startDate, endDate) => 
    api.get('/reports/income-by-category', { params: { startDate, endDate } }),
  getSpendingTrends: (startDate, endDate) => 
    api.get('/reports/spending-trends', { params: { startDate, endDate } }),
  getCategoryTransactions: (categoryId, startDate, endDate) => 
    api.get(`/reports/category/${categoryId}/transactions`, { params: { startDate, endDate } }),
  getAccountBalances: () => api.get('/reports/account-balances'),
  getTopExpenses: (startDate, endDate) => 
    api.get('/reports/top-expenses', { params: { startDate, endDate } }),
  exportCSV: (startDate, endDate) => 
    api.get('/reports/export/csv', { params: { startDate, endDate }, responseType: 'blob' }),
};

// ============================================
// ADMIN API
// ============================================

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getPreferences: () => api.get('/users/preferences'),
  updatePreferences: (data) => api.put('/users/preferences', data),
  changePassword: (data) => api.put('/users/password', data),
};

export const householdAPI = {
  getInfo: () => api.get('/households/info'),
  updateInfo: (data) => api.put('/households/info', data),
  getMembers: () => api.get('/households/members'),
};

export const adminAPI = {
  updateUserRole: (userId, data) => api.put(`/admin/users/${userId}/role`, data),
  toggleUserStatus: (userId, isActive) => api.put(`/admin/users/${userId}/status`, { isActive }),
  getAllUsers: () => api.get('/admin/users'),
  getHouseholdStats: () => api.get('/admin/stats'),
  inviteUser: (data) => api.post('/admin/users/invite', data),
};

// ============================================
// SUPER ADMIN API
// ============================================

export const superAdminAPI = {
  // Households
  getAllHouseholds: () => api.get('/super-admin/households'),
  createHousehold: (data) => api.post('/super-admin/households', data),
  getHouseholdDetails: (householdId) => api.get(`/super-admin/households/${householdId}`),
  updateHousehold: (householdId, data) => api.put(`/super-admin/households/${householdId}`, data),
  updateHouseholdPlan: (householdId, data) => api.put(`/super-admin/households/${householdId}/plan`, data),
  toggleHouseholdStatus: (householdId, status) => api.put(`/super-admin/households/${householdId}/status`, { status }),

  // Users
  createUser: (data) => api.post('/super-admin/users', data),
  updateUser: (userId, data) => api.put(`/super-admin/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/super-admin/users/${userId}`),
  resetUserPassword: (userId) => api.post(`/super-admin/users/${userId}/reset-password`),

  // Plans
  getAllPlans: () => api.get('/super-admin/plans'),
  createPlan: (data) => api.post('/super-admin/plans', data),
  updatePlan: (planId, data) => api.put(`/super-admin/plans/${planId}`, data),
};

// ============================================
// EXCHANGE RATE API (Frankfurter - free, no auth)
// ============================================

export const exchangeRateAPI = {
  // Get rate between two currencies
  getRate: (from, to) =>
    axios.get(`https://api.frankfurter.app/latest?from=${from}&to=${to}`),

  // Get all rates for a base currency
  getLatest: (baseCurrency = 'USD') =>
    axios.get(`https://api.frankfurter.app/latest?from=${baseCurrency}`),

  // Get available currencies
  getCurrencies: () =>
    axios.get('https://api.frankfurter.app/currencies'),
};

export default api;
