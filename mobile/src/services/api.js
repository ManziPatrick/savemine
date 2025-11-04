import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper to get auth token
const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (error) {
    return null;
  }
};

// Auth API
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.success && response.data.data.token) {
      await AsyncStorage.setItem('token', response.data.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.success && response.data.data.token) {
      await AsyncStorage.setItem('token', response.data.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response;
  },
  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },
  getProfile: async () => {
    const token = await getAuthToken();
    return api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
};

// Loans API
export const loansAPI = {
  getLoans: async (params = {}) => {
    // Token is automatically added by axios interceptor
    return api.get('/loans', { params });
  },
  getLoan: async (id) => {
    const token = await getAuthToken();
    return api.get(`/loans/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  createLoan: async (loanData) => {
    const token = await getAuthToken();
    return api.post('/loans', loanData, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  updateLoan: async (id, loanData) => {
    const token = await getAuthToken();
    return api.put(`/loans/${id}`, loanData, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  deleteLoan: async (id) => {
    const token = await getAuthToken();
    return api.delete(`/loans/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  addPayment: async (id, paymentData) => {
    const token = await getAuthToken();
    return api.post(`/loans/${id}/payments`, paymentData, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getLoanStats: async () => {
    const token = await getAuthToken();
    return api.get('/loans/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getLoanSources: async () => {
    const token = await getAuthToken();
    return api.get('/loans/sources', {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getOverdueLoans: async () => {
    const token = await getAuthToken();
    return api.get('/loans/overdue', {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
};

// Contacts API
export const contactsAPI = {
  getContacts: async (params = {}) => {
    const token = await getAuthToken();
    return api.get('/contacts', {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getContact: async (id) => {
    const token = await getAuthToken();
    return api.get(`/contacts/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  createContact: async (contactData) => {
    const token = await getAuthToken();
    return api.post('/contacts', contactData, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  updateContact: async (id, contactData) => {
    const token = await getAuthToken();
    return api.put(`/contacts/${id}`, contactData, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  deleteContact: async (id) => {
    const token = await getAuthToken();
    return api.delete(`/contacts/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  searchContacts: async (query, type) => {
    const token = await getAuthToken();
    return api.get('/contacts/search', {
      params: { q: query, type },
      headers: { Authorization: `Bearer ${token}` }
    });
  },
};

// Transactions API
export const transactionsAPI = {
  getTransactions: async (params = {}) => {
    const token = await getAuthToken();
    return api.get('/transactions', {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  createTransaction: async (transactionData) => {
    const token = await getAuthToken();
    return api.post('/transactions', transactionData, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  updateTransaction: async (id, transactionData) => {
    const token = await getAuthToken();
    return api.put(`/transactions/${id}`, transactionData, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  deleteTransaction: async (id) => {
    const token = await getAuthToken();
    return api.delete(`/transactions/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getTransactionStats: async (params = {}) => {
    const token = await getAuthToken();
    return api.get('/transactions/stats', {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });
  },
};

// Savings API
export const savingsAPI = {
  getSavings: async (params = {}) => {
    const token = await getAuthToken();
    return api.get('/savings', {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  createSavings: async (savingsData) => {
    const token = await getAuthToken();
    return api.post('/savings', savingsData, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  updateSavings: async (id, savingsData) => {
    const token = await getAuthToken();
    return api.put(`/savings/${id}`, savingsData, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  deleteSavings: async (id) => {
    const token = await getAuthToken();
    return api.delete(`/savings/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  addAmount: async (id, amount, notes) => {
    const token = await getAuthToken();
    return api.post(`/savings/${id}/add`, { amount, notes }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  withdrawAmount: async (id, amount, notes) => {
    const token = await getAuthToken();
    return api.post(`/savings/${id}/withdraw`, { amount, notes }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getSavingsStats: async () => {
    const token = await getAuthToken();
    return api.get('/savings/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
};

// Expenses API
export const expensesAPI = {
  getExpenses: async (params = {}) => {
    const token = await getAuthToken();
    return api.get('/expenses', {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  createExpense: async (expenseData) => {
    const token = await getAuthToken();
    return api.post('/expenses', expenseData, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getExpenseStats: async (params = {}) => {
    const token = await getAuthToken();
    return api.get('/expenses/stats', {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });
  },
};

