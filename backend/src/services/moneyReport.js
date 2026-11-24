const LABELS = {
  school: 'School',
  education: 'School',
  tax: 'Tax',
  salary: 'Salary',
  insurance: 'Insurance',
  investment: 'Investment',
  loan: 'Loan',
  income: 'Income',
  food: 'Food',
  transport: 'Transport',
  housing: 'Housing',
  utilities: 'Utilities',
  healthcare: 'Healthcare',
  materials: 'Materials',
  labor: 'Labor',
  rent: 'Rent',
  other: 'Other',
};

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function periodBounds(period, now = new Date()) {
  const today = startOfDay(now);
  if (period === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 1);
    const prevStart = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    return { start, end, prevStart, prevEnd: start, label: 'Last month' };
  }
  if (period === 'year') {
    const start = new Date(today.getFullYear() - 1, 0, 1);
    const end = new Date(today.getFullYear(), 0, 1);
    const prevStart = new Date(today.getFullYear() - 2, 0, 1);
    return { start, end, prevStart, prevEnd: start, label: 'Last year' };
  }
  const mondayOffset = (today.getDay() + 6) % 7;
  const thisMonday = addDays(today, -mondayOffset);
  const start = addDays(thisMonday, -7);
  const end = new Date(thisMonday);
  const prevStart = addDays(start, -7);
  return { start, end, prevStart, prevEnd: start, label: 'Last week' };
}

function inWindow(value, start, end) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time >= start.getTime() && time < end.getTime();
}

function addAmount(bucket, category, flow, amount) {
  const key = category || 'other';
  if (!bucket[key]) bucket[key] = { in: 0, out: 0 };
  bucket[key][flow] += Number(amount) || 0;
}

function collect(books, start, end) {
  const bucket = {};
  (books.expenses || []).forEach((expense) => {
    if (inWindow(expense.expenseDate || expense.date, start, end)) {
      addAmount(bucket, expense.category, 'out', expense.amount);
    }
  });
  (books.transactions || []).forEach((transaction) => {
    if (transaction.expenseId) return;
    if (!inWindow(transaction.date, start, end)) return;
    addAmount(bucket, transaction.category, transaction.type === 'income' ? 'in' : 'out', transaction.amount);
  });
  (books.projects || []).forEach((project) => {
    (project.expenses || []).forEach((expense) => {
      if (inWindow(expense.date, start, end)) addAmount(bucket, expense.category, 'out', expense.amount);
    });
    (project.incomes || []).forEach((income) => {
      if (inWindow(income.date, start, end)) addAmount(bucket, income.category || 'income', 'in', income.amount);
    });
  });
  return bucket;
}

function totals(bucket) {
  return Object.values(bucket).reduce((sum, row) => ({
    income: sum.income + row.in,
    expense: sum.expense + row.out,
  }), { income: 0, expense: 0 });
}

function money(amount) {
  const value = Math.round(Math.abs(Number(amount) || 0));
  if (value >= 1000000) return `RF ${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1).replace(/\.0$/, '')}M`;
  return `RF ${value.toLocaleString('en-US')}`;
}

function labelFor(category) {
  return LABELS[category] || category || 'Other';
}

function buildMoneyReport(books, period = 'week', now = new Date()) {
  const bounds = periodBounds(period, now);
  const current = collect(books, bounds.start, bounds.end);
  const previous = collect(books, bounds.prevStart, bounds.prevEnd);
  const nowTotals = totals(current);
  const beforeTotals = totals(previous);
  const keys = new Set([...Object.keys(current), ...Object.keys(previous)]);
  const rising = [...keys].map((category) => {
    const increase = (current[category]?.out || 0) - (previous[category]?.out || 0);
    return {
      category,
      label: labelFor(category),
      current: current[category]?.out || 0,
      previous: previous[category]?.out || 0,
      increase,
    };
  }).filter((row) => row.increase > 0).sort((a, b) => b.increase - a.increase).slice(0, 3);

  return {
    period,
    label: bounds.label,
    start: bounds.start,
    end: bounds.end,
    income: nowTotals.income,
    expense: nowTotals.expense,
    profit: nowTotals.income - nowTotals.expense,
    previousExpense: beforeTotals.expense,
    rising,
  };
}

function formatReportText(report) {
  const result = report.profit >= 0
    ? `Profit ${money(report.profit)}`
    : `Loss ${money(report.profit)}`;
  const rising = report.rising.length
    ? report.rising.map((row) => `${row.label} +${money(row.increase)}`).join(', ')
    : 'no area rose';
  return `SaveMine ${report.label}: ${result}. In ${money(report.income)}. Expenses ${money(report.expense)}. Rising: ${rising}.`;
}

function duePeriods(date) {
  const local = new Date(date.toLocaleString('en-US', { timeZone: 'Africa/Kigali' }));
  if (local.getDay() !== 1) return [];
  const periods = ['week'];
  if (local.getDate() <= 7) periods.push('month');
  if (local.getMonth() === 0 && local.getDate() <= 7) periods.push('year');
  return periods;
}

module.exports = {
  buildMoneyReport,
  formatReportText,
  duePeriods,
  periodBounds,
};
