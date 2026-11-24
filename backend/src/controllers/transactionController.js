const Transaction = require('../models/Transaction');
const Contact = require('../models/Contact');
const { asyncHandler } = require('../middleware/errorHandler');
const { placeIncome, addProjectIncome, isSalary, normalizeSplits, primaryPurse, receivePlan } = require('../services/incomeSchedule');
const { advanceSendDate, repeats } = require('../services/dispatchSchedule');

function nextIncomeDate(from, frequency) {
  let next = advanceSendDate(from, frequency);
  const now = new Date();
  let guard = 0;
  while (next && next <= now && guard < 24) {
    next = advanceSendDate(next, frequency);
    guard += 1;
  }
  return next;
}
const { getPaginationParams, getSortParams, createPaginatedResponse, createDateRangeFilter } = require('../utils/pagination');

/**
 * @desc    Get all transactions for user
 * @route   GET /transactions
 * @access  Private
 */
const getTransactions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const sort = getSortParams(req.query, ['date', 'amount', 'category', 'createdAt']);
  
  const filter = { userId: req.user._id };
  
  // Add type filter
  if (req.query.type) {
    filter.type = req.query.type;
  }
  
  // Add category filter
  if (req.query.category) {
    filter.category = req.query.category;
  }
  
  // Add status filter
  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  // Add contact filter
  if (req.query.contactId) {
    filter.contactId = req.query.contactId;
  }
  
  // Add date range filter
  const dateFilter = createDateRangeFilter(req.query, 'date');
  Object.assign(filter, dateFilter);

  const transactions = await Transaction.find(filter)
    .populate('contactId', 'name phone type')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Transaction.countDocuments(filter);

  res.json(createPaginatedResponse(transactions, page, limit, total));
});

/**
 * @desc    Get single transaction
 * @route   GET /transactions/:id
 * @access  Private
 */
const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    userId: req.user._id
  }).populate('contactId', 'name phone type email');

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  res.json({
    success: true,
    data: { transaction }
  });
});

/**
 * @desc    Create new transaction
 * @route   POST /transactions
 * @access  Private
 */
const createTransaction = asyncHandler(async (req, res) => {
  const {
    type,
    amount,
    currency,
    category,
    subcategory,
    date,
    description,
    notes,
    contactId,
    tags,
    repeat,
    depositTo,
    savingsId,
    projectId
  } = req.body;

  // Verify contact belongs to user if provided
  if (contactId) {
    const contact = await Contact.findOne({
      _id: contactId,
      userId: req.user._id
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
  }

  const when = date ? new Date(date) : new Date();
  const frequency = repeats(repeat) ? repeat : null;
  const salary = type === 'income' && isSalary({ category, description });
  const purse = type === 'income' && depositTo === 'savings' ? 'savings' : 'wallet';
  let placed = '';
  let linkedProject = null;
  let splits = [];
  if (salary) {
    const requested = Array.isArray(req.body.splits) && req.body.splits.length
      ? req.body.splits
      : [{
        place: purse,
        savingsId: purse === 'savings' ? savingsId : null,
        amount: Number(amount)
      }];
    splits = await normalizeSplits(req.user._id, requested, amount);
  } else if (type === 'income') {
    placed = await placeIncome(req.user._id, Number(amount), {
      depositTo: purse,
      savingsId: purse === 'savings' ? savingsId : null
    }, description || category || 'Income');
    if (projectId) {
      linkedProject = await addProjectIncome(req.user._id, projectId, {
        date: when,
        title: description || category || 'Income',
        amount: Number(amount),
        category: category || 'income'
      });
    }
  }
  const salaryPurse = splits.length ? primaryPurse(splits) : null;

  const transactionData = {
    userId: req.user._id,
    type,
    amount,
    currency: currency || 'FRW',
    category,
    subcategory,
    date: when,
    description,
    notes: salary
      ? 'Waiting to be marked received. The wallet and savings update then.'
      : type === 'income'
        ? `Added to ${placed}${linkedProject ? ` from ${linkedProject.name}` : ''}${frequency ? `. Repeats ${frequency}` : ''}`
        : notes,
    projectId: linkedProject ? linkedProject._id : (projectId || null),
    contactId,
    tags: tags || [],
    depositTo: salaryPurse ? salaryPurse.depositTo : (type === 'income' ? purse : 'wallet'),
    savingsId: salaryPurse ? salaryPurse.savingsId : (purse === 'savings' ? savingsId : null),
    splits,
    isRecurring: Boolean(frequency),
    recurringPattern: frequency ? { frequency, interval: 1 } : null,
    nextIncomeAt: frequency ? nextIncomeDate(when, frequency) : null,
    status: salary ? 'pending' : 'completed'
  };

  const transaction = await Transaction.create(transactionData);

  // Populate the created transaction
  await transaction.populate('contactId', 'name phone type');

  res.status(201).json({
    success: true,
    message: 'Transaction created successfully',
    data: { transaction }
  });
});

/**
 * @desc    Raise a salary. The extra is added now, and later months use the new amount.
 * @route   PUT /transactions/:id/salary
 * @access  Private
 */
const raiseSalary = asyncHandler(async (req, res) => {
  const next = Number(req.body.amount);
  const plan = await Transaction.findOne({
    _id: req.params.id,
    userId: req.user._id,
    type: 'income'
  });

  if (!plan) {
    return res.status(404).json({ success: false, message: 'Salary not found' });
  }
  if (!Number.isFinite(next) || next <= Number(plan.amount)) {
    return res.status(400).json({
      success: false,
      message: 'Enter a salary higher than the current one'
    });
  }

  plan.amount = next;
  plan.isRecurring = true;
  plan.recurringPattern = plan.recurringPattern?.frequency
    ? plan.recurringPattern
    : { frequency: 'monthly', interval: 1 };
  if (!plan.splits?.length || plan.splits.length === 1) {
    plan.splits = [{
      place: plan.depositTo === 'savings' && plan.savingsId ? 'savings' : 'wallet',
      savingsId: plan.depositTo === 'savings' ? plan.savingsId : null,
      name: plan.depositTo === 'savings' ? (plan.splits?.[0]?.name || 'Savings') : 'Wallet',
      amount: next
    }];
  }
  if (!plan.nextIncomeAt) {
    plan.nextIncomeAt = nextIncomeDate(plan.date || new Date(), plan.recurringPattern.frequency || 'monthly');
  }
  plan.status = 'pending';
  plan.notes = `Salary is ${next}. Mark it received and the split updates the wallet and savings.`;
  await plan.save();

  res.json({
    success: true,
    message: 'Salary increased',
    data: { transaction: plan }
  });
});

/**
 * @desc    Update transaction
 * @route   PUT /transactions/:id
 * @access  Private
 */
const updateTransaction = asyncHandler(async (req, res) => {
  const {
    type,
    amount,
    currency,
    category,
    subcategory,
    date,
    description,
    notes,
    contactId,
    tags,
    status
  } = req.body;

  const transaction = await Transaction.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  // Don't allow updating completed transactions
  if (transaction.status === 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update completed transactions'
    });
  }

  // Verify contact belongs to user if provided
  if (contactId) {
    const contact = await Contact.findOne({
      _id: contactId,
      userId: req.user._id
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
  }

  const updateData = {};
  if (type !== undefined) updateData.type = type;
  if (amount !== undefined) updateData.amount = amount;
  if (currency !== undefined) updateData.currency = currency;
  if (category !== undefined) updateData.category = category;
  if (subcategory !== undefined) updateData.subcategory = subcategory;
  if (date !== undefined) updateData.date = date;
  if (description !== undefined) updateData.description = description;
  if (notes !== undefined) updateData.notes = notes;
  if (contactId !== undefined) updateData.contactId = contactId;
  if (tags !== undefined) updateData.tags = tags;
  if (status !== undefined) updateData.status = status;

  const updatedTransaction = await Transaction.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('contactId', 'name phone type');

  res.json({
    success: true,
    message: 'Transaction updated successfully',
    data: { transaction: updatedTransaction }
  });
});

/**
 * @desc    Delete transaction
 * @route   DELETE /transactions/:id
 * @access  Private
 */
const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  await Transaction.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Transaction deleted successfully'
  });
});

/**
 * @desc    Get transaction statistics
 * @route   GET /transactions/stats
 * @access  Private
 */
const getTransactionStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const dateFilter = createDateRangeFilter(req.query, 'date');

  const matchStage = {
    userId: req.user._id,
    ...dateFilter,
    $nor: [{
      $and: [
        { type: 'income' },
        { $or: [
          { category: { $regex: 'salary', $options: 'i' } },
          { description: { $regex: 'salary', $options: 'i' } }
        ] },
        { $or: [
          { lastReceivedAt: null },
          { lastReceivedAt: { $exists: false } },
          { nextIncomeAt: { $ne: null, $lte: new Date() } }
        ] }
      ]
    }]
  };

  const stats = await Transaction.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    }
  ]);

  const categoryStats = await Transaction.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { type: '$type', category: '$category' },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalAmount: -1 } },
    { $limit: 10 }
  ]);

  const monthlyStats = await Transaction.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type'
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);

  const typeBreakdown = stats.reduce((acc, stat) => {
    acc[stat._id] = {
      totalAmount: stat.totalAmount,
      count: stat.count,
      avgAmount: stat.avgAmount
    };
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      typeBreakdown,
      categoryStats,
      monthlyStats
    }
  });
});

/**
 * @desc    Get transactions by category
 * @route   GET /transactions/categories
 * @access  Private
 */
const getTransactionsByCategory = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const dateFilter = createDateRangeFilter(req.query, 'date');
  
  const matchStage = { userId: req.user._id, ...dateFilter };
  if (type) matchStage.type = type;

  const categories = await Transaction.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  res.json({
    success: true,
    data: { categories }
  });
});

/**
 * @desc    Upload attachment for transaction
 * @route   POST /transactions/:id/attachment
 * @access  Private
 */
const uploadAttachment = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Attachment file is required'
    });
  }

  // Update transaction with attachment path
  transaction.attachmentPath = req.file.path;
  await transaction.save();

  res.json({
    success: true,
    message: 'Attachment uploaded successfully',
    data: {
      attachmentPath: transaction.attachmentPath
    }
  });
});

const saveSplits = asyncHandler(async (req, res) => {
  const plan = await Transaction.findOne({
    _id: req.params.id,
    userId: req.user._id,
    type: 'income'
  });
  if (!plan) {
    return res.status(404).json({ success: false, message: 'Income not found' });
  }
  const splits = await normalizeSplits(req.user._id, req.body.splits, plan.amount);
  const purse = primaryPurse(splits);
  plan.splits = splits;
  plan.depositTo = purse.depositTo;
  plan.savingsId = purse.savingsId;
  await plan.save();
  res.json({
    success: true,
    message: 'Split saved',
    data: { transaction: plan }
  });
});

const receiveIncome = asyncHandler(async (req, res) => {
  const plan = await Transaction.findOne({
    _id: req.params.id,
    userId: req.user._id,
    type: 'income'
  });
  if (!plan) {
    return res.status(404).json({ success: false, message: 'Income not found' });
  }
  if (Array.isArray(req.body.splits) && req.body.splits.length) {
    const splits = await normalizeSplits(req.user._id, req.body.splits, plan.amount);
    const purse = primaryPurse(splits);
    plan.splits = splits;
    plan.depositTo = purse.depositTo;
    plan.savingsId = purse.savingsId;
  }
  const saved = await receivePlan(plan);
  res.json({
    success: true,
    message: 'Pay received. The wallet and savings are updated.',
    data: { transaction: saved }
  });
});

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  raiseSalary,
  saveSplits,
  receiveIncome,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  getTransactionsByCategory,
  uploadAttachment
};


