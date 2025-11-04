const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const Contact = require('../models/Contact');
const Savings = require('../models/Savings');
const Business = require('../models/Business');
const { processLoanTransaction } = require('./pettyCashController');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPaginationParams, getSortParams, createPaginatedResponse } = require('../utils/pagination');

/**
 * @desc    Get all loans for user
 * @route   GET /loans
 * @access  Private
 */
const getLoans = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const sort = getSortParams(req.query, ['loanDate', 'dueDate', 'totalAmount', 'status', 'createdAt']);
  
  const filter = { userId: req.user._id, isActive: true };
  
  // Add status filter
  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  // Add loan type filter
  if (req.query.loanType) {
    filter.loanType = req.query.loanType;
  }
  
  // Add overdue filter
  if (req.query.overdue === 'true') {
    filter.dueDate = { $lt: new Date() };
    filter.status = 'active';
  }

  const loans = await Loan.find(filter)
    .populate('contactId', 'name phone type email')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Loan.countDocuments(filter);

  res.json(createPaginatedResponse(loans, page, limit, total));
});

/**
 * @desc    Get single loan
 * @route   GET /loans/:id
 * @access  Private
 */
const getLoan = asyncHandler(async (req, res) => {
  const loan = await Loan.findOne({
    _id: req.params.id,
    userId: req.user._id
  }).populate('contactId', 'name phone type email address');

  if (!loan) {
    return res.status(404).json({
      success: false,
      message: 'Loan not found'
    });
  }

  res.json({
    success: true,
    data: loan
  });
});

/**
 * @desc    Create new loan
 * @route   POST /loans
 * @access  Private
 */
const createLoan = asyncHandler(async (req, res) => {
  const {
    contactId,
    loanType,
    principalAmount,
    interestRate,
    interestType,
    dueDate,
    paymentFrequency,
    installmentAmount,
    collateral,
    notes,
    tags,
    reminderSettings,
    source
  } = req.body;

  // Validate contact exists
  const contact = await Contact.findOne({
    _id: contactId,
    userId: req.user._id,
    isActive: true
  });

  if (!contact) {
    return res.status(400).json({
      success: false,
      message: 'Contact not found'
    });
  }

  // Validate source
  if (!source || !source.type || !source.sourceName || !source.amount) {
    return res.status(400).json({
      success: false,
      message: 'Source information is required (type, sourceName, amount)'
    });
  }

  // Validate source type
  const validSourceTypes = ['petty_cash', 'income', 'savings', 'business', 'other'];
  if (!validSourceTypes.includes(source.type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid source type'
    });
  }

  // Validate source amount matches principal amount
  if (source.amount !== principalAmount) {
    return res.status(400).json({
      success: false,
      message: 'Source amount must match principal amount'
    });
  }

  // ROCK-SOLID FINANCIAL VALIDATION - NO EXCEPTIONS!
  let sourceAccount = null;
  let hasSufficientFunds = false;
  let availableBalance = 0;
  
  switch (source.type) {
    case 'savings':
      sourceAccount = await Savings.findOne({
        _id: source.sourceId,
        userId: req.user._id,
        isActive: true
      });
      if (!sourceAccount) {
        return res.status(400).json({
          success: false,
          message: 'Savings account not found or not accessible'
        });
      }
      availableBalance = sourceAccount.currentBalance;
      hasSufficientFunds = availableBalance >= source.amount;
      break;
      
    case 'business':
      sourceAccount = await Business.findOne({
        _id: source.sourceId,
        userId: req.user._id,
        isActive: true
      });
      if (!sourceAccount) {
        return res.status(400).json({
          success: false,
          message: 'Business account not found or not accessible'
        });
      }
      availableBalance = sourceAccount.currentBalance;
      hasSufficientFunds = availableBalance >= source.amount;
      break;
      
    case 'petty_cash':
      const PettyCash = require('../models/PettyCash');
      sourceAccount = await PettyCash.findOne({ userId: req.user._id });
      if (!sourceAccount) {
        return res.status(400).json({
          success: false,
          message: 'Petty cash account not found. Please contact support.'
        });
      }
      availableBalance = sourceAccount.currentBalance;
      hasSufficientFunds = availableBalance >= source.amount;
      break;
      
    case 'income':
      // For income, we need to check if there's any income source available
      // This could be a separate income tracking system or general income account
      const Income = require('../models/Income');
      sourceAccount = await Income.findOne({ 
        userId: req.user._id, 
        isActive: true 
      });
      if (!sourceAccount) {
        return res.status(400).json({
          success: false,
          message: 'No income source available. Please add an income account first.'
        });
      }
      availableBalance = sourceAccount.currentBalance || 0;
      hasSufficientFunds = availableBalance >= source.amount;
      break;
      
    case 'other':
      // For other sources, we don't deduct from any account
      hasSufficientFunds = true;
      break;
      
    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid source type'
      });
  }

  // ROCK-SOLID RULE: NO INSUFFICIENT FUNDS ALLOWED!
  if (!hasSufficientFunds) {
    return res.status(400).json({
      success: false,
      message: `🚫 INSUFFICIENT FUNDS! Cannot create loan.`,
      details: {
        requestedAmount: source.amount,
        availableBalance: availableBalance,
        shortfall: source.amount - availableBalance,
        sourceType: source.type,
        sourceName: source.sourceName
      }
    });
  }

  // Calculate total amount with interest
  let totalAmount = principalAmount;
  if (interestRate > 0) {
    const daysUntilDue = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    const dailyRate = interestRate / (100 * 365);
    
    if (interestType === 'simple') {
      totalAmount = principalAmount + (principalAmount * dailyRate * daysUntilDue);
    } else if (interestType === 'compound') {
      totalAmount = principalAmount * Math.pow(1 + dailyRate, daysUntilDue);
    }
  }

  const loanData = {
    userId: req.user._id,
    contactId,
    loanType: loanType || 'personal',
    principalAmount,
    interestRate: interestRate || 0,
    interestType: interestType || 'simple',
    totalAmount: Math.round(totalAmount * 100) / 100, // Round to 2 decimal places
    remainingAmount: Math.round(totalAmount * 100) / 100,
    loanDate: new Date(),
    dueDate: new Date(dueDate),
    paymentFrequency: paymentFrequency || 'one-time',
    installmentAmount: installmentAmount || 0,
    collateral: collateral && Object.keys(collateral).length > 0 ? collateral : undefined,
    notes,
    tags: tags || [],
    source: {
      type: source.type,
      sourceId: source.sourceId || null,
      sourceName: source.sourceName,
      amount: source.amount,
      currency: source.currency || 'FRW'
    },
    reminderSettings: {
      enabled: true,
      daysBefore: [7, 3, 1],
      messageTemplate: `Hi {contactName}, this is a friendly reminder that you have a loan payment of {amount} due on {dueDate}. Please ensure payment is made on time. Thank you!`,
      escalationEnabled: true,
      ...reminderSettings
    }
  };

  const loan = await Loan.create(loanData);

  // ROCK-SOLID MONEY DEDUCTION - NO EXCEPTIONS!
  try {
    switch (source.type) {
      case 'savings':
        await Savings.findByIdAndUpdate(source.sourceId, {
          $inc: { currentBalance: -source.amount }
        });
        console.log(`💰 Deducted ${source.amount} from Savings: ${source.sourceName}`);
        break;
        
      case 'business':
        await Business.findByIdAndUpdate(source.sourceId, {
          $inc: { currentBalance: -source.amount }
        });
        console.log(`💰 Deducted ${source.amount} from Business: ${source.sourceName}`);
        break;
        
      case 'petty_cash':
        await processLoanTransaction(
          req.user._id,
          source.amount,
          'loan_given',
          loan._id,
          `Loan given to ${contact.name}${loanData.description ? ` - ${loanData.description}` : ` (${loanData.loanType || 'Personal'} Loan)`}`
        );
        console.log(`💰 Deducted ${source.amount} from Petty Cash`);
        break;
        
      case 'income':
        // Deduct from income account
        const Income = require('../models/Income');
        await Income.findByIdAndUpdate(sourceAccount._id, {
          $inc: { currentBalance: -source.amount }
        });
        // Add transaction record
        await sourceAccount.addTransaction(
          'loan_given',
          source.amount,
          `Loan given to ${contact.name} - ${loanData.title || 'Personal Loan'}`,
          loan._id,
          'loan'
        );
        console.log(`💰 Deducted ${source.amount} from Income: ${source.sourceName}`);
        break;
        
      case 'other':
        // For other sources, we don't deduct from any account
        console.log(`💰 Other source used: ${source.sourceName} - No deduction needed`);
        break;
        
      default:
        throw new Error(`Unknown source type: ${source.type}`);
    }
  } catch (error) {
    // ROCK-SOLID ROLLBACK: If deduction fails, delete the loan
    console.error('❌ Money deduction failed:', error);
    await Loan.findByIdAndDelete(loan._id);
    return res.status(500).json({
      success: false,
      message: '🚫 FAILED TO PROCESS LOAN TRANSACTION! Loan creation cancelled.',
      error: error.message,
      details: {
        sourceType: source.type,
        sourceName: source.sourceName,
        amount: source.amount,
        reason: 'Money deduction failed - transaction rolled back'
      }
    });
  }

  // Populate contact info
  await loan.populate('contactId', 'name phone type email');

  // Send SMS notification to borrower
  try {
    const messageService = require('../services/messageService.mista');
    const contact = loan.contactId;
    
    if (contact && contact.phone) {
      const formattedPhone = messageService.formatRwandaPhone(contact.phone);
      
      if (messageService.validatePhone(formattedPhone)) {
        const dueDateFormatted = new Date(loan.dueDate).toLocaleDateString('en-RW', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const smsMessage = `Hello ${contact.name}, 

Your loan of ${loan.totalAmount.toLocaleString()} FRW has been registered successfully.

Due Date: ${dueDateFormatted}
Loan Type: ${loan.loanType}

Please ensure payment is made on time. Thank you!

SmartMoney FRW`;

        // Send SMS asynchronously (don't wait for it)
        messageService.sendSMS(formattedPhone, smsMessage, {
          userId: req.user._id
        }).then(result => {
          if (result.success) {
            console.log(`✅ SMS notification sent to ${contact.name} (${formattedPhone}) for loan ${loan._id}`);
          } else {
            console.error(`❌ Failed to send SMS to ${contact.name}:`, result.error);
          }
        }).catch(error => {
          console.error(`❌ Error sending SMS to ${contact.name}:`, error.message);
        });
      } else {
        console.warn(`⚠️ Invalid phone number format for contact ${contact.name}: ${contact.phone}`);
      }
    } else {
      console.warn(`⚠️ No phone number found for contact ${contact?.name || 'Unknown'}`);
    }
  } catch (error) {
    // Don't fail loan creation if SMS fails
    console.error('❌ Error sending loan notification SMS:', error.message);
  }

  res.status(201).json({
    success: true,
    data: loan,
    message: 'Loan created successfully. SMS notification sent to borrower.'
  });
});

/**
 * @desc    Update loan
 * @route   PUT /loans/:id
 * @access  Private
 */
const updateLoan = asyncHandler(async (req, res) => {
  const loan = await Loan.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!loan) {
    return res.status(404).json({
      success: false,
      message: 'Loan not found'
    });
  }

  // Don't allow updating completed loans
  if (loan.status === 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update completed loan'
    });
  }

  const updatedLoan = await Loan.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('contactId', 'name phone type email');

  res.json({
    success: true,
    data: updatedLoan
  });
});

/**
 * @desc    Add payment to loan
 * @route   POST /loans/:id/payments
 * @access  Private
 */
const addPayment = asyncHandler(async (req, res) => {
  const { amount, paymentMethod, notes, receipt } = req.body;

  const loan = await Loan.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!loan) {
    return res.status(404).json({
      success: false,
      message: 'Loan not found'
    });
  }

  if (loan.status === 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Cannot add payment to completed loan'
    });
  }

  await loan.addPayment(amount, paymentMethod, notes, receipt);
  
  // ROCK-SOLID MONEY RECOVERY - ADD BACK TO SOURCE!
  try {
    if (loan.source && loan.source.type) {
      switch (loan.source.type) {
        case 'savings':
          await Savings.findByIdAndUpdate(loan.source.sourceId, {
            $inc: { currentBalance: amount }
          });
          console.log(`💰 Added back ${amount} to Savings: ${loan.source.sourceName}`);
          break;
          
        case 'business':
          await Business.findByIdAndUpdate(loan.source.sourceId, {
            $inc: { currentBalance: amount }
          });
          console.log(`💰 Added back ${amount} to Business: ${loan.source.sourceName}`);
          break;
          
        case 'petty_cash':
          await processLoanTransaction(
            req.user._id,
            amount,
            'loan_repaid',
            loan._id,
            `Payment received from ${loan.contactId?.name || 'borrower'}${loan.description ? ` - ${loan.description}` : ` (${loan.loanType || 'Loan'} Payment)`}`
          );
          console.log(`💰 Added back ${amount} to Petty Cash`);
          break;
          
        case 'income':
          // Add back to income account
          const Income = require('../models/Income');
          const incomeAccount = await Income.findById(loan.source.sourceId);
          if (incomeAccount) {
            await Income.findByIdAndUpdate(loan.source.sourceId, {
              $inc: { currentBalance: amount }
            });
            // Add transaction record
            await incomeAccount.addTransaction(
              'income_received',
              amount,
              `Payment received from ${loan.contactId?.name || 'borrower'} - ${loan.title || 'Loan Payment'}`,
              loan._id,
              'loan_payment'
            );
            console.log(`💰 Added back ${amount} to Income: ${loan.source.sourceName}`);
          }
          break;
          
        case 'other':
          // For other sources, we don't add back
          console.log(`💰 Other source: ${loan.source.sourceName} - No money added back`);
          break;
          
        default:
          console.warn(`⚠️ Unknown source type for payment recovery: ${loan.source.type}`);
      }
    } else {
      console.warn('⚠️ No source information found for loan payment recovery');
    }
  } catch (error) {
    console.error('❌ Failed to add payment back to source:', error);
    // Don't fail the payment, but log the error for investigation
    console.error('Payment recovery error details:', {
      loanId: loan._id,
      sourceType: loan.source?.type,
      sourceName: loan.source?.sourceName,
      amount: amount,
      error: error.message
    });
  }

  await loan.populate('contactId', 'name phone type email');

  res.json({
    success: true,
    data: loan,
    message: 'Payment added successfully'
  });
});

/**
 * @desc    Delete loan
 * @route   DELETE /loans/:id
 * @access  Private
 */
const deleteLoan = asyncHandler(async (req, res) => {
  const loan = await Loan.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!loan) {
    return res.status(404).json({
      success: false,
      message: 'Loan not found'
    });
  }

  // Soft delete
  loan.isActive = false;
  await loan.save();

  res.json({
    success: true,
    message: 'Loan deleted successfully'
  });
});

/**
 * @desc    Get loan statistics
 * @route   GET /loans/stats
 * @access  Private
 */
const getLoanStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const stats = await Loan.aggregate([
    { $match: { userId: userId, isActive: true } },
    {
      $group: {
        _id: null,
        totalLoans: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        totalPaid: { $sum: '$amountPaid' },
        totalRemaining: { $sum: '$remainingAmount' },
        activeLoans: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        overdueLoans: {
          $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
        },
        completedLoans: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        defaultedLoans: {
          $sum: { $cond: [{ $eq: ['$status', 'defaulted'] }, 1, 0] }
        }
      }
    }
  ]);

  const typeStats = await Loan.aggregate([
    { $match: { userId: userId, isActive: true } },
    {
      $group: {
        _id: '$loanType',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        totalPaid: { $sum: '$amountPaid' },
        totalRemaining: { $sum: '$remainingAmount' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      overview: stats[0] || {
        totalLoans: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalRemaining: 0,
        activeLoans: 0,
        overdueLoans: 0,
        completedLoans: 0,
        defaultedLoans: 0
      },
      byType: typeStats
    }
  });
});

/**
 * @desc    Bulk import loans
 * @route   POST /loans/bulk-import
 * @access  Private
 */
const bulkImportLoans = asyncHandler(async (req, res) => {
  const { loans, replaceAll = false } = req.body;
  const results = { success: 0, updated: 0, created: 0, failed: 0, errors: [] };

  if (replaceAll) {
    const deleteResult = await Loan.updateMany(
      { userId: req.user._id, isActive: true },
      { isActive: false }
    );
    results.deleted = deleteResult.modifiedCount;
  }

  const loansToCreate = [];
  
  for (let i = 0; i < loans.length; i++) {
    const loanData = loans[i];
    
    try {
      // Validate required fields
      if (!loanData.contactId || !loanData.principalAmount || !loanData.dueDate) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: Missing required fields (contactId, principalAmount, dueDate)`);
        continue;
      }

      // Validate contact exists
      const contact = await Contact.findOne({
        _id: loanData.contactId,
        userId: req.user._id,
        isActive: true
      });

      if (!contact) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: Contact not found`);
        continue;
      }

      // Calculate total amount with interest
      let totalAmount = loanData.principalAmount;
      if (loanData.interestRate > 0) {
        const daysUntilDue = Math.ceil((new Date(loanData.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
        const dailyRate = loanData.interestRate / (100 * 365);
        
        if (loanData.interestType === 'simple') {
          totalAmount = loanData.principalAmount + (loanData.principalAmount * dailyRate * daysUntilDue);
        } else if (loanData.interestType === 'compound') {
          totalAmount = loanData.principalAmount * Math.pow(1 + dailyRate, daysUntilDue);
        }
      }

      const newLoan = {
        userId: req.user._id,
        contactId: loanData.contactId,
        loanType: loanData.loanType || 'personal',
        principalAmount: loanData.principalAmount,
        interestRate: loanData.interestRate || 0,
        interestType: loanData.interestType || 'simple',
        totalAmount: Math.round(totalAmount * 100) / 100,
        remainingAmount: Math.round(totalAmount * 100) / 100,
        loanDate: new Date(loanData.loanDate || new Date()),
        dueDate: new Date(loanData.dueDate),
        paymentFrequency: loanData.paymentFrequency || 'one-time',
        installmentAmount: loanData.installmentAmount || 0,
        collateral: loanData.collateral && Object.keys(loanData.collateral).length > 0 ? loanData.collateral : undefined,
        notes: loanData.notes || '',
        tags: loanData.tags || [],
        reminderSettings: {
          enabled: true,
          daysBefore: [7, 3, 1],
          messageTemplate: `Hi {contactName}, this is a friendly reminder that you have a loan payment of {amount} due on {dueDate}. Please ensure payment is made on time. Thank you!`,
          escalationEnabled: true,
          ...loanData.reminderSettings
        }
      };

      loansToCreate.push(newLoan);
    } catch (error) {
      results.failed++;
      results.errors.push(`Row ${i + 1}: ${error.message}`);
    }
  }

  if (loansToCreate.length > 0) {
    try {
      const createdLoans = await Loan.insertMany(loansToCreate, { ordered: false });
      results.success += createdLoans.length;
      results.created = createdLoans.length;
    } catch (error) {
      if (error.writeErrors) {
        results.failed += error.writeErrors.length;
        error.writeErrors.forEach(err => {
          results.errors.push(`Row ${err.index + 1}: ${err.errmsg}`);
        });
      }
    }
  }

  res.json({
    success: true,
    data: {
      imported: results.success,
      created: results.created,
      updated: results.updated,
      deleted: results.deleted || 0,
      failed: results.failed,
      total: loans.length,
      errors: results.errors
    }
  });
});

/**
 * @desc    Get available sources for loan creation
 * @route   GET /loans/sources
 * @access  Private
 */
const getLoanSources = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const sources = {
    petty_cash: [],
    income: [],
    savings: [],
    business: []
  };

  try {
    // Get savings accounts
    const Savings = require('../models/Savings');
    const savings = await Savings.find({
      userId: userId,
      isActive: true
    }).select('name currentBalance currency');
    
    sources.savings = savings.map(saving => ({
      id: saving._id,
      name: saving.name,
      balance: saving.currentBalance,
      currency: saving.currency || 'FRW'
    }));

    // Get business accounts
    const Business = require('../models/Business');
    const businesses = await Business.find({
      userId: userId,
      isActive: true
    }).select('name currentBalance currency');
    
    sources.business = businesses.map(business => ({
      id: business._id,
      name: business.name,
      balance: business.currentBalance,
      currency: business.currency || 'FRW'
    }));

    // Get petty cash account (create if doesn't exist)
    const PettyCash = require('../models/PettyCash');
    let pettyCashAccount = await PettyCash.findOne({ userId: userId });
    
    if (!pettyCashAccount) {
      // Create default petty cash account
      pettyCashAccount = await PettyCash.create({
        userId: userId,
        name: 'Petty Cash - General',
        currentBalance: 0,
        currency: 'FRW',
        transactions: []
      });
    }
    
    sources.petty_cash = [
      {
        id: pettyCashAccount._id,
        name: pettyCashAccount.name,
        balance: pettyCashAccount.currentBalance,
        currency: pettyCashAccount.currency
      }
    ];

    // Get income account (create if doesn't exist)
    const Income = require('../models/Income');
    let incomeAccount = await Income.findOne({ userId: userId });
    
    if (!incomeAccount) {
      // Create default income account
      incomeAccount = await Income.create({
        userId: userId,
        name: 'General Income',
        description: 'Default income account',
        currentBalance: 0,
        currency: 'FRW',
        incomeSources: [],
        transactions: [],
        settings: {
          lowBalanceThreshold: 10000,
          autoReplenish: false,
          replenishAmount: 0
        }
      });
    }
    
    sources.income = [
      {
        id: incomeAccount._id,
        name: incomeAccount.name,
        balance: incomeAccount.currentBalance,
        currency: incomeAccount.currency
      }
    ];

    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    console.error('Get loan sources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get loan sources',
      error: error.message
    });
  }
});

/**
 * @desc    Get overdue loans
 * @route   GET /loans/overdue
 * @access  Private
 */
const getOverdueLoans = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueLoans = await Loan.find({
    userId: req.user._id,
    dueDate: { $lt: today },
    status: { $in: ['active', 'overdue'] },
    isActive: true
  })
  .populate('contactId', 'name phone type email')
  .sort({ dueDate: 1 });

  res.json({
    success: true,
    data: overdueLoans
  });
});

module.exports = {
  getLoans,
  getLoan,
  createLoan,
  updateLoan,
  addPayment,
  deleteLoan,
  getLoanStats,
  getLoanSources,
  getOverdueLoans,
  bulkImportLoans
};