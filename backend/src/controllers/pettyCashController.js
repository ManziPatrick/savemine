const mongoose = require('mongoose');
const PettyCash = require('../models/PettyCash');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPaginationParams, getSortParams, createPaginatedResponse } = require('../utils/pagination');

/**
 * @desc    Get petty cash account for user
 * @route   GET /petty-cash
 * @access  Private
 */
const getPettyCash = asyncHandler(async (req, res) => {
  let pettyCash = await PettyCash.findByUserId(req.user._id);

  // Create default petty cash account if none exists
  if (!pettyCash) {
    pettyCash = await PettyCash.createDefault(req.user._id);
  }

  res.json({
    success: true,
    data: pettyCash
  });
});

/**
 * @desc    Update petty cash account
 * @route   PUT /petty-cash
 * @access  Private
 */
const updatePettyCash = asyncHandler(async (req, res) => {
  const { name, description, settings, tags, notes } = req.body;

  let pettyCash = await PettyCash.findByUserId(req.user._id);

  if (!pettyCash) {
    pettyCash = await PettyCash.createDefault(req.user._id);
  }

  const updatedPettyCash = await PettyCash.findByIdAndUpdate(
    pettyCash._id,
    {
      name: name || pettyCash.name,
      description: description || pettyCash.description,
      settings: { ...pettyCash.settings, ...settings },
      tags: tags || pettyCash.tags,
      notes: notes || pettyCash.notes
    },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: updatedPettyCash
  });
});

/**
 * @desc    Add money to petty cash
 * @route   POST /petty-cash/deposit
 * @access  Private
 */
const addDeposit = asyncHandler(async (req, res) => {
  const { amount, description, source } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be greater than 0'
    });
  }

  let pettyCash = await PettyCash.findByUserId(req.user._id);

  if (!pettyCash) {
    pettyCash = await PettyCash.createDefault(req.user._id);
  }

  await pettyCash.addTransaction(
    'deposit',
    amount,
    description || `Deposit from ${source || 'unknown source'}`,
    null,
    'manual'
  );

  res.json({
    success: true,
    data: pettyCash,
    message: `Successfully added ${amount} to petty cash`
  });
});

/**
 * @desc    Withdraw money from petty cash
 * @route   POST /petty-cash/withdraw
 * @access  Private
 */
const makeWithdrawal = asyncHandler(async (req, res) => {
  const { amount, description, purpose } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be greater than 0'
    });
  }

  let pettyCash = await PettyCash.findByUserId(req.user._id);

  if (!pettyCash) {
    pettyCash = await PettyCash.createDefault(req.user._id);
  }

  if (!pettyCash.canWithdraw(amount)) {
    return res.status(400).json({
      success: false,
      message: 'Insufficient funds in petty cash'
    });
  }

  await pettyCash.addTransaction(
    'withdrawal',
    amount,
    description || `Withdrawal for ${purpose || 'unknown purpose'}`,
    null,
    'manual'
  );

  res.json({
    success: true,
    data: pettyCash,
    message: `Successfully withdrew ${amount} from petty cash`
  });
});

/**
 * @desc    Get petty cash transactions
 * @route   GET /petty-cash/transactions
 * @access  Private
 */
const getTransactions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const sort = getSortParams(req.query, ['date', 'amount', 'type']);

  let pettyCash = await PettyCash.findByUserId(req.user._id);

  if (!pettyCash) {
    pettyCash = await PettyCash.createDefault(req.user._id);
  }

  // Get transactions with pagination
  const transactions = pettyCash.transactions
    .sort((a, b) => {
      const aDate = new Date(a.date);
      const bDate = new Date(b.date);
      
      if (sort.date === -1) {
        return bDate - aDate;
      } else {
        return aDate - bDate;
      }
    })
    .slice(skip, skip + limit);

  const total = pettyCash.transactions.length;

  res.json(createPaginatedResponse(transactions, page, limit, total));
});

/**
 * @desc    Get petty cash statistics
 * @route   GET /petty-cash/stats
 * @access  Private
 */
const getPettyCashStats = asyncHandler(async (req, res) => {
  let pettyCash = await PettyCash.findByUserId(req.user._id);

  if (!pettyCash) {
    pettyCash = await PettyCash.createDefault(req.user._id);
  }

  const stats = {
    currentBalance: pettyCash.currentBalance,
    totalDeposits: pettyCash.totalDeposits,
    totalWithdrawals: pettyCash.totalWithdrawals,
    transactionCount: pettyCash.transactions.length,
    lowBalanceAlert: pettyCash.getLowBalanceAlert(),
    recentTransactions: pettyCash.transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
  };

  // Calculate monthly stats
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const monthlyTransactions = pettyCash.transactions.filter(t => 
    new Date(t.date) >= currentMonth
  );

  const monthlyStats = {
    deposits: monthlyTransactions
      .filter(t => t.type === 'deposit' || t.type === 'loan_repaid' || t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    withdrawals: monthlyTransactions
      .filter(t => t.type === 'withdrawal' || t.type === 'loan_given' || t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
    transactionCount: monthlyTransactions.length
  };

  res.json({
    success: true,
    data: {
      overview: stats,
      monthly: monthlyStats
    }
  });
});

/**
 * @desc    Process loan transaction (internal use)
 * @access  Private
 */
const processLoanTransaction = asyncHandler(async (userId, amount, type, loanId, description) => {
  let pettyCash = await PettyCash.findByUserId(userId);

  if (!pettyCash) {
    pettyCash = await PettyCash.createDefault(userId);
  }

  if (type === 'loan_given') {
    if (!pettyCash.canWithdraw(amount)) {
      throw new Error('Insufficient funds in petty cash');
    }
  }

  // Ensure description is always provided (required field)
  const transactionDescription = description || `${type === 'loan_given' ? 'Loan given' : 'Loan repayment'} - ${amount} ${pettyCash.currency}`;

  await pettyCash.addTransaction(
    type,
    amount,
    transactionDescription,
    loanId,
    'loan'
  );

  return pettyCash;
});

module.exports = {
  getPettyCash,
  updatePettyCash,
  addDeposit,
  makeWithdrawal,
  getTransactions,
  getPettyCashStats,
  processLoanTransaction
};

