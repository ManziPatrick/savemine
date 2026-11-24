const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Business = require('../models/Business');
const Project = require('../models/Project');
const Asset = require('../models/Asset');
const Savings = require('../models/Savings');
const { findSalaryPlan } = require('../services/incomeSchedule');
const { advanceSendDate } = require('../services/dispatchSchedule');
const { purseTake, purseReturn } = require('../services/purse');
const PettyCash = require('../models/PettyCash');
const Transaction = require('../models/Transaction');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPaginationParams, getSortParams, createPaginatedResponse } = require('../utils/pagination');

/**
 * @desc    Get all expenses for user
 * @route   GET /expenses
 * @access  Private
 */
const getExpenses = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const sort = getSortParams(req.query, ['expenseDate', 'amount', 'createdAt']);
  
  const filter = { userId: req.user._id, isActive: true };
  
  // Add category filter
  if (req.query.category) {
    filter.category = req.query.category;
  }
  
  // Add business expense filter
  if (req.query.business === 'true') {
    filter.isBusinessExpense = true;
  }
  
  // Add date range filter
  if (req.query.startDate && req.query.endDate) {
    filter.expenseDate = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }

  const expenses = await Expense.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Expense.countDocuments(filter);

  res.json(createPaginatedResponse(expenses, page, limit, total));
});

async function shiftInitialInvestment(userId, projectId, spentDelta) {
  if (!projectId || !spentDelta) return;
  const project = await Project.findOne({ _id: projectId, userId }).select('businessId');
  if (!project || !project.businessId) return;
  await Business.updateOne(
    { _id: project.businessId, userId },
    { $inc: { initialInvestment: -spentDelta } }
  );
}

async function nameSalarySource(userId, source) {
  if (!source || source.type !== 'salary') return source;
  const plan = await findSalaryPlan(userId);
  if (plan && plan.depositTo === 'savings' && plan.savingsId) {
    const saving = await Savings.findOne({ _id: plan.savingsId, userId });
    if (saving) {
      return { type: 'salary', sourceId: saving._id, sourceName: saving.name, amount: source.amount };
    }
  }
  return { ...source, type: 'salary', sourceName: source.sourceName || 'Salary' };
}

function readFarm(farm) {
  if (!farm || typeof farm !== 'object') return undefined;
  const out = {};
  const kilograms = Number(farm.kilograms);
  const size = Number(farm.size);
  const days = Number(farm.days);
  if (kilograms > 0) out.kilograms = kilograms;
  if (size > 0) out.size = size;
  const sizeUnit = String(farm.sizeUnit || '').trim().slice(0, 30);
  if (sizeUnit) out.sizeUnit = sizeUnit;
  if (days > 0) out.days = days;
  const level = String(farm.level || '').trim().slice(0, 40);
  if (level) out.level = level;
  return Object.keys(out).length ? out : undefined;
}

/**
 * @desc    Create new expense
 * @route   POST /expenses
 * @access  Private
 */
const createExpense = asyncHandler(async (req, res) => {
  const {
    category,
    subcategory,
    title,
    description,
    amount,
    currency,
    quantity,
    unitPrice,
    expenseDate,
    paymentMethod,
    location,
    vendor,
    tags,
    notes,
    receipt,
    photos,
    isBusinessExpense,
    isTaxDeductible,
    source,
    projectId,
    assetId,
    farm,
    repeat
  } = req.body;

  // Source is REQUIRED - expense must be deducted from somewhere
  if (!source || !source.type) {
    return res.status(400).json({
      success: false,
      message: 'Source is required. Please specify where the amount is reduced from (cash, savings, or petty_cash)'
    });
  }

  const expenseData = {
    userId: req.user._id,
    category,
    subcategory: subcategory || '',
    title,
    description: description || '',
    amount,
    currency: currency || 'FRW',
    quantity: quantity || 1,
    unitPrice: unitPrice || null,
    expenseDate: new Date(expenseDate || new Date()),
    paymentMethod: paymentMethod || 'cash',
    location: location || '',
    vendor: vendor || '',
    tags: tags || [],
    notes: notes || '',
    receipt: receipt || '',
    photos: photos || [],
    isBusinessExpense: isBusinessExpense || false,
    isTaxDeductible: isTaxDeductible || false,
    source: source || null,
    projectId: null,
    assetId: null,
    farm: readFarm(farm)
  };

  if (projectId) {
    const project = await Project.findOne({ _id: projectId, userId: req.user._id, isActive: true });
    if (!project) {
      return res.status(400).json({
        success: false,
        message: 'Choose one of your projects, or leave the expense as general'
      });
    }
    expenseData.projectId = project._id;
  }

  if (assetId) {
    const asset = await Asset.findOne({ _id: assetId, userId: req.user._id, isActive: true });
    if (!asset) {
      return res.status(400).json({
        success: false,
        message: 'Choose one of your assets, or leave this expense unattached'
      });
    }
    expenseData.assetId = asset._id;
  }

  const expense = await Expense.create(expenseData);

  // Cash and the wallet are the same daily purse. Savings is a named jar.
  const sourceType = source?.type === 'cash' ? 'petty_cash' : source?.type;
  if (sourceType && amount > 0) {
    try {
      if (sourceType === 'savings' && source.sourceId) {
        // Reduce amount from savings
        const saving = await Savings.findOne({
          _id: source.sourceId,
          userId: req.user._id
        });

        if (!saving) {
          await Expense.findByIdAndDelete(expense._id);
          return res.status(404).json({
            success: false,
            message: 'Savings account not found'
          });
        }

        await saving.withdrawAmount(amount, `Expense: ${title || 'expense'}`, true);
      } else if (sourceType === 'petty_cash') {
        // Reduce amount from petty cash
        let pettyCash = await PettyCash.findOne({
          userId: req.user._id
        });

        if (!pettyCash) {
          pettyCash = await PettyCash.createDefault(req.user._id);
        }

        // Record withdrawal in petty cash. A short jar is allowed.
        pettyCash.currentBalance -= amount;
        pettyCash.lastUpdated = new Date();
        await pettyCash.save();

        // Create a withdrawal transaction
        await PettyCash.updateOne(
          { userId: req.user._id },
          {
            $push: {
              transactions: {
                type: 'expense',
                amount: amount,
                description: `Expense: ${title}`,
                referenceId: expense._id,
                referenceType: 'expense',
                date: new Date(),
                createdBy: req.user._id
              }
            }
          }
        );
      } else if (sourceType === 'salary') {
        const plan = await findSalaryPlan(req.user._id);
        if (!plan) {
          await Expense.findByIdAndDelete(expense._id);
          return res.status(400).json({
            success: false,
            message: 'Set a salary first, then expenses can come off it'
          });
        }
        if (plan.depositTo === 'savings' && plan.savingsId) {
          const saving = await Savings.findOne({ _id: plan.savingsId, userId: req.user._id });
          if (!saving) {
            await Expense.findByIdAndDelete(expense._id);
            return res.status(404).json({ success: false, message: 'The salary jar was not found' });
          }
          await saving.withdrawAmount(amount, `Expense from salary: ${title || 'expense'}`, true);
        } else {
          let pettyCash = await PettyCash.findOne({ userId: req.user._id });
          if (!pettyCash) pettyCash = await PettyCash.createDefault(req.user._id);
          pettyCash.currentBalance -= amount;
          pettyCash.lastUpdated = new Date();
          await pettyCash.save();
          await PettyCash.updateOne(
            { userId: req.user._id },
            {
              $push: {
                transactions: {
                  type: 'expense',
                  amount,
                  description: `Expense from salary: ${title}`,
                  referenceId: expense._id,
                  referenceType: 'expense',
                  date: new Date(),
                  createdBy: req.user._id
                }
              }
            }
          );
        }
        const named = await nameSalarySource(req.user._id, expense.source);
        expense.source.type = 'salary';
        expense.source.sourceId = named.sourceId || null;
        expense.source.sourceName = named.sourceName || 'Salary';
        await expense.save();
      }
    } catch (error) {
      await Expense.findByIdAndDelete(expense._id);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to reduce amount from source'
      });
    }
  }

  const fromName = sourceType === 'savings'
    ? (source.sourceName || 'savings')
    : sourceType === 'salary'
      ? 'salary'
      : 'wallet';
  if (String(repeat || '').toLowerCase() === 'monthly') {
    expense.isRecurring = true;
    expense.recurringPattern = 'monthly';
    expense.nextExpenseAt = advanceSendDate(expense.expenseDate, 'monthly');
    await expense.save();
  }

  await Transaction.create({
    userId: req.user._id,
    type: 'expense',
    amount,
    currency: expense.currency || 'FRW',
    category: String(category || 'other').slice(0, 50),
    subcategory: String(subcategory || '').slice(0, 50),
    date: expense.expenseDate,
    description: String(title || 'Expense').slice(0, 200),
    notes: `Taken from ${fromName}`,
    expenseId: expense._id,
    projectId: expense.projectId || null,
    status: 'completed'
  });
  await shiftInitialInvestment(req.user._id, expense.projectId, Number(amount) || 0);

  res.status(201).json({
    success: true,
    data: expense
  });
});

/**
 * @desc    Get expense statistics
 * @route   GET /expenses/stats
 * @access  Private
 */
const getExpenseStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { period = 'month' } = req.query;

  // Calculate date range based on period
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'all':
      startDate = new Date(0);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const stats = await Expense.aggregate([
    { 
      $match: { 
        userId: userId, 
        isActive: true,
        expenseDate: { $gte: startDate }
      } 
    },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        averageAmount: { $avg: '$amount' },
        businessExpenses: {
          $sum: { $cond: ['$isBusinessExpense', '$amount', 0] }
        },
        personalExpenses: {
          $sum: { $cond: ['$isBusinessExpense', 0, '$amount'] }
        },
        taxDeductible: {
          $sum: { $cond: ['$isTaxDeductible', '$amount', 0] }
        }
      }
    }
  ]);

  const categoryStats = await Expense.aggregate([
    { 
      $match: { 
        userId: userId, 
        isActive: true,
        expenseDate: { $gte: startDate }
      } 
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        averageAmount: { $avg: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  const monthlyStats = await Expense.aggregate([
    { 
      $match: { 
        userId: userId, 
        isActive: true,
        expenseDate: { $gte: startDate }
      } 
    },
    {
      $group: {
        _id: {
          year: { $year: '$expenseDate' },
          month: { $month: '$expenseDate' }
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  res.json({
    success: true,
    data: {
      period,
      startDate,
      endDate: now,
      overview: stats[0] || {
        totalExpenses: 0,
        totalAmount: 0,
        averageAmount: 0,
        businessExpenses: 0,
        personalExpenses: 0,
        taxDeductible: 0
      },
      byCategory: categoryStats,
      byMonth: monthlyStats
    }
  });
});

const updateExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id, isActive: true });
  if (!expense) {
    return res.status(404).json({ success: false, message: 'Expense not found' });
  }
  const nextAmount = req.body.amount != null ? Number(req.body.amount) : expense.amount;
  if (!(nextAmount >= 0)) {
    return res.status(400).json({ success: false, message: 'Enter the amount' });
  }
  const nextSource = req.body.source && req.body.source.type ? req.body.source : (expense.source || { type: 'cash' });
  const samePurse = String(nextSource.type || 'cash') === String(expense.source?.type || 'cash')
    && String(nextSource.sourceId || '') === String(expense.source?.sourceId || '');
  const title = String(req.body.title || expense.title || 'Expense');
  try {
    if (samePurse) {
      const diff = nextAmount - expense.amount;
      if (diff > 0) await purseTake(req.user._id, nextSource, diff, `Expense change: ${title}`, true);
      if (diff < 0) await purseReturn(req.user._id, expense.source, -diff, `Expense change: ${title}`);
    } else {
      await purseReturn(req.user._id, expense.source, expense.amount, `Expense moved: ${title}`);
      try {
        await purseTake(req.user._id, nextSource, nextAmount, `Expense: ${title}`, true);
      } catch (error) {
        await purseTake(req.user._id, expense.source, expense.amount, `Expense restored: ${title}`);
        throw error;
      }
    }
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message || 'Could not move that money' });
  }

  const previousAmount = Number(expense.amount || 0);
  if (req.body.title) expense.title = title;
  if (req.body.category) expense.category = req.body.category;
  if (req.body.subcategory != null) expense.subcategory = req.body.subcategory;
  if (req.body.expenseDate) expense.expenseDate = new Date(req.body.expenseDate);
  if (req.body.farm) expense.farm = readFarm(req.body.farm) || expense.farm;
  expense.amount = nextAmount;
  const namedSource = await nameSalarySource(req.user._id, nextSource);
  expense.source = {
    type: namedSource.type || 'cash',
    sourceId: namedSource.sourceId || null,
    sourceName: namedSource.sourceName || '',
    amount: nextAmount
  };
  if (String(req.body.repeat || '') === 'monthly') {
    expense.isRecurring = true;
    expense.recurringPattern = 'monthly';
    expense.nextExpenseAt = expense.nextExpenseAt || advanceSendDate(expense.expenseDate, 'monthly');
  } else if (req.body.repeat === 'once') {
    expense.isRecurring = false;
    expense.recurringPattern = 'none';
    expense.nextExpenseAt = null;
  }
  await expense.save();
  await shiftInitialInvestment(req.user._id, expense.projectId, nextAmount - previousAmount);
  await Transaction.updateMany(
    { userId: req.user._id, expenseId: expense._id },
    {
      $set: {
        amount: nextAmount,
        description: title.slice(0, 200),
        category: String(expense.category || 'other').slice(0, 50),
        subcategory: String(expense.subcategory || '').slice(0, 50),
        date: expense.expenseDate
      }
    }
  );
  res.json({ success: true, data: expense });
});

const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id, isActive: true });
  if (!expense) {
    return res.status(404).json({ success: false, message: 'Expense not found' });
  }
  try {
    await purseReturn(req.user._id, expense.source || { type: 'cash' }, expense.amount, `Expense removed: ${expense.title}`);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message || 'Could not return that money' });
  }
  expense.isActive = false;
  expense.isRecurring = false;
  expense.nextExpenseAt = null;
  await expense.save();
  await shiftInitialInvestment(req.user._id, expense.projectId, -Number(expense.amount || 0));
  await Transaction.deleteMany({ userId: req.user._id, expenseId: expense._id });
  res.json({ success: true, message: 'Expense removed and the money put back' });
});

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats
};
