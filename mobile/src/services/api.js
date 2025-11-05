import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineApiCall } from './offlineSync';

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
    return api.get('/auth/me');
  },
  updateProfile: async (userData) => {
    return api.put('/auth/me', userData);
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
    return offlineApiCall(
      () => api.post('/loans', loanData, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      {
        type: 'create',
        resourceType: 'loan',
        endpoint: '/loans',
        method: 'POST',
        data: loanData,
      }
    );
  },
  updateLoan: async (id, loanData) => {
    const token = await getAuthToken();
    return offlineApiCall(
      () => api.put(`/loans/${id}`, loanData, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      {
        type: 'update',
        resourceType: 'loan',
        resourceId: id,
        endpoint: `/loans/${id}`,
        method: 'PUT',
        data: loanData,
        id,
      }
    );
  },
  deleteLoan: async (id) => {
    const token = await getAuthToken();
    return offlineApiCall(
      () => api.delete(`/loans/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      {
        type: 'delete',
        resourceType: 'loan',
        resourceId: id,
        endpoint: `/loans/${id}`,
        method: 'DELETE',
        id,
      }
    );
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
    return offlineApiCall(
      () => api.post('/contacts', contactData, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      {
        type: 'create',
        resourceType: 'contact',
        endpoint: '/contacts',
        method: 'POST',
        data: contactData,
      }
    );
  },
  updateContact: async (id, contactData) => {
    const token = await getAuthToken();
    return offlineApiCall(
      () => api.put(`/contacts/${id}`, contactData, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      {
        type: 'update',
        resourceType: 'contact',
        resourceId: id,
        endpoint: `/contacts/${id}`,
        method: 'PUT',
        data: contactData,
        id,
      }
    );
  },
  deleteContact: async (id) => {
    const token = await getAuthToken();
    return offlineApiCall(
      () => api.delete(`/contacts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      {
        type: 'delete',
        resourceType: 'contact',
        resourceId: id,
        endpoint: `/contacts/${id}`,
        method: 'DELETE',
        id,
      }
    );
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
    return offlineApiCall(
      () => api.post('/transactions', transactionData, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      {
        type: 'create',
        resourceType: 'transaction',
        endpoint: '/transactions',
        method: 'POST',
        data: transactionData,
      }
    );
  },
  updateTransaction: async (id, transactionData) => {
    const token = await getAuthToken();
    return offlineApiCall(
      () => api.put(`/transactions/${id}`, transactionData, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      {
        type: 'update',
        resourceType: 'transaction',
        resourceId: id,
        endpoint: `/transactions/${id}`,
        method: 'PUT',
        data: transactionData,
        id,
      }
    );
  },
  deleteTransaction: async (id) => {
    const token = await getAuthToken();
    return offlineApiCall(
      () => api.delete(`/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      {
        type: 'delete',
        resourceType: 'transaction',
        resourceId: id,
        endpoint: `/transactions/${id}`,
        method: 'DELETE',
        id,
      }
    );
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
  getSaving: async (id) => {
    const token = await getAuthToken();
    return api.get(`/savings/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  createSavings: async (savingsData) => {
    const token = await getAuthToken();
    return offlineApiCall(
      () => api.post('/savings', savingsData, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      {
        type: 'create',
        resourceType: 'savings',
        endpoint: '/savings',
        method: 'POST',
        data: savingsData,
      }
    );
  },
  updateSavings: async (id, savingsData) => {
    const token = await getAuthToken();
    return offlineApiCall(
      () => api.put(`/savings/${id}`, savingsData, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      {
        type: 'update',
        resourceType: 'savings',
        resourceId: id,
        endpoint: `/savings/${id}`,
        method: 'PUT',
        data: savingsData,
        id,
      }
    );
  },
  deleteSavings: async (id) => {
    const token = await getAuthToken();
    return offlineApiCall(
      () => api.delete(`/savings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      {
        type: 'delete',
        resourceType: 'savings',
        resourceId: id,
        endpoint: `/savings/${id}`,
        method: 'DELETE',
        id,
      }
    );
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
    return api.get('/expenses', { params });
  },
  getExpense: async (id) => {
    return api.get(`/expenses/${id}`);
  },
  createExpense: async (expenseData) => {
    return offlineApiCall(
      () => api.post('/expenses', expenseData),
      {
        type: 'create',
        resourceType: 'expense',
        endpoint: '/expenses',
        method: 'POST',
        data: expenseData,
      }
    );
  },
  updateExpense: async (id, expenseData) => {
    return offlineApiCall(
      () => api.put(`/expenses/${id}`, expenseData),
      {
        type: 'update',
        resourceType: 'expense',
        resourceId: id,
        endpoint: `/expenses/${id}`,
        method: 'PUT',
        data: expenseData,
        id,
      }
    );
  },
  deleteExpense: async (id) => {
    return offlineApiCall(
      () => api.delete(`/expenses/${id}`),
      {
        type: 'delete',
        resourceType: 'expense',
        resourceId: id,
        endpoint: `/expenses/${id}`,
        method: 'DELETE',
        id,
      }
    );
  },
  getExpenseStats: async (params = {}) => {
    return api.get('/expenses/stats', { params });
  },
};

// Assets API
export const assetsAPI = {
  getAssets: async (params = {}) => {
    return api.get('/assets', { params });
  },
  getAsset: async (id) => {
    return api.get(`/assets/${id}`);
  },
  createAsset: async (assetData) => {
    return offlineApiCall(
      () => api.post('/assets', assetData),
      {
        type: 'create',
        resourceType: 'asset',
        endpoint: '/assets',
        method: 'POST',
        data: assetData,
      }
    );
  },
  updateAsset: async (id, assetData) => {
    return offlineApiCall(
      () => api.put(`/assets/${id}`, assetData),
      {
        type: 'update',
        resourceType: 'asset',
        resourceId: id,
        endpoint: `/assets/${id}`,
        method: 'PUT',
        data: assetData,
        id,
      }
    );
  },
  deleteAsset: async (id) => {
    return offlineApiCall(
      () => api.delete(`/assets/${id}`),
      {
        type: 'delete',
        resourceType: 'asset',
        resourceId: id,
        endpoint: `/assets/${id}`,
        method: 'DELETE',
        id,
      }
    );
  },
  updateValue: async (id, value, depreciationRate) => {
    return api.post(`/assets/${id}/update-value`, { value, depreciationRate });
  },
  getAssetStats: async () => {
    return api.get('/assets/stats');
  },
};

// Investments API
export const investmentsAPI = {
  getInvestments: async (params = {}) => {
    return api.get('/investments', { params });
  },
  getInvestment: async (id) => {
    return api.get(`/investments/${id}`);
  },
  createInvestment: async (investmentData) => {
    return offlineApiCall(
      () => api.post('/investments', investmentData),
      {
        type: 'create',
        resourceType: 'investment',
        endpoint: '/investments',
        method: 'POST',
        data: investmentData,
      }
    );
  },
  updateInvestment: async (id, investmentData) => {
    return offlineApiCall(
      () => api.put(`/investments/${id}`, investmentData),
      {
        type: 'update',
        resourceType: 'investment',
        resourceId: id,
        endpoint: `/investments/${id}`,
        method: 'PUT',
        data: investmentData,
        id,
      }
    );
  },
  deleteInvestment: async (id) => {
    return offlineApiCall(
      () => api.delete(`/investments/${id}`),
      {
        type: 'delete',
        resourceType: 'investment',
        resourceId: id,
        endpoint: `/investments/${id}`,
        method: 'DELETE',
        id,
      }
    );
  },
  updateValue: async (id, value, notes) => {
    return api.post(`/investments/${id}/update-value`, { value, notes });
  },
  addDividend: async (id, amount, type, notes) => {
    return api.post(`/investments/${id}/dividends`, { amount, type, notes });
  },
  getInvestmentStats: async () => {
    return api.get('/investments/stats');
  },
};

// Business API
export const businessesAPI = {
  getBusinesses: async (params = {}) => {
    return api.get('/businesses', { params });
  },
  getBusiness: async (id) => {
    return api.get(`/businesses/${id}`);
  },
  createBusiness: async (businessData) => {
    return offlineApiCall(
      () => api.post('/businesses', businessData),
      {
        type: 'create',
        resourceType: 'business',
        endpoint: '/businesses',
        method: 'POST',
        data: businessData,
      }
    );
  },
  updateBusiness: async (id, businessData) => {
    return offlineApiCall(
      () => api.put(`/businesses/${id}`, businessData),
      {
        type: 'update',
        resourceType: 'business',
        resourceId: id,
        endpoint: `/businesses/${id}`,
        method: 'PUT',
        data: businessData,
        id,
      }
    );
  },
  deleteBusiness: async (id) => {
    return offlineApiCall(
      () => api.delete(`/businesses/${id}`),
      {
        type: 'delete',
        resourceType: 'business',
        resourceId: id,
        endpoint: `/businesses/${id}`,
        method: 'DELETE',
        id,
      }
    );
  },
  updateProgress: async (id, progress) => {
    return api.post(`/businesses/${id}/progress`, { progress });
  },
  addMonthlyIncome: async (id, month, amount, notes) => {
    return api.post(`/businesses/${id}/income`, { month, amount, notes });
  },
  addMonthlyExpense: async (id, month, amount, category, notes) => {
    return api.post(`/businesses/${id}/expense`, { month, amount, category, notes });
  },
  getBusinessStats: async () => {
    return api.get('/businesses/stats');
  },
};

// Gifts API
export const giftsAPI = {
  getGifts: async (params = {}) => {
    return api.get('/gifts', { params });
  },
  getGift: async (id) => {
    return api.get(`/gifts/${id}`);
  },
  createGift: async (giftData) => {
    return offlineApiCall(
      () => api.post('/gifts', giftData),
      {
        type: 'create',
        resourceType: 'gift',
        endpoint: '/gifts',
        method: 'POST',
        data: giftData,
      }
    );
  },
  updateGift: async (id, giftData) => {
    return offlineApiCall(
      () => api.put(`/gifts/${id}`, giftData),
      {
        type: 'update',
        resourceType: 'gift',
        resourceId: id,
        endpoint: `/gifts/${id}`,
        method: 'PUT',
        data: giftData,
        id,
      }
    );
  },
  deleteGift: async (id) => {
    return offlineApiCall(
      () => api.delete(`/gifts/${id}`),
      {
        type: 'delete',
        resourceType: 'gift',
        resourceId: id,
        endpoint: `/gifts/${id}`,
        method: 'DELETE',
        id,
      }
    );
  },
  getGiftStats: async () => {
    return api.get('/gifts/stats');
  },
};

// Reminders API
export const remindersAPI = {
  getReminders: async (params = {}) => {
    return api.get('/reminders', { params });
  },
  getReminder: async (id) => {
    return api.get(`/reminders/${id}`);
  },
  createReminder: async (reminderData) => {
    return offlineApiCall(
      () => api.post('/reminders', reminderData),
      {
        type: 'create',
        resourceType: 'reminder',
        endpoint: '/reminders',
        method: 'POST',
        data: reminderData,
      }
    );
  },
  updateReminder: async (id, reminderData) => {
    return offlineApiCall(
      () => api.put(`/reminders/${id}`, reminderData),
      {
        type: 'update',
        resourceType: 'reminder',
        resourceId: id,
        endpoint: `/reminders/${id}`,
        method: 'PUT',
        data: reminderData,
        id,
      }
    );
  },
  deleteReminder: async (id) => {
    return offlineApiCall(
      () => api.delete(`/reminders/${id}`),
      {
        type: 'delete',
        resourceType: 'reminder',
        resourceId: id,
        endpoint: `/reminders/${id}`,
        method: 'DELETE',
        id,
      }
    );
  },
  sendReminderNow: async (id) => {
    return api.post(`/reminders/${id}/send`);
  },
  getReminderStats: async () => {
    return api.get('/reminders/stats');
  },
};

// Petty Cash API
export const pettyCashAPI = {
  getPettyCash: async () => {
    return api.get('/petty-cash');
  },
  updatePettyCash: async (data) => {
    return api.put('/petty-cash', data);
  },
  addDeposit: async (data) => {
    return offlineApiCall(
      () => api.post('/petty-cash/deposit', data),
      {
        type: 'create',
        resourceType: 'pettyCash',
        endpoint: '/petty-cash/deposit',
        method: 'POST',
        data,
      }
    );
  },
  makeWithdrawal: async (data) => {
    return offlineApiCall(
      () => api.post('/petty-cash/withdraw', data),
      {
        type: 'create',
        resourceType: 'pettyCash',
        endpoint: '/petty-cash/withdraw',
        method: 'POST',
        data,
      }
    );
  },
  getTransactions: async (params = {}) => {
    return api.get('/petty-cash/transactions', { params });
  },
  getPettyCashStats: async () => {
    return api.get('/petty-cash/stats');
  },
};

