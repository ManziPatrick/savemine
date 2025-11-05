const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Savings = require('../models/Savings');
const PettyCash = require('../models/PettyCash');
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
    source
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
    source: source || null
  };

  const expense = await Expense.create(expenseData);

  // If source is specified, reduce the amount from the selected source
  // Cash doesn't need reduction as it's not tracked
  if (source && source.type && source.type !== 'cash' && source.sourceId && amount > 0) {
    try {
      if (source.type === 'savings') {
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

        if (amount > saving.amount) {
          await Expense.findByIdAndDelete(expense._id);
          return res.status(400).json({
            success: false,
            message: `Insufficient funds in savings account. Available: ${saving.currency} ${saving.amount}`
          });
        }

        await saving.withdrawAmount(amount);
      } else if (source.type === 'petty_cash') {
        // Reduce amount from petty cash
        const pettyCash = await PettyCash.findOne({
          userId: req.user._id
        });

        if (!pettyCash) {
          await Expense.findByIdAndDelete(expense._id);
          return res.status(404).json({
            success: false,
            message: 'Petty cash account not found'
          });
        }

        if (amount > pettyCash.currentBalance) {
          await Expense.findByIdAndDelete(expense._id);
          return res.status(400).json({
            success: false,
            message: `Insufficient funds in petty cash. Available: ${pettyCash.currency} ${pettyCash.currentBalance}`
          });
        }

        // Record withdrawal in petty cash
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
      }
    } catch (error) {
      await Expense.findByIdAndDelete(expense._id);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to reduce amount from source'
      });
    }
  }

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

module.exports = {
  getExpenses,
  createExpense,
  getExpenseStats
};
