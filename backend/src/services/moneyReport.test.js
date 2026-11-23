const test = require('node:test');
const assert = require('node:assert/strict');
const { buildMoneyReport, duePeriods, formatReportText } = require('./moneyReport');

const books = {
  expenses: [
    { category: 'school', amount: 50000, expenseDate: '2026-11-18' },
    { category: 'school', amount: 10000, expenseDate: '2026-11-10' },
    { category: 'tax', amount: 20000, expenseDate: '2026-11-19' },
    { category: 'food', amount: 5000, expenseDate: '2026-11-12' },
  ],
  transactions: [
    { type: 'income', category: 'salary', amount: 80000, date: '2026-11-16' },
    { type: 'income', category: 'salary', amount: 90000, date: '2026-11-09' },
  ],
  projects: [],
};

test('weekly report shows loss or profit and the areas that rose', () => {
  const report = buildMoneyReport(books, 'week', new Date(2026, 10, 23));
  assert.equal(report.income, 80000);
  assert.equal(report.expense, 70000);
  assert.equal(report.profit, 10000);
  assert.equal(report.rising[0].label, 'School');
  assert.equal(report.rising[0].increase, 40000);
  assert.match(formatReportText(report), /Profit RF 10,000/);
  assert.match(formatReportText(report), /School \+RF 40,000/);
});

test('a loss is named when expenses pass income', () => {
  const report = buildMoneyReport({
    expenses: [{ category: 'insurance', amount: 30000, expenseDate: '2026-11-18' }],
    transactions: [],
    projects: [],
  }, 'week', new Date(2026, 10, 23));
  assert.equal(report.profit, -30000);
  assert.match(formatReportText(report), /Loss RF 30,000/);
});

test('Monday schedule sends the week, and the first Monday also sends the month', () => {
  assert.deepEqual(duePeriods(new Date(2026, 10, 23, 8, 0, 0)), ['week']);
  assert.deepEqual(duePeriods(new Date(2026, 10, 2, 8, 0, 0)), ['week', 'month']);
  assert.deepEqual(duePeriods(new Date(2026, 0, 5, 8, 0, 0)), ['week', 'month', 'year']);
});
