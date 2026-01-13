import axios from 'axios';
import Constants from 'expo-constants';

// Get API URL from app config
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://expense.fancyshark.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - will be handled by AuthContext
      console.log('Unauthorized - token may be expired');
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

  getCurrentUser: () =>
    api.get('/auth/me'),
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
// ALLOCATIONS API
// ============================================

export const allocationsAPI = {
  getAll: (month: string) => api.get(`/allocations?month=${month}`),
  getUnallocated: (month: string) => api.get(`/allocations/unallocated?month=${month}`),
  upsert: (data: any) => api.post('/allocations', data),
  fund: (month: string, funding: any[]) => api.post('/allocations/fund', { month, funding }),
  move: (fromId: string, toId: string, amount: number) =>
    api.post('/allocations/move', { fromAllocationId: fromId, toAllocationId: toId, amount }),
  delete: (id: string) => api.delete(`/allocations/${id}`),
};

// ============================================
// SYNC API (for offline-first sync)
// ============================================

export const syncAPI = {
  push: (deviceId: string, lastSyncAt: string, changes: any[]) =>
    api.post('/sync/push', { deviceId, lastSyncAt, changes }),

  pull: (deviceId: string, since: string) =>
    api.get('/sync/pull', { params: { deviceId, since } }),

  resolveConflict: (recordId: string, recordType: string, chosenVersion: string) =>
    api.post('/sync/resolve-conflict', { recordId, recordType, chosenVersion }),
};

// ============================================
// USER API
// ============================================

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  changePassword: (data: any) => api.put('/users/password', data),
};

// ============================================
// HOUSEHOLD API
// ============================================

export const householdAPI = {
  getInfo: () => api.get('/households/info'),
  getMembers: () => api.get('/households/members'),
};

export default api;
