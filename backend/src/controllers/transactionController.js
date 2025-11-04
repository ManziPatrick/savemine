const Transaction = require('../models/Transaction');
const Contact = require('../models/Contact');
const { asyncHandler } = require('../middleware/errorHandler');
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
    isRecurring,
    recurringPattern
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

  const transactionData = {
    userId: req.user._id,
    type,
    amount,
    currency: currency || 'FRW',
    category,
    subcategory,
    date: date || new Date(),
    description,
    notes,
    contactId,
    tags: tags || [],
    isRecurring: isRecurring || false,
    recurringPattern: recurringPattern || null
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
  
  const matchStage = { userId: req.user._id, ...dateFilter };

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

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  getTransactionsByCategory,
  uploadAttachment
};


