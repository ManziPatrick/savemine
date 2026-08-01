import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/me', userData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  deactivateAccount: (password) => api.delete('/auth/me', { data: { password } }),
};

// Loans API
export const loansAPI = {
  getLoans: (params = {}) => api.get('/loans', { params }),
  getLoan: (id) => api.get(`/loans/${id}`),
  createLoan: (loanData) => api.post('/loans', loanData),
  updateLoan: (id, loanData) => api.put(`/loans/${id}`, loanData),
  deleteLoan: (id) => api.delete(`/loans/${id}`),
  addPayment: (id, paymentData) => api.post(`/loans/${id}/payments`, paymentData),
  getLoanStats: () => api.get('/loans/stats'),
  getLoanSources: () => api.get('/loans/sources'),
  getOverdueLoans: () => api.get('/loans/overdue'),
  bulkImportLoans: (loans, replaceAll = false) => api.post('/loans/bulk-import', { loans, replaceAll }),
};

// Contacts API
export const contactsAPI = {
  getContacts: (params = {}) => api.get('/contacts', { params }),
  getContact: (id) => api.get(`/contacts/${id}`),
  createContact: (contactData) => api.post('/contacts', contactData),
  updateContact: (id, contactData) => api.put(`/contacts/${id}`, contactData),
  deleteContact: (id) => api.delete(`/contacts/${id}`),
  getContactsByType: (type) => api.get(`/contacts/type/${type}`),
  searchContacts: (query, type) => api.get('/contacts/search', { params: { q: query, type } }),
  getContactStats: () => api.get('/contacts/stats'),
  bulkImportContacts: (contacts, replaceAll = false) => api.post('/contacts/bulk-import', { contacts, replaceAll }),
};

// Transactions API
export const transactionsAPI = {
  getTransactions: (params = {}) => api.get('/transactions', { params }),
  getTransaction: (id) => api.get(`/transactions/${id}`),
  createTransaction: (transactionData) => api.post('/transactions', transactionData),
  updateTransaction: (id, transactionData) => api.put(`/transactions/${id}`, transactionData),
  deleteTransaction: (id) => api.delete(`/transactions/${id}`),
  getTransactionStats: (params = {}) => api.get('/transactions/stats', { params }),
  getTransactionsByCategory: (params = {}) => api.get('/transactions/categories', { params }),
  uploadAttachment: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/transactions/${id}/attachment`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Savings API
export const savingsAPI = {
  getSavings: (params = {}) => api.get('/savings', { params }),
  getSaving: (id) => api.get(`/savings/${id}`),
  createSavings: (savingsData) => api.post('/savings', savingsData),
  updateSavings: (id, savingsData) => api.put(`/savings/${id}`, savingsData),
  deleteSavings: (id) => api.delete(`/savings/${id}`),
  addAmount: (id, amount, notes) => api.post(`/savings/${id}/add`, { amount, notes }),
  withdrawAmount: (id, amount, notes) => api.post(`/savings/${id}/withdraw`, { amount, notes }),
  getSavingsStats: () => api.get('/savings/stats'),
  getSavingsByLocation: (location) => api.get(`/savings/location/${location}`),
};

// Assets API
export const assetsAPI = {
  getAssets: (params = {}) => api.get('/assets', { params }),
  getAsset: (id) => api.get(`/assets/${id}`),
  createAsset: (assetData) => api.post('/assets', assetData),
  updateAsset: (id, assetData) => api.put(`/assets/${id}`, assetData),
  deleteAsset: (id) => api.delete(`/assets/${id}`),
  updateValue: (id, value, depreciationRate) => api.post(`/assets/${id}/update-value`, { value, depreciationRate }),
  getAssetStats: () => api.get('/assets/stats'),
  getAssetsByCategory: (category) => api.get(`/assets/category/${category}`),
  uploadProof: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/assets/${id}/proof`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Business Projects API
export const businessesAPI = {
  getBusinesses: (params = {}) => api.get('/businesses', { params }),
  getBusiness: (id) => api.get(`/businesses/${id}`),
  createBusiness: (businessData) => api.post('/businesses', businessData),
  updateBusiness: (id, businessData) => api.put(`/businesses/${id}`, businessData),
  deleteBusiness: (id) => api.delete(`/businesses/${id}`),
  updateProgress: (id, progress) => api.post(`/businesses/${id}/progress`, { progress }),
  addMonthlyIncome: (id, data = {}) => api.post(`/businesses/${id}/income`, { amount: data.amount }),
  addMonthlyExpense: (id, data = {}) => api.post(`/businesses/${id}/expense`, { amount: data.amount }),
  getBusinessStats: () => api.get('/businesses/stats'),
};

// Reminders API
export const remindersAPI = {
  getReminders: (params = {}) => api.get('/reminders', { params }),
  getReminder: (id) => api.get(`/reminders/${id}`),
  createReminder: (reminderData) => api.post('/reminders', reminderData),
  updateReminder: (id, reminderData) => api.put(`/reminders/${id}`, reminderData),
  deleteReminder: (id) => api.delete(`/reminders/${id}`),
  sendReminderNow: (id) => api.post(`/reminders/${id}/send`),
  sendBulkReminders: (reminderIds) => api.post('/reminders/bulk-send', { reminderIds }),
  getOverdueReminders: () => api.get('/reminders/due'),
  getReminderStats: () => api.get('/reminders/stats'),
  bulkCreateLoanReminders: (data) => api.post('/reminders/bulk-loan-reminders', data),
};

// Gifts API
export const giftsAPI = {
  getGifts: (params = {}) => api.get('/gifts', { params }),
  getGift: (id) => api.get(`/gifts/${id}`),
  createGift: (giftData) => api.post('/gifts', giftData),
  updateGift: (id, giftData) => api.put(`/gifts/${id}`, giftData),
  deleteGift: (id) => api.delete(`/gifts/${id}`),
  getGiftStats: () => api.get('/gifts/stats'),
};

// Expenses API
export const expensesAPI = {
  getExpenses: (params = {}) => api.get('/expenses', { params }),
  createExpense: (expenseData) => api.post('/expenses', expenseData),
  getExpenseStats: (params = {}) => api.get('/expenses/stats', { params }),
};

// Investments API
export const investmentsAPI = {
  getInvestments: (params = {}) => api.get('/investments', { params }),
  getInvestment: (id) => api.get(`/investments/${id}`),
  createInvestment: (investmentData) => api.post('/investments', investmentData),
  updateInvestment: (id, investmentData) => api.put(`/investments/${id}`, investmentData),
  deleteInvestment: (id) => api.delete(`/investments/${id}`),
  updateValue: (id, value, notes) => api.post(`/investments/${id}/update-value`, { value, notes }),
  addDividend: (id, amount, type, notes) => api.post(`/investments/${id}/dividends`, { amount, type, notes }),
  getInvestmentStats: () => api.get('/investments/stats'),
};

// Projects (My Projects) API — track any project you own
export const projectsAPI = {
  getProjects: (params = {}) => api.get('/projects', { params }),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (projectData) => api.post('/projects', projectData),
  updateProject: (id, projectData) => api.put(`/projects/${id}`, projectData),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  addExpense: (id, expenseData) => api.post(`/projects/${id}/expenses`, expenseData),
  removeExpense: (id, expenseId) => api.delete(`/projects/${id}/expenses/${expenseId}`),
  addIncome: (id, incomeData) => api.post(`/projects/${id}/incomes`, incomeData),
  removeIncome: (id, incomeId) => api.delete(`/projects/${id}/incomes/${incomeId}`),
  getProjectStats: () => api.get('/projects/stats'),
};

// Petty Cash API
export const pettyCashAPI = {
  getPettyCash: () => api.get('/petty-cash'),
  updatePettyCash: (data) => api.put('/petty-cash', data),
  addDeposit: (data) => api.post('/petty-cash/deposit', data),
  makeWithdrawal: (data) => api.post('/petty-cash/withdraw', data),
  getTransactions: (params = {}) => api.get('/petty-cash/transactions', { params }),
  getPettyCashStats: () => api.get('/petty-cash/stats'),
};

// Asset Assignments API
export const assetAssignmentsAPI = {
  getAssetAssignments: (params = {}) => api.get('/asset-assignments', { params }),
  getAssetAssignment: (id) => api.get(`/asset-assignments/${id}`),
  createAssetAssignment: (assignmentData) => api.post('/asset-assignments', assignmentData),
  updateAssetAssignment: (id, assignmentData) => api.put(`/asset-assignments/${id}`, assignmentData),
  deleteAssetAssignment: (id) => api.delete(`/asset-assignments/${id}`),
  addCheckIn: (id, location, condition, notes, photos) => api.post(`/asset-assignments/${id}/check-in`, { location, condition, notes, photos }),
  addPayment: (id, amount, paymentMethod, notes) => api.post(`/asset-assignments/${id}/payments`, { amount, paymentMethod, notes }),
  markAsReturned: (id, returnDate, condition, notes) => api.post(`/asset-assignments/${id}/return`, { returnDate, condition, notes }),
  getAssetAssignmentStats: () => api.get('/asset-assignments/stats'),
};

// Documents API
export const documentsAPI = {
  getDocuments: (params = {}) => api.get('/documents', { params }),
  getDocument: (id) => api.get(`/documents/${id}`),
  uploadDocument: (file, metadata) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.keys(metadata).forEach(key => {
      formData.append(key, metadata[key]);
    });
    return api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteDocument: (id) => api.delete(`/documents/${id}`),
  getDocumentStats: () => api.get('/documents/stats'),
};

// Messages API
export const messagesAPI = {
  testSMS: (phone, message) => api.post('/messages/test-sms', { phone, message }),
  getMessageLogs: (params = {}) => api.get('/messages/logs', { params }),
  getMessageStats: () => api.get('/messages/stats'),
};

// AI Assistant API
export const assistantAPI = {
  chat: (message) => api.post('/assistant/chat', { message }, { timeout: 180000 }),
  getMessages: () => api.get('/assistant/messages'),
  clearMessages: () => api.delete('/assistant/messages'),
};

export default api;
