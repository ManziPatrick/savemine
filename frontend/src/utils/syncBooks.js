export const bookLinks = {
  savings: ['savings', 'savingsStats', 'moneyMap'],
  wallet: ['pettyCash', 'pettyCashStats', 'pettyCashTransactions', 'moneyMap'],
  bills: ['reminders', 'billReminders', 'reminderStats'],
  loans: ['loans', 'loanStats', 'overdueLoans'],
  contacts: ['contacts', 'loans', 'loanStats', 'overdueLoans'],
  transactions: ['transactions', 'transactionStats', 'recentTransactions', 'salaryIncome', 'moneyMap', 'pettyCash', 'pettyCashStats', 'savings', 'savingsStats', 'projects', 'allProjects', 'projectStats'],
  expenses: ['expenses', 'expenseStats', 'transactions', 'transactionStats', 'recentTransactions', 'projects', 'allProjects', 'projectStats', 'moneyMap', 'wallet', 'pettyCash', 'pettyCashStats', 'savings', 'savingsStats'],
  gifts: ['gifts', 'giftStats'],
  business: ['businesses', 'businessStats', 'projects', 'allProjects', 'projectStats'],
  projects: ['projects', 'allProjects', 'projectStats', 'moneyMap', 'expenses', 'expenseStats', 'businesses', 'businessStats', 'transactions', 'recentTransactions', 'pettyCash', 'pettyCashStats'],
  investments: ['investments', 'investmentStats', 'transactions', 'transactionStats', 'recentTransactions', 'moneyMap', 'savings', 'savingsStats', 'pettyCash', 'pettyCashStats', 'expenses', 'expenseStats'],
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
