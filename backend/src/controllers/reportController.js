const Expense = require('../models/Expense');
const Transaction = require('../models/Transaction');
const Project = require('../models/Project');
const { asyncHandler } = require('../middleware/errorHandler');
const { normalizePhone } = require('../utils/phone');
const smsService = require('../services/smsService');
const { buildMoneyReport, formatReportText } = require('../services/moneyReport');

const PERIODS = ['week', 'month', 'year'];

async function loadBooks(userId) {
  const [expenses, transactions, projects] = await Promise.all([
    Expense.find({ userId, isActive: true }).select('category amount expenseDate').lean(),
    Transaction.find({ userId }).select('type category amount date').lean(),
    Project.find({ userId, isActive: true }).select('expenses incomes').lean(),
  ]);
  return { expenses, transactions, projects };
}

function settingsFor(user) {
  const reports = (user.preferences && user.preferences.reports) || {};
  return {
    phone: reports.phone || user.phone || '',
    weekly: Boolean(reports.weekly),
    monthly: Boolean(reports.monthly),
    yearly: Boolean(reports.yearly),
  };
}

const getReport = asyncHandler(async (req, res) => {
  const period = PERIODS.includes(req.query.period) ? req.query.period : 'week';
  const books = await loadBooks(req.user._id);
  const report = buildMoneyReport(books, period);
  res.json({
    success: true,
    data: {
      ...report,
      text: formatReportText(report),
      settings: settingsFor(req.user),
    },
  });
});

const saveReportSettings = asyncHandler(async (req, res) => {
  const phone = normalizePhone(req.body.phone || req.user.phone);
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Enter a phone number that can receive the report' });
  }
  req.user.preferences = req.user.preferences || {};
  req.user.preferences.reports = {
    phone,
    weekly: req.body.weekly !== false,
    monthly: Boolean(req.body.monthly),
    yearly: Boolean(req.body.yearly),
  };
  req.user.markModified('preferences');
  await req.user.save();
  res.json({ success: true, data: settingsFor(req.user) });
});

const sendReport = asyncHandler(async (req, res) => {
  const period = PERIODS.includes(req.body.period) ? req.body.period : 'week';
  const settings = settingsFor(req.user);
  const phone = normalizePhone(req.body.phone || settings.phone);
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Save a phone number before sending the report' });
  }
  const books = await loadBooks(req.user._id);
  const report = buildMoneyReport(books, period);
  const text = formatReportText(report);
  const result = await smsService.sendSMS(phone, text);
  res.json({ success: true, data: { text, phone, result } });
});

module.exports = {
  getReport,
  saveReportSettings,
  sendReport,
  loadBooks,
  settingsFor,
};
