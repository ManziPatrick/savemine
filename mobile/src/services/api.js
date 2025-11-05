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
  getSaving: async (id) => {
    const token = await getAuthToken();
    return api.get(`/savings/${id}`, {
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
    return api.get('/expenses', { params });
  },
  getExpense: async (id) => {
    return api.get(`/expenses/${id}`);
  },
  createExpense: async (expenseData) => {
    return api.post('/expenses', expenseData);
  },
  updateExpense: async (id, expenseData) => {
    return api.put(`/expenses/${id}`, expenseData);
  },
  deleteExpense: async (id) => {
    return api.delete(`/expenses/${id}`);
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
    return api.post('/assets', assetData);
  },
  updateAsset: async (id, assetData) => {
    return api.put(`/assets/${id}`, assetData);
  },
  deleteAsset: async (id) => {
    return api.delete(`/assets/${id}`);
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
    return api.post('/investments', investmentData);
  },
  updateInvestment: async (id, investmentData) => {
    return api.put(`/investments/${id}`, investmentData);
  },
  deleteInvestment: async (id) => {
    return api.delete(`/investments/${id}`);
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
    return api.post('/businesses', businessData);
  },
  updateBusiness: async (id, businessData) => {
    return api.put(`/businesses/${id}`, businessData);
  },
  deleteBusiness: async (id) => {
    return api.delete(`/businesses/${id}`);
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
    return api.post('/gifts', giftData);
  },
  updateGift: async (id, giftData) => {
    return api.put(`/gifts/${id}`, giftData);
  },
  deleteGift: async (id) => {
    return api.delete(`/gifts/${id}`);
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
    return api.post('/reminders', reminderData);
  },
  updateReminder: async (id, reminderData) => {
    return api.put(`/reminders/${id}`, reminderData);
  },
  deleteReminder: async (id) => {
    return api.delete(`/reminders/${id}`);
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
    return api.post('/petty-cash/deposit', data);
  },
  makeWithdrawal: async (data) => {
    return api.post('/petty-cash/withdraw', data);
  },
  getTransactions: async (params = {}) => {
    return api.get('/petty-cash/transactions', { params });
  },
  getPettyCashStats: async () => {
    return api.get('/petty-cash/stats');
  },
};

