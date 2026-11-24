const Savings = require('../models/Savings');
const PettyCash = require('../models/PettyCash');
const { findSalaryPlan } = require('./incomeSchedule');

function fail(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function walletOf(userId) {
  let wallet = await PettyCash.findOne({ userId });
  if (!wallet) wallet = await PettyCash.createDefault(userId);
  return wallet;
}

function purseKind(source) {
  if (!source || source.type === 'cash' || source.type === 'petty_cash') return 'wallet';
  return source.type;
}

async function purseTake(userId, source, amount, label, allowShortfall = false) {
  if (!(amount > 0)) return;
  const kind = purseKind(source);
  if (kind === 'savings') {
    const saving = await Savings.findOne({ _id: source.sourceId, userId });
    if (!saving) throw fail('Savings account not found', 404);
    await saving.withdrawAmount(amount, label, allowShortfall);
    return;
  }
  if (kind === 'salary') {
    const plan = await findSalaryPlan(userId);
    if (!plan) throw fail('Set a salary first, then expenses can come off it', 400);
    if (plan.depositTo === 'savings' && plan.savingsId) {
      const saving = await Savings.findOne({ _id: plan.savingsId, userId });
      if (!saving) throw fail('The salary jar was not found', 404);
      if (!allowShortfall && amount > saving.amount) throw fail(`Not enough salary in ${saving.name}. Available: ${saving.amount}`, 400);
      await saving.withdrawAmount(amount, label, allowShortfall);
      return;
    }
  }
  const wallet = await walletOf(userId);
  if (!allowShortfall && amount > wallet.currentBalance) throw fail(`Not enough in the wallet. Available: ${wallet.currentBalance}`, 400);
  await wallet.addTransaction('expense', amount, label);
}

async function purseReturn(userId, source, amount, label) {
  if (!(amount > 0)) return;
  const kind = purseKind(source);
  if (kind === 'savings') {
    const saving = await Savings.findOne({ _id: source.sourceId, userId });
    if (!saving) throw fail('Savings account not found', 404);
    await saving.addAmount(amount, label);
    return;
  }
  if (kind === 'salary') {
    const plan = await findSalaryPlan(userId);
    if (plan && plan.depositTo === 'savings' && plan.savingsId) {
      const saving = await Savings.findOne({ _id: plan.savingsId, userId });
      if (saving) {
        await saving.addAmount(amount, label);
        return;
      }
    }
  }
  const wallet = await walletOf(userId);
  await wallet.addTransaction('income', amount, label);
}

module.exports = { purseTake, purseReturn };
