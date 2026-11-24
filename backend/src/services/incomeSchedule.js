const Transaction = require('../models/Transaction');
const Savings = require('../models/Savings');
const PettyCash = require('../models/PettyCash');
const Project = require('../models/Project');
const { advanceSendDate, repeats } = require('./dispatchSchedule');

function isSalary(row) {
  return /salary/i.test(`${row?.category || ''} ${row?.description || ''}`);
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

module.exports = { placeIncome, postDueIncomes, findSalaryPlan, addProjectIncome, isSalary };
