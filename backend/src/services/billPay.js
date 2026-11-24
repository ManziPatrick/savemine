const Reminder = require('../models/Reminder');
const Expense = require('../models/Expense');
const { purseTake } = require('./purse');
const { findSalaryPlan, salaryWaiting } = require('./incomeSchedule');

const EXPENSE_CATEGORIES = new Set([
  'food', 'transport', 'housing', 'utilities', 'healthcare', 'education',
  'school', 'tax', 'salary', 'insurance',
  'entertainment', 'clothing', 'personal_care', 'business', 'animal_care',
  'agriculture', 'investment', 'loan', 'emergency', 'gift', 'donation', 'other'
]);

function advanceBill(reminder) {
  if (!reminder.recurrence || reminder.recurrence === 'none') return;
  const nextDate = new Date(reminder.scheduledDate);
  if (reminder.recurrence === 'daily') nextDate.setDate(nextDate.getDate() + 1);
  if (reminder.recurrence === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
  if (reminder.recurrence === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
  if (reminder.recurrence === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
  if (reminder.recurrenceEndDate && nextDate > new Date(reminder.recurrenceEndDate)) {
    reminder.recurrence = 'none';
    return;
  }
  reminder.scheduledDate = nextDate;
  reminder.status = 'scheduled';
}

async function payScheduledBill(userId, reminderId) {
  const reminder = await Reminder.findOne({ _id: reminderId, userId });
  if (!reminder) {
    const error = new Error('Bill not found');
    error.statusCode = 404;
    throw error;
  }
  const amount = Number(reminder.amount);
  if (!(amount > 0)) {
    const error = new Error('This reminder has no amount to pay');
    error.statusCode = 400;
    throw error;
  }
  let source = reminder.source?.type
    ? reminder.source
    : { type: 'salary', sourceName: 'Salary' };
  if (source.type === 'salary') {
    const plan = await findSalaryPlan(userId);
    if (!plan || salaryWaiting(plan)) {
      source = { type: 'cash', sourceName: 'Wallet' };
    }
  }
  const category = EXPENSE_CATEGORIES.has(String(reminder.category || '').toLowerCase())
    ? String(reminder.category).toLowerCase()
    : 'other';
  const expense = await Expense.create({
    userId,
    category,
    subcategory: String(reminder.category || reminder.title || '').slice(0, 80),
    title: reminder.title,
    amount,
    currency: reminder.currency || 'FRW',
    expenseDate: new Date(),
    paymentMethod: source.type === 'savings' ? 'other' : 'cash',
    notes: `Paid on the ${reminder.recurrence || 'once'} schedule`,
    source: {
      type: source.type,
      sourceId: source.sourceId || null,
      sourceName: source.sourceName || '',
      amount
    },
    isRecurring: false,
    recurringPattern: 'none'
  });
  try {
    await purseTake(userId, source, amount, `Paid: ${reminder.title}`, true);
  } catch (error) {
    await Expense.findByIdAndDelete(expense._id);
    throw error;
  }
  reminder.lastPaidAt = new Date();
  reminder.paidCount = Number(reminder.paidCount || 0) + 1;
  advanceBill(reminder);
  await reminder.save();
  return reminder;
}

module.exports = { payScheduledBill };
