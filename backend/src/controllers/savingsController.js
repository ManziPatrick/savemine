const Savings = require('../models/Savings');
const Expense = require('../models/Expense');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPaginationParams, getSortParams, createPaginatedResponse } = require('../utils/pagination');

/**
 * @desc    Get all savings for user
 * @route   GET /savings
 * @access  Private
 */
const getSavings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const sort = getSortParams(req.query, ['name', 'amount', 'location', 'createdAt']);
  
  const filter = { userId: req.user._id, isActive: true };
  
  // Add location filter
  if (req.query.location) {
    filter.location = req.query.location;
  }

  const savings = await Savings.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Savings.countDocuments(filter);

  res.json(createPaginatedResponse(savings, page, limit, total));
});

/**
 * @desc    Get single savings
 * @route   GET /savings/:id
 * @access  Private
 */
const getSaving = asyncHandler(async (req, res) => {
  const saving = await Savings.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!saving) {
    return res.status(404).json({
      success: false,
      message: 'Savings not found'
    });
  }

  res.json({
    success: true,
    data: { saving }
  });
});

/**
 * @desc    Create new savings
 * @route   POST /savings
 * @access  Private
 */
const createSavings = asyncHandler(async (req, res) => {
  const {
    name,
    location,
    amount,
    currency,
    targetAmount,
    targetDate,
    description,
    notes,
    accountNumber,
    interestRate
  } = req.body;

  const initialAmount = amount || 0;

  const savingsData = {
    userId: req.user._id,
    name,
    location,
    amount: initialAmount,
    currency: currency || 'FRW',
    targetAmount,
    targetDate,
    description,
    notes,
    accountNumber,
    interestRate
  };

  // Seed an opening-balance movement so the savings trend has a starting point
  if (initialAmount > 0) {
    savingsData.movements = [{
      type: 'deposit',
      amount: initialAmount,
      date: new Date(),
      notes: 'Opening balance',
      balanceAfter: initialAmount
    }];
  }

  const saving = await Savings.create(savingsData);

  res.status(201).json({
    success: true,
    message: 'Savings created successfully',
    data: { saving }
  });
});

/**
 * @desc    Update savings
 * @route   PUT /savings/:id
 * @access  Private
 */
const updateSavings = asyncHandler(async (req, res) => {
  const {
    name,
    location,
    amount,
    currency,
    targetAmount,
    targetDate,
    description,
    notes,
    accountNumber,
    interestRate
  } = req.body;

  const saving = await Savings.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!saving) {
    return res.status(404).json({
      success: false,
      message: 'Savings not found'
    });
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (location !== undefined) updateData.location = location;
  if (amount !== undefined) updateData.amount = amount;
  if (currency !== undefined) updateData.currency = currency;
  if (targetAmount !== undefined) updateData.targetAmount = targetAmount;
  if (targetDate !== undefined) updateData.targetDate = targetDate;
  if (description !== undefined) updateData.description = description;
  if (notes !== undefined) updateData.notes = notes;
  if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
  if (interestRate !== undefined) updateData.interestRate = interestRate;

  const updatedSaving = await Savings.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Savings updated successfully',
    data: { saving: updatedSaving }
  });
});

/**
 * @desc    Delete savings (soft delete)
 * @route   DELETE /savings/:id
 * @access  Private
 */
const deleteSavings = asyncHandler(async (req, res) => {
  const saving = await Savings.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!saving) {
    return res.status(404).json({
      success: false,
      message: 'Savings not found'
    });
  }

  // Soft delete by setting isActive to false
  saving.isActive = false;
  await saving.save();

  res.json({
    success: true,
    message: 'Savings deleted successfully'
  });
});

/**
 * @desc    Add amount to savings
 * @route   POST /savings/:id/add
 * @access  Private
 */
const addAmount = asyncHandler(async (req, res) => {
  const { amount, notes } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be positive'
    });
  }

  const saving = await Savings.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!saving) {
    return res.status(404).json({
      success: false,
      message: 'Savings not found'
    });
  }

  await saving.addAmount(amount, notes || '');

  res.json({
    success: true,
    message: 'Amount added successfully',
    data: { saving }
  });
});

/**
 * @desc    Withdraw amount from savings
 * @route   POST /savings/:id/withdraw
 * @access  Private
 */
const withdrawAmount = asyncHandler(async (req, res) => {
  const { amount, notes } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be positive'
    });
  }

  const saving = await Savings.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!saving) {
    return res.status(404).json({
      success: false,
      message: 'Savings not found'
    });
  }

  try {
    await saving.withdrawAmount(amount, notes || '');

    // Record the withdrawal as an expense too, so total spending history stays complete.
    // Non-fatal: if the expense record fails, the withdrawal itself already succeeded.
    try {
      await Expense.create({
        userId: req.user._id,
        category: 'other',
        title: `Withdrawal from savings: ${saving.name}`,
        description: notes || `Withdrew ${saving.currency} ${amount} from ${saving.name}`,
        amount,
        currency: saving.currency,
        expenseDate: new Date(),
        paymentMethod: 'other',
        isBusinessExpense: false,
        isTaxDeductible: false,
        source: {
          type: 'savings',
          sourceId: saving._id,
          sourceName: saving.name,
          amount
        }
      });
    } catch (expenseError) {
      console.error('Failed to record savings withdrawal expense:', expenseError.message);
    }

    res.json({
      success: true,
      message: 'Amount withdrawn successfully',
      data: { saving }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @desc    Get savings statistics
 * @route   GET /savings/stats
 * @access  Private
 */
const getSavingsStats = asyncHandler(async (req, res) => {
  const stats = await Savings.aggregate([
    { $match: { userId: req.user._id, isActive: true } },
    {
      $group: {
        _id: '$location',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    }
  ]);

  const totalSavings = await Savings.aggregate([
    { $match: { userId: req.user._id, isActive: true } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalTarget: { $sum: '$targetAmount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const locationBreakdown = stats.reduce((acc, stat) => {
    acc[stat._id] = {
      totalAmount: stat.totalAmount,
      count: stat.count,
      avgAmount: stat.avgAmount
    };
    return acc;
  }, {});

  // Monthly trend from movement history (deposits vs withdrawals, last 12 months)
  const monthlyTrend = await Savings.aggregate([
    { $match: { userId: req.user._id, isActive: true } },
    { $unwind: '$movements' },
    {
      $group: {
        _id: {
          year: { $year: '$movements.date' },
          month: { $month: '$movements.date' }
        },
        deposits: {
          $sum: { $cond: [{ $eq: ['$movements.type', 'deposit'] }, '$movements.amount', 0] }
        },
        withdrawals: {
          $sum: { $cond: [{ $eq: ['$movements.type', 'withdrawal'] }, '$movements.amount', 0] }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);

  const overall = totalSavings[0] || { totalAmount: 0, totalTarget: 0, count: 0 };

  res.json({
    success: true,
    data: {
      overall,
      locationBreakdown,
      monthlyTrend
    }
  });
});

/**
 * @desc    Get savings by location
 * @route   GET /savings/location/:location
 * @access  Private
 */
const getSavingsByLocation = asyncHandler(async (req, res) => {
  const { location } = req.params;
  
  if (!['SACCO', 'MTN MoMo', 'Bank', 'Cash'].includes(location)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid location'
    });
  }

  const savings = await Savings.find({
    userId: req.user._id,
    location: location,
    isActive: true
  }).sort({ name: 1 });

  res.json({
    success: true,
    data: { savings }
  });
});

module.exports = {
  getSavings,
  getSaving,
  createSavings,
  updateSavings,
  deleteSavings,
  addAmount,
  withdrawAmount,
  getSavingsStats,
  getSavingsByLocation
};


