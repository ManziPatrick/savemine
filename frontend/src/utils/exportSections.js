/**
 * Section builders — convert each module's raw API data into export sections
 * of the shape: [{ title, columns: [{ key, header }], rows: [object] }]
 */

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB');
};

const fmtMoney = (amount) =>
  typeof amount === 'number' ? amount.toLocaleString('en-US') : (amount || '');

// ---- Loans ----
export const buildLoanSections = (loans = []) => [{
  title: 'Loans',
  columns: [
    { key: 'borrower', header: 'Borrower' },
    { key: 'phone', header: 'Phone' },
    { key: 'loanType', header: 'Type' },
    { key: 'totalAmount', header: 'Total Amount' },
    { key: 'amountPaid', header: 'Amount Paid' },
    { key: 'remainingAmount', header: 'Remaining' },
    { key: 'interestRate', header: 'Interest %' },
    { key: 'dueDate', header: 'Due Date' },
    { key: 'status', header: 'Status' },
    { key: 'source', header: 'Source' },
  ],
  rows: loans.map((l) => ({
    borrower: l.contactId?.name || 'Unknown',
    phone: l.contactId?.phone || '',
    loanType: l.loanType || '',
    totalAmount: fmtMoney(l.totalAmount),
    amountPaid: fmtMoney(l.amountPaid || 0),
    remainingAmount: fmtMoney(l.remainingAmount),
    interestRate: l.interestRate ?? '',
    dueDate: formatDate(l.dueDate),
    status: l.status || '',
    source: l.source?.sourceName || '',
  })),
}];

// ---- Contacts ----
export const buildContactSections = (contacts = []) => [{
  title: 'Contacts',
  columns: [
    { key: 'name', header: 'Name' },
    { key: 'phone', header: 'Phone' },
    { key: 'type', header: 'Type' },
    { key: 'email', header: 'Email' },
    { key: 'address', header: 'Address' },
    { key: 'organization', header: 'Organization' },
    { key: 'notes', header: 'Notes' },
  ],
  rows: contacts.map((c) => ({
    name: c.name || '',
    phone: c.phone || '',
    type: c.type || '',
    email: c.email || '',
    address: c.address || '',
    organization: c.organization || '',
    notes: c.notes || '',
  })),
}];

// ---- Transactions ----
export const buildTransactionSections = (transactions = []) => [{
  title: 'Transactions',
  columns: [
    { key: 'type', header: 'Type' },
    { key: 'amount', header: 'Amount' },
    { key: 'currency', header: 'Currency' },
    { key: 'category', header: 'Category' },
    { key: 'subcategory', header: 'Subcategory' },
    { key: 'date', header: 'Date' },
    { key: 'description', header: 'Description' },
    { key: 'status', header: 'Status' },
  ],
  rows: transactions.map((t) => ({
    type: t.type || '',
    amount: fmtMoney(t.amount),
    currency: t.currency || 'FRW',
    category: t.category || '',
    subcategory: t.subcategory || '',
    date: formatDate(t.date),
    description: t.description || '',
    status: t.status || '',
  })),
}];

// ---- Savings ----
export const buildSavingsSections = (savings = []) => [{
  title: 'Savings',
  columns: [
    { key: 'name', header: 'Name' },
    { key: 'location', header: 'Location' },
    { key: 'amount', header: 'Amount' },
    { key: 'currency', header: 'Currency' },
    { key: 'targetAmount', header: 'Target Amount' },
    { key: 'progress', header: 'Progress %' },
    { key: 'interestRate', header: 'Interest %' },
  ],
  rows: savings.map((s) => ({
    name: s.name || '',
    location: s.location || '',
    amount: fmtMoney(s.amount),
    currency: s.currency || 'FRW',
    targetAmount: s.targetAmount ? fmtMoney(s.targetAmount) : '',
    progress: s.progressPercentage ?? '',
    interestRate: s.interestRate ?? '',
  })),
}];

// ---- Expenses ----
export const buildExpenseSections = (expenses = []) => [{
  title: 'Expenses',
  columns: [
    { key: 'title', header: 'Title' },
    { key: 'category', header: 'Category' },
    { key: 'amount', header: 'Amount' },
    { key: 'currency', header: 'Currency' },
    { key: 'date', header: 'Date' },
    { key: 'paymentMethod', header: 'Payment Method' },
    { key: 'vendor', header: 'Vendor' },
    { key: 'type', header: 'Business/Personal' },
    { key: 'source', header: 'Deducted From' },
  ],
  rows: expenses.map((e) => ({
    title: e.title || '',
    category: e.category || '',
    amount: fmtMoney(e.amount),
    currency: e.currency || 'FRW',
    date: formatDate(e.expenseDate),
    paymentMethod: (e.paymentMethod || '').replace('_', ' '),
    vendor: e.vendor || '',
    type: e.isBusinessExpense ? 'Business' : 'Personal',
    source: e.source?.sourceName || (e.source?.type === 'cash' ? 'Cash' : ''),
  })),
}];

// ---- Projects (My Projects) ----
export const buildProjectSections = (projects = []) => [{
  title: 'My Projects',
  columns: [
    { key: 'name', header: 'Project' },
    { key: 'projectType', header: 'Type' },
    { key: 'status', header: 'Status' },
    { key: 'location', header: 'Location' },
    { key: 'totalExpenses', header: 'Money Spent' },
    { key: 'totalIncome', header: 'Income' },
    { key: 'profit', header: 'Profit' },
    { key: 'startDate', header: 'Start Date' },
  ],
  rows: projects.map((p) => ({
    name: p.name || '',
    projectType: p.projectType || '',
    status: p.status || '',
    location: p.location || '',
    totalExpenses: fmtMoney(p.totalExpenses),
    totalIncome: fmtMoney(p.totalIncome),
    profit: fmtMoney(p.profit),
    startDate: formatDate(p.startDate),
  })),
}];

// ---- Businesses ----
export const buildBusinessSections = (businesses = []) => [{
  title: 'Businesses',
  columns: [
    { key: 'name', header: 'Business' },
    { key: 'businessType', header: 'Type' },
    { key: 'status', header: 'Status' },
    { key: 'totalRevenue', header: 'Revenue' },
    { key: 'totalExpenses', header: 'Expenses' },
    { key: 'totalProfit', header: 'Profit' },
    { key: 'location', header: 'Location' },
    { key: 'startDate', header: 'Started' },
  ],
  rows: businesses.map((b) => ({
    name: b.name || '',
    businessType: b.businessType || '',
    status: b.status || '',
    totalRevenue: fmtMoney(b.totalRevenue),
    totalExpenses: fmtMoney(b.totalExpenses),
    totalProfit: fmtMoney(b.totalProfit),
    location: b.location || '',
    startDate: formatDate(b.startDate),
  })),
}];

// ---- Investments ----
export const buildInvestmentSections = (investments = []) => [{
  title: 'Investments',
  columns: [
    { key: 'name', header: 'Investment' },
    { key: 'investmentType', header: 'Type' },
    { key: 'status', header: 'Status' },
    { key: 'initialAmount', header: 'Invested' },
    { key: 'currentValue', header: 'Current Value' },
    { key: 'riskLevel', header: 'Risk' },
    { key: 'maturityDate', header: 'Maturity' },
  ],
  rows: investments.map((i) => ({
    name: i.name || '',
    investmentType: i.investmentType || '',
    status: i.status || '',
    initialAmount: fmtMoney(i.initialAmount),
    currentValue: fmtMoney(i.currentValue),
    riskLevel: i.riskLevel || '',
    maturityDate: formatDate(i.maturityDate),
  })),
}];

// ---- Gifts ----
export const buildGiftSections = (gifts = []) => [{
  title: 'Gifts & Donations',
  columns: [
    { key: 'title', header: 'Title' },
    { key: 'giftType', header: 'Type' },
    { key: 'amount', header: 'Amount' },
    { key: 'currency', header: 'Currency' },
    { key: 'occasion', header: 'Occasion' },
    { key: 'person', header: 'Recipient/Donor' },
    { key: 'date', header: 'Date' },
  ],
  rows: gifts.map((g) => ({
    title: g.title || '',
    giftType: g.giftType || '',
    amount: fmtMoney(g.amount),
    currency: g.currency || 'FRW',
    occasion: g.occasion || '',
    person: g.contactId?.name || '',
    date: formatDate(g.giftDate),
  })),
}];

// ---- Assets ----
export const buildAssetSections = (assets = []) => [{
  title: 'Assets',
  columns: [
    { key: 'name', header: 'Asset' },
    { key: 'category', header: 'Category' },
    { key: 'value', header: 'Value' },
    { key: 'currency', header: 'Currency' },
    { key: 'status', header: 'Status' },
    { key: 'owner', header: 'Owner' },
  ],
  rows: assets.map((a) => ({
    name: a.name || '',
    category: a.category || '',
    value: fmtMoney(a.value),
    currency: a.currency || 'FRW',
    status: a.status || '',
    owner: a.ownerContactId?.name || '',
  })),
}];

// ---- Reminders ----
export const buildReminderSections = (reminders = []) => [{
  title: 'Reminders',
  columns: [
    { key: 'title', header: 'Title' },
    { key: 'modelType', header: 'Type' },
    { key: 'scheduledDate', header: 'Send At' },
    { key: 'status', header: 'Status' },
    { key: 'sendMethod', header: 'Channel' },
  ],
  rows: reminders.map((r) => ({
    title: r.title || '',
    modelType: r.modelType || r.reminderType || '',
    scheduledDate: formatDate(r.scheduledDate || r.sendAt),
    status: r.status || '',
    sendMethod: r.sendMethod || '',
  })),
}];

// ---- Petty Cash transactions ----
export const buildPettyCashSections = (transactions = []) => [{
  title: 'Petty Cash Transactions',
  columns: [
    { key: 'type', header: 'Type' },
    { key: 'amount', header: 'Amount' },
    { key: 'description', header: 'Description' },
    { key: 'date', header: 'Date' },
  ],
  rows: transactions.map((t) => ({
    type: t.type || '',
    amount: fmtMoney(t.amount),
    description: t.description || '',
    date: formatDate(t.date),
  })),
}];

// ---- Build all sections from a bag of module arrays ----
export function buildAllSections(data = {}) {
  const sections = [];
  const push = (arr, fn) => {
    if (Array.isArray(arr) && arr.length) sections.push(...fn(arr));
  };
  push(data.loans, buildLoanSections);
  push(data.contacts, buildContactSections);
  push(data.transactions, buildTransactionSections);
  push(data.savings, buildSavingsSections);
  push(data.expenses, buildExpenseSections);
  push(data.projects, buildProjectSections);
  push(data.businesses, buildBusinessSections);
  push(data.investments, buildInvestmentSections);
  push(data.gifts, buildGiftSections);
  push(data.assets, buildAssetSections);
  push(data.reminders, buildReminderSections);
  push(data.pettyCash, buildPettyCashSections);
  return sections;
}
