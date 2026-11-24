const mongoose = require('mongoose');
const Investment = require('../models/Investment');
const Savings = require('../models/Savings');
const PettyCash = require('../models/PettyCash');
const Transaction = require('../models/Transaction');
const Expense = require('../models/Expense');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPaginationParams, getSortParams, createPaginatedResponse } = require('../utils/pagination');

/**
 * @desc    Get all investments for user
 * @route   GET /investments
 * @access  Private
 */
const getInvestments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const sort = getSortParams(req.query, ['startDate', 'currentValue', 'createdAt']);
  
  const filter = { userId: req.user._id, isActive: true };
  
  // Add investment type filter
  if (req.query.investmentType) {
    filter.investmentType = req.query.investmentType;
  }
  
  // Add risk level filter
  if (req.query.riskLevel) {
    filter.riskLevel = req.query.riskLevel;
  }
  
  // Add status filter
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const investments = await Investment.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Investment.countDocuments(filter);

  res.json(createPaginatedResponse(investments, page, limit, total));
});

/**
 * @desc    Get single investment
 * @route   GET /investments/:id
 * @access  Private
 */
const getInvestment = asyncHandler(async (req, res) => {
  const investment = await Investment.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!investment) {
    return res.status(404).json({
      success: false,
      message: 'Investment not found'
    });
  }

  res.json({
    success: true,
    data: investment
  });
});

/**
 * @desc    Create new investment
 * @route   POST /investments
 * @access  Private
 */
const createInvestment = asyncHandler(async (req, res) => {
  const {
    investmentType,
    name,
    description,
    symbol,
    initialAmount,
    currentValue,
    currency,
    startDate,
    maturityDate,
    interestRate,
    riskLevel,
    status,
    isRecurring,
    recurringAmount,
    recurringFrequency,
    targetAmount,
    targetDate,
    targetReturn,
    location,
    accountNumber,
    broker,
    tags,
    notes,
    source
  } = req.body;

  const investmentData = {
    userId: req.user._id,
    investmentType: investmentType || 'savings',
    name,
    description: description || '',
    symbol: symbol || '',
    initialAmount: initialAmount || 0,
    currentValue: currentValue || 0,
    currency: currency || 'FRW',
    startDate: new Date(startDate || new Date()),
    maturityDate: maturityDate ? new Date(maturityDate) : null,
    interestRate: interestRate || 0,
    riskLevel: riskLevel || 'medium',
    status: status || 'active',
    isRecurring: isRecurring || false,
    recurringAmount: recurringAmount || null,
    recurringFrequency: recurringFrequency || 'monthly',
    targetAmount: targetAmount || null,
    targetDate: targetDate ? new Date(targetDate) : null,
    targetReturn: targetReturn || null,
    location: location || '',
    accountNumber: accountNumber || '',
    broker: broker || '',
    tags: tags || [],
    notes: notes || '',
    source: {
      type: source?.type === 'savings' ? 'savings' : 'wallet',
      sourceId: source?.type === 'savings' ? source.sourceId : null,
      sourceName: source?.sourceName || (source?.type === 'savings' ? 'Savings' : 'Wallet')
    }
  };

  const investment = new Investment(investmentData);
  await investment.validate();

  const amount = Number(initialAmount) || 0;
  if (amount > 0) {
    if (investmentData.source.type === 'savings') {
      if (!investmentData.source.sourceId) {
        return res.status(400).json({ success: false, message: 'Choose a savings jar for this investment' });
      }
      const saving = await Savings.findOne({ _id: investmentData.source.sourceId, userId: req.user._id });
      if (!saving) {
        return res.status(400).json({ success: false, message: 'Choose a savings jar for this investment' });
      }
      if (amount > saving.amount) {
        return res.status(400).json({
          success: false,
          message: `Not enough in ${saving.name}. Available: ${saving.amount}`
        });
      }
      await saving.withdrawAmount(amount, `Investment: ${name}`);
      investment.source.sourceName = saving.name;
      investment.markModified('source');
    } else {
      let wallet = await PettyCash.findOne({ userId: req.user._id });
      if (!wallet) wallet = await PettyCash.createDefault(req.user._id);
      if (amount > wallet.currentBalance) {
        return res.status(400).json({
          success: false,
          message: `Not enough in the wallet. Available: ${wallet.currentBalance}`
        });
      }
      await wallet.addTransaction('expense', amount, `Investment: ${name}`);
      investment.source.sourceName = 'Wallet';
      investment.markModified('source');
    }
  }

  await investment.save();
  if (amount > 0) {
    const fromName = investment.source.sourceName || 'Wallet';
    const expense = await Expense.create({
      userId: req.user._id,
      category: 'investment',
      subcategory: investment.investmentType,
      title: String(name || 'Investment').slice(0, 200),
      amount,
      currency: investment.currency || 'FRW',
      expenseDate: investment.startDate,
      paymentMethod: 'cash',
      notes: `Taken from ${fromName}`,
      source: {
        type: investment.source.type === 'savings' ? 'savings' : 'petty_cash',
        sourceId: investment.source.sourceId,
        sourceName: fromName,
        amount
      }
    });
    await Transaction.create({
      userId: req.user._id,
      type: 'expense',
      amount,
      currency: investment.currency || 'FRW',
      category: 'investment',
      date: investment.startDate,
      description: String(name || 'Investment').slice(0, 200),
      notes: `Taken from ${fromName}`,
      expenseId: expense._id,
      status: 'completed'
    });
  }

  res.status(201).json({
    success: true,
    data: investment
  });
});

/**
 * @desc    Update investment
 * @route   PUT /investments/:id
 * @access  Private
 */
const updateInvestment = asyncHandler(async (req, res) => {
  const investment = await Investment.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!investment) {
    return res.status(404).json({
      success: false,
      message: 'Investment not found'
    });
  }

  const updatedInvestment = await Investment.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: updatedInvestment
  });
});

/**
 * @desc    Delete investment
 * @route   DELETE /investments/:id
 * @access  Private
 */
const deleteInvestment = asyncHandler(async (req, res) => {
  const investment = await Investment.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!investment) {
    return res.status(404).json({
      success: false,
      message: 'Investment not found'
    });
  }

  // Soft delete
  investment.isActive = false;
  await investment.save();

  res.json({
    success: true,
    message: 'Investment deleted successfully'
  });
});

/**
 * @desc    Update investment value
 * @route   POST /investments/:id/update-value
 * @access  Private
 */
const updateInvestmentValue = asyncHandler(async (req, res) => {
  const { value, notes } = req.body;
  
  const investment = await Investment.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!investment) {
    return res.status(404).json({
      success: false,
      message: 'Investment not found'
    });
  }

  const updatedInvestment = await investment.updateValue(value, notes);

  res.json({
    success: true,
    data: updatedInvestment
  });
});

/**
 * @desc    Add dividend to investment
 * @route   POST /investments/:id/dividends
 * @access  Private
 */
const addDividend = asyncHandler(async (req, res) => {
  const { amount, type, notes } = req.body;
  
  const investment = await Investment.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!investment) {
    return res.status(404).json({
      success: false,
      message: 'Investment not found'
    });
  }

  const updatedInvestment = await investment.addDividend(amount, type, notes);

  res.json({
    success: true,
    data: updatedInvestment
  });
});

/**
 * @desc    Get investment statistics
 * @route   GET /investments/stats
 * @access  Private
 */
const getInvestmentStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const stats = await Investment.aggregate([
    { $match: { userId: userId, isActive: true } },
    {
      $group: {
        _id: null,
        totalInvestments: { $sum: 1 },
        totalInvested: { $sum: '$initialAmount' },
        currentValue: { $sum: '$currentValue' },
        totalReturn: { $sum: { $subtract: ['$currentValue', '$initialAmount'] } },
        totalReturnPercentage: {
          $avg: {
            $cond: [
              { $gt: ['$initialAmount', 0] },
              { $multiply: [{ $divide: [{ $subtract: ['$currentValue', '$initialAmount'] }, '$initialAmount'] }, 100] },
              0
            ]
          }
        }
      }
    }
  ]);

  const typeStats = await Investment.aggregate([
    { $match: { userId: userId, isActive: true } },
    {
      $group: {
        _id: '$investmentType',
        count: { $sum: 1 },
        totalInvested: { $sum: '$initialAmount' },
        currentValue: { $sum: '$currentValue' },
        avgReturnPercentage: {
          $avg: {
            $cond: [
              { $gt: ['$initialAmount', 0] },
              { $multiply: [{ $divide: [{ $subtract: ['$currentValue', '$initialAmount'] }, '$initialAmount'] }, 100] },
              0
            ]
          }
        }
      }
    }
  ]);

  const riskStats = await Investment.aggregate([
    { $match: { userId: userId, isActive: true } },
    {
      $group: {
        _id: '$riskLevel',
        count: { $sum: 1 },
        totalValue: { $sum: '$currentValue' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      overview: stats[0] || {
        totalInvestments: 0,
        totalInvested: 0,
        currentValue: 0,
        totalReturn: 0,
        totalReturnPercentage: 0
      },
      byType: typeStats,
      byRisk: riskStats
    }
  });
});

module.exports = {
  getInvestments,
  getInvestment,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  updateInvestmentValue,
  addDividend,
  getInvestmentStats
};

