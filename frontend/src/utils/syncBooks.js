export const bookLinks = {
  savings: ['savings', 'savingsStats'],
  wallet: ['pettyCash', 'pettyCashStats', 'pettyCashTransactions'],
  bills: ['reminders', 'billReminders', 'reminderStats'],
  loans: ['loans', 'loanStats', 'overdueLoans'],
  contacts: ['contacts', 'loans', 'loanStats', 'overdueLoans'],
  transactions: ['transactions', 'transactionStats', 'recentTransactions'],
  expenses: ['expenses', 'expenseStats'],
  gifts: ['gifts', 'giftStats'],
  business: ['businesses', 'businessStats'],
  projects: ['projects', 'allProjects', 'projectStats'],
  investments: ['investments', 'investmentStats'],
  assets: ['assets', 'assetAssignmentStats'],
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
