const Transaction = require('../models/Transaction');
const Savings = require('../models/Savings');
const PettyCash = require('../models/PettyCash');
const Project = require('../models/Project');
const { advanceSendDate, repeats } = require('./dispatchSchedule');

function isSalary(row) {
  return /salary/i.test(`${row?.category || ''} ${row?.description || ''}`);
}

function salaryWaiting(row, now = new Date()) {
  if (!isSalary(row)) return false;
  if (!row.lastReceivedAt) return true;
  if (row.nextIncomeAt && new Date(row.nextIncomeAt) <= now) return true;
  return false;
}

async function findSalaryPlan(userId) {
  const plans = await Transaction.find({
    userId,
    type: 'income',
    isRecurring: true,
    status: { $ne: 'cancelled' }
  }).sort({ updatedAt: -1 });
  return plans.find(isSalary) || null;
}

async function addProjectIncome(userId, projectId, income) {
  if (!projectId) return null;
  const project = await Project.findOne({ _id: projectId, userId, isActive: true });
  if (!project) {
    const error = new Error('Choose one of your projects');
    error.statusCode = 400;
    throw error;
  }
  project.incomes.push({
    date: income.date || new Date(),
    title: income.title || 'Income',
    amount: income.amount,
    category: income.category || 'income',
    notes: income.notes || ''
  });
  if (project.status === 'planning') project.status = 'active';
  await project.save();
  return project;
}

async function placeIncome(userId, amount, where, label) {
  if (where.depositTo === 'savings' && where.savingsId) {
    const saving = await Savings.findOne({ _id: where.savingsId, userId, isActive: { $ne: false } });
    if (!saving) {
      const error = new Error('Choose a savings jar for this income');
      error.statusCode = 400;
      throw error;
    }
    await saving.addAmount(amount, label);
    return saving.name;
  }
  let wallet = await PettyCash.findOne({ userId, isActive: { $ne: false } });
  if (!wallet) wallet = await PettyCash.createDefault(userId);
  await wallet.addTransaction('income', amount, label);
  return 'wallet';
}

async function postDueIncomes(now = new Date()) {
  const plans = await Transaction.find({
    isRecurring: true,
    type: 'income',
    status: { $ne: 'cancelled' },
    nextIncomeAt: { $ne: null, $lte: now }
  });
  let posted = 0;
  for (const plan of plans) {
    const frequency = plan.recurringPattern?.frequency;
    if (!repeats(frequency)) continue;
    let guard = 0;
    if (isSalary(plan)) continue;
    while (plan.nextIncomeAt && plan.nextIncomeAt <= now && guard < 12) {
      const when = new Date(plan.nextIncomeAt);
      const label = plan.description || plan.category || 'Income';
      await placeIncome(plan.userId, plan.amount, plan, label);
      if (plan.projectId) {
        await addProjectIncome(plan.userId, plan.projectId, {
          date: when,
          title: label,
          amount: plan.amount,
          category: plan.category
        });
      }
      await Transaction.create({
        userId: plan.userId,
        type: 'income',
        amount: plan.amount,
        currency: plan.currency,
        category: plan.category,
        subcategory: plan.subcategory,
        date: when,
        description: plan.description,
        notes: `Repeating ${frequency} income`,
        depositTo: plan.depositTo,
        savingsId: plan.savingsId,
        projectId: plan.projectId || null,
        isRecurring: false,
        status: 'completed'
      });
      plan.nextIncomeAt = advanceSendDate(when, frequency);
      guard += 1;
      posted += 1;
    }
    await plan.save();
  }
  return { posted };
}

function nextOpenDate(from, frequency) {
  let next = advanceSendDate(from, frequency);
  const now = new Date();
  let guard = 0;
  while (next && next <= now && guard < 24) {
    next = advanceSendDate(next, frequency);
    guard += 1;
  }
  return next;
}

function primaryPurse(splits) {
  const main = [...splits].sort((a, b) => Number(b.amount) - Number(a.amount))[0];
  if (main?.place === 'savings' && main.savingsId) {
    return { depositTo: 'savings', savingsId: main.savingsId };
  }
  return { depositTo: 'wallet', savingsId: null };
}

async function normalizeSplits(userId, raw, total) {
  const rows = Array.isArray(raw) ? raw : [];
  if (rows.length === 0) {
    const error = new Error('Split the pay across the wallet and your savings');
    error.statusCode = 400;
    throw error;
  }
  const jars = await Savings.find({ userId, isActive: { $ne: false } });
  const byId = new Map(jars.map((jar) => [String(jar._id), jar]));
  const splits = rows.map((row) => {
    const amount = Number(row.amount);
    if (!(amount > 0)) {
      const error = new Error('Each part of the pay needs an amount');
      error.statusCode = 400;
      throw error;
    }
    const savingsId = row.savingsId || null;
    if (row.place === 'wallet' || !savingsId) {
      return { place: 'wallet', savingsId: null, name: 'Wallet', amount };
    }
    const jar = byId.get(String(savingsId));
    if (!jar) {
      const error = new Error('Choose a savings jar for each part of the pay');
      error.statusCode = 400;
      throw error;
    }
    return { place: 'savings', savingsId: jar._id, name: jar.name, amount };
  });
  const sum = splits.reduce((totalSoFar, row) => totalSoFar + row.amount, 0);
  if (Math.round(sum) !== Math.round(Number(total))) {
    const error = new Error(`The split is ${sum}. It needs to equal the pay of ${total}.`);
    error.statusCode = 400;
    throw error;
  }
  return splits;
}

async function receivePlan(plan) {
  if (plan.type !== 'income') {
    const error = new Error('Only income can be marked received');
    error.statusCode = 400;
    throw error;
  }
  const now = new Date();
  if (plan.lastReceivedAt && plan.nextIncomeAt && plan.nextIncomeAt > now) {
    const error = new Error('This pay is already received. The next one follows the schedule.');
    error.statusCode = 400;
    throw error;
  }
  const splits = plan.splits?.length
    ? plan.splits
    : [{
      place: plan.depositTo === 'savings' && plan.savingsId ? 'savings' : 'wallet',
      savingsId: plan.depositTo === 'savings' ? plan.savingsId : null,
      name: plan.depositTo === 'savings' ? 'Savings' : 'Wallet',
      amount: plan.amount
    }];
  const sum = splits.reduce((total, row) => total + Number(row.amount || 0), 0);
  if (Math.round(sum) !== Math.round(Number(plan.amount))) {
    const error = new Error(`The split is ${sum}. It needs to equal the pay of ${plan.amount}.`);
    error.statusCode = 400;
    throw error;
  }
  const label = plan.description || plan.category || 'Income';
  for (const split of splits) {
    await placeIncome(plan.userId, Number(split.amount), {
      depositTo: split.place === 'savings' ? 'savings' : 'wallet',
      savingsId: split.savingsId
    }, `${label}: ${split.name || 'Wallet'}`);
  }
  if (plan.projectId) {
    await addProjectIncome(plan.userId, plan.projectId, {
      date: now,
      title: label,
      amount: plan.amount,
      category: plan.category
    });
  }
  const purse = primaryPurse(splits);
  plan.splits = splits;
  plan.depositTo = purse.depositTo;
  plan.savingsId = purse.savingsId;
  plan.lastReceivedAt = now;
  plan.notes = `Received ${whereText(splits)}`.slice(0, 500);
  const frequency = plan.recurringPattern?.frequency;
  if (plan.isRecurring && repeats(frequency)) {
    if (!plan.nextIncomeAt || plan.nextIncomeAt <= now) {
      plan.nextIncomeAt = nextOpenDate(plan.nextIncomeAt || plan.date || now, frequency);
    }
    plan.status = 'pending';
  } else {
    plan.status = 'completed';
    plan.nextIncomeAt = null;
  }
  await plan.save();
  return plan;
}

function whereText(splits) {
  return splits.map((split) => `${Number(split.amount).toLocaleString()} in ${split.name || 'Wallet'}`).join(', ');
}

module.exports = {
  placeIncome,
  postDueIncomes,
  findSalaryPlan,
  addProjectIncome,
  isSalary,
  salaryWaiting,
  normalizeSplits,
  primaryPurse,
  receivePlan
};
