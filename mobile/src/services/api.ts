import axios from 'axios';

const API_URL = 'https://expense.fancyshark.com/api';

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

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
};

export const transactionsAPI = {
  getAll: (params?: any) => api.get('/transactions', { params }),
  create: (data: any) => api.post('/transactions', data),
};

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

export const accountsAPI = {
  getAll: () => api.get('/accounts'),
};

export default api;
