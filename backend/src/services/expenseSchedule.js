const Expense = require('../models/Expense');
const Savings = require('../models/Savings');
const PettyCash = require('../models/PettyCash');
const Transaction = require('../models/Transaction');
const { findSalaryPlan } = require('./incomeSchedule');
const { advanceSendDate } = require('./dispatchSchedule');

async function takeMoney(userId, source, amount, title, expenseId, when) {
  const sourceType = source?.type === 'cash' ? 'petty_cash' : source?.type;
  if (sourceType === 'savings' && source.sourceId) {
    const saving = await Savings.findOne({ _id: source.sourceId, userId });
    if (!saving) throw new Error('Savings account not found');
    await saving.withdrawAmount(amount, `Monthly expense: ${title}`);
    return;
  }
  if (sourceType === 'salary') {
    const plan = await findSalaryPlan(userId);
    if (!plan) throw new Error('Set a salary first');
    if (plan.depositTo === 'savings' && plan.savingsId) {
      const saving = await Savings.findOne({ _id: plan.savingsId, userId });
      if (!saving) throw new Error('The salary jar was not found');
      await saving.withdrawAmount(amount, `Monthly expense from salary: ${title}`);
      return;
    }
  }
  let wallet = await PettyCash.findOne({ userId });
  if (!wallet) wallet = await PettyCash.createDefault(userId);
  if (amount > wallet.currentBalance) throw new Error('Not enough money in the wallet');
  wallet.currentBalance -= amount;
  wallet.lastUpdated = new Date();
  wallet.transactions.push({
    type: 'expense',
    amount,
    description: `Monthly expense: ${title}`,
    referenceId: expenseId,
    referenceType: 'expense',
    date: when,
    createdBy: userId
  });
  await wallet.save();
}

function nextFuture(from, now) {
  let next = advanceSendDate(from, 'monthly');
  let guard = 0;
  while (next && next <= now && guard < 24) {
    next = advanceSendDate(next, 'monthly');
    guard += 1;
  }
  return next;
}

async function postDueExpenses(now = new Date()) {
  const plans = await Expense.find({
    isRecurring: true,
    recurringPattern: 'monthly',
    isActive: true,
    nextExpenseAt: { $ne: null, $lte: now }
  });
  let posted = 0;
  for (const plan of plans) {
    const when = new Date(plan.nextExpenseAt);
    const title = plan.title || plan.subcategory || 'Expense';
    const postedExpense = await Expense.create({
      userId: plan.userId,
      category: plan.category,
      subcategory: plan.subcategory,
      title,
      amount: plan.amount,
      currency: plan.currency,
      expenseDate: when,
      paymentMethod: plan.paymentMethod,
      vendor: plan.vendor,
      notes: 'Monthly charge',
      source: plan.source,
      projectId: plan.projectId,
      assetId: plan.assetId,
      farm: plan.farm,
      isRecurring: false,
      recurringPattern: 'none'
    });
    try {
      await takeMoney(plan.userId, plan.source, plan.amount, title, postedExpense._id, when);
    } catch (error) {
      await Expense.findByIdAndDelete(postedExpense._id);
      console.error(`Monthly expense skipped for ${title}: ${error.message}`);
      continue;
    }
    await Transaction.create({
      userId: plan.userId,
      type: 'expense',
      amount: plan.amount,
      currency: plan.currency || 'FRW',
      category: String(plan.category || 'other').slice(0, 50),
      subcategory: String(plan.subcategory || '').slice(0, 50),
      date: when,
      description: String(title).slice(0, 200),
      notes: 'Monthly charge',
      expenseId: postedExpense._id,
      projectId: plan.projectId || null,
      status: 'completed'
    });
    plan.nextExpenseAt = nextFuture(when, now);
    await plan.save();
    posted += 1;
  }
  return { posted };
}

module.exports = { postDueExpenses };
