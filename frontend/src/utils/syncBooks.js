export const bookLinks = {
  savings: ['savings', 'savingsStats'],
  wallet: ['pettyCash', 'pettyCashStats', 'pettyCashTransactions'],
  bills: ['reminders', 'billReminders', 'reminderStats'],
  loans: ['loans', 'loanStats', 'overdueLoans'],
  contacts: ['contacts', 'loans', 'loanStats', 'overdueLoans'],
  transactions: ['transactions', 'transactionStats', 'recentTransactions', 'pettyCash', 'pettyCashStats', 'savings', 'savingsStats'],
  expenses: ['expenses', 'expenseStats', 'transactions', 'transactionStats', 'recentTransactions', 'projects', 'allProjects', 'projectStats', 'wallet', 'pettyCash', 'pettyCashStats', 'savings', 'savingsStats'],
  gifts: ['gifts', 'giftStats'],
  business: ['businesses', 'businessStats', 'projects', 'allProjects', 'projectStats'],
  projects: ['projects', 'allProjects', 'projectStats', 'expenses', 'expenseStats', 'businesses', 'businessStats'],
  investments: ['investments', 'investmentStats'],
  assets: ['assets', 'assetAssignmentStats', 'projects', 'allProjects'],
  contracts: ['contracts'],
};

export function syncBooks(queryClient, ...books) {
  const keys = new Set();
  books.forEach((book) => {
    (bookLinks[book] || [book]).forEach((key) => keys.add(key));
  });

  keys.forEach((key) => {
    queryClient.invalidateQueries(key);
    queryClient.invalidateQueries([key]);
  });
}
