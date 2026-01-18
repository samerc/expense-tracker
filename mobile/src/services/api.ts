import axios from 'axios';
import Constants from 'expo-constants';

// Toggle this for local development vs production
const USE_LOCAL = true; // Set to true when testing with local backend

// Manual IP override - set this if auto-detection doesn't work (e.g., when using tunnel mode)
// Find your IP: run 'ipconfig' in PowerShell, look for IPv4 Address
const MANUAL_IP = ''; // e.g., '192.168.1.105' - leave empty for auto-detect

// Auto-detect dev machine IP from Expo's debugger host
const getLocalApiUrl = () => {
  // Use manual IP if set
  if (MANUAL_IP) {
    const url = `http://${MANUAL_IP}:3000/api`;
    console.log('[API] Using manual IP:', url);
    return url;
  }

  const debuggerHost = Constants.expoGoConfig?.debuggerHost ?? Constants.manifest?.debuggerHost;
  console.log('[API] debuggerHost:', debuggerHost);

  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    // Check if it's a real IP (not a tunnel URL)
    const isRealIP = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
    if (isRealIP) {
      const url = `http://${host}:3000/api`;
      console.log('[API] Using auto-detected IP:', url);
      return url;
    } else {
      console.log('[API] debuggerHost is tunnel URL, not a local IP. Set MANUAL_IP or use LAN mode.');
    }
  }

  // Fallback for Android emulator
  console.log('[API] Using Android emulator fallback');
  return 'http://10.0.2.2:3000/api';
};

const API_URL = USE_LOCAL ? getLocalApiUrl() : 'https://expense.fancyshark.com/api';
console.log('[API] Final API_URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('Unauthorized');
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  getCurrentUser: () => api.get('/auth/me'),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
};

// ============================================
// ACCOUNTS API
// ============================================
export const accountsAPI = {
  getAll: () => api.get('/accounts'),
  getById: (id: string) => api.get(`/accounts/${id}`),
  create: (data: any) => api.post('/accounts', data),
  update: (id: string, data: any) => api.put(`/accounts/${id}`, data),
  delete: (id: string) => api.delete(`/accounts/${id}`),
  adjustBalance: (id: string, data: any) =>
    api.post(`/accounts/${id}/adjust-balance`, data),
};

// ============================================
// CATEGORIES API
// ============================================
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getById: (id: string) => api.get(`/categories/${id}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// ============================================
// TRANSACTIONS API
// ============================================
export const transactionsAPI = {
  getAll: (params?: any) => api.get('/transactions', { params }),
  getById: (id: string) => api.get(`/transactions/${id}`),
  create: (data: any) => api.post('/transactions', data),
  update: (id: string, data: any) => api.put(`/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
};

// ============================================
// ALLOCATIONS API (Budgets)
// ============================================
export const allocationsAPI = {
  getAll: (month: string) => api.get('/allocations', { params: { month } }),
  getUnallocated: (month: string) =>
    api.get('/allocations/unallocated', { params: { month } }),
  upsert: (data: any) => api.post('/allocations', data),
  fund: (month: string, funding: any[]) =>
    api.post('/allocations/fund', { month, funding }),
  move: (fromId: string, toId: string, amount: number) =>
    api.post('/allocations/move', {
      fromAllocationId: fromId,
      toAllocationId: toId,
      amount,
    }),
  delete: (id: string) => api.delete(`/allocations/${id}`),
  getTransactions: (allocationId: string) =>
    api.get(`/allocations/${allocationId}/transactions`),
};

// ============================================
// REPORTS API
// ============================================
export const reportsAPI = {
  getExpenseByCategory: (startDate: string, endDate: string) =>
    api.get('/reports/expenses-by-category', { params: { startDate, endDate } }),
  getIncomeByCategory: (startDate: string, endDate: string) =>
    api.get('/reports/income-by-category', { params: { startDate, endDate } }),
  getSpendingTrends: (startDate: string, endDate: string) =>
    api.get('/reports/spending-trends', { params: { startDate, endDate } }),
  getAccountBalances: () => api.get('/reports/account-balances'),
};

// ============================================
// USER API
// ============================================
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  getPreferences: () => api.get('/users/preferences'),
  updatePreferences: (data: any) => api.put('/users/preferences', data),
  changePassword: (data: any) => api.put('/users/password', data),
};

// ============================================
// HOUSEHOLD API
// ============================================
export const householdAPI = {
  getInfo: () => api.get('/households/info'),
  updateInfo: (data: any) => api.put('/households/info', data),
  getMembers: () => api.get('/households/members'),
};

// ============================================
// EXCHANGE RATE API
// ============================================
export const exchangeRateAPI = {
  getRate: (from: string, to: string) =>
    axios.get(`https://api.frankfurter.app/latest?from=${from}&to=${to}`),
  getLatest: (baseCurrency = 'USD') =>
    axios.get(`https://api.frankfurter.app/latest?from=${baseCurrency}`),
};

// Helper to set auth token
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;
