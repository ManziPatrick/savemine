const mongoose = require('mongoose');
const Reminder = require('../models/Reminder');
const Contact = require('../models/Contact');
const Loan = require('../models/Loan');
const smsService = require('../services/smsService');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPaginationParams, getSortParams, createPaginatedResponse } = require('../utils/pagination');

/**
 * @desc    Get all reminders for user
 * @route   GET /reminders
 * @access  Private
 */
const getReminders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const sort = getSortParams(req.query, ['scheduledDate', 'priority', 'createdAt']);
  
  const filter = { userId: req.user._id, isActive: true };
  
  // Add status filter
  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  // Add reminder type filter
  if (req.query.type) {
    filter.reminderType = req.query.type;
  }
  
  // Add priority filter
  if (req.query.priority) {
    filter.priority = req.query.priority;
  }
  
  // Add overdue filter
  if (req.query.overdue === 'true') {
    filter.scheduledDate = { $lt: new Date() };
    filter.status = 'scheduled';
  }

  const reminders = await Reminder.find(filter)
    .populate('contactId', 'name phone type email')
    .populate('loanId', 'totalAmount remainingAmount dueDate loanType')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Reminder.countDocuments(filter);

  res.json(createPaginatedResponse(reminders, page, limit, total));
});

/**
 * @desc    Get single reminder
 * @route   GET /reminders/:id
 * @access  Private
 */
const getReminder = asyncHandler(async (req, res) => {
  const reminder = await Reminder.findOne({
    _id: req.params.id,
    userId: req.user._id
  })
  .populate('contactId', 'name phone type email address')
  .populate('loanId', 'totalAmount remainingAmount dueDate loanType contactId');

  if (!reminder) {
    return res.status(404).json({
      success: false,
      message: 'Reminder not found'
    });
  }

  res.json({
    success: true,
    data: reminder
  });
});

/**
 * @desc    Create new reminder
 * @route   POST /reminders
 * @access  Private
 */
const createReminder = asyncHandler(async (req, res) => {
  const {
    modelType,
    modelId,
    title,
    description,
    sendAt,
    messageTemplate,
    autoSend,
    channels,
    priority,
    contactId,
    loanId,
    reminderType,
    message,
    scheduledDate,
    sendMethod,
    recurrence,
    recurrenceEndDate,
    escalation,
    tags,
    notes,
    customPhone,
    customContactName
  } = req.body;

  // Handle both old and new field structures
  const finalContactId = contactId || (modelType === 'contact' ? modelId : null);
  const finalLoanId = loanId || (modelType === 'loan' ? modelId : null);
  const finalReminderType = reminderType || (modelType === 'loan' ? 'loan_payment' : 'general');
  const finalMessage = message || messageTemplate || '';
  const finalScheduledDate = scheduledDate || sendAt;
  const finalSendMethod = sendMethod || (channels && channels.includes('sms') ? 'sms' : 'email');
  
  // Handle custom contact for custom reminders
  const finalCustomContact = (modelType === 'custom' && customPhone) ? {
    name: customContactName || 'Contact',
    phone: customPhone
  } : null;

  // Validate contact exists if provided
  if (finalContactId) {
    const contact = await Contact.findOne({
      _id: finalContactId,
      userId: req.user._id,
      isActive: true
    });

    if (!contact) {
      return res.status(400).json({
        success: false,
        message: 'Contact not found'
      });
    }
  }

  // Validate loan exists if provided
  if (finalLoanId) {
    const loan = await Loan.findOne({
      _id: finalLoanId,
      userId: req.user._id,
      isActive: true
    });

    if (!loan) {
      return res.status(400).json({
        success: false,
        message: 'Loan not found'
      });
    }
  }

  const reminderData = {
    userId: req.user._id,
    contactId: finalContactId,
    loanId: finalLoanId,
    customContact: finalCustomContact,
    reminderType: finalReminderType,
    title,
    message: finalMessage,
    scheduledDate: new Date(finalScheduledDate),
    priority: priority || 'medium',
    sendMethod: finalSendMethod,
    recurrence: recurrence || 'none',
    recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
    escalation: escalation || { enabled: true, levels: [] },
    tags: tags || [],
    notes: notes || description || ''
  };

  const reminder = await Reminder.create(reminderData);

  // Populate contact and loan info
  if (finalContactId) {
    await reminder.populate('contactId', 'name phone type email');
  }
  if (finalLoanId) {
    await reminder.populate('loanId', 'totalAmount remainingAmount dueDate loanType');
  }

  res.status(201).json({
    success: true,
    data: reminder
  });
});

/**
 * @desc    Update reminder
 * @route   PUT /reminders/:id
 * @access  Private
 */
const updateReminder = asyncHandler(async (req, res) => {
  const reminder = await Reminder.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!reminder) {
    return res.status(404).json({
      success: false,
      message: 'Reminder not found'
    });
  }

  // Don't allow updating sent reminders
  if (reminder.status === 'sent') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update sent reminder'
    });
  }

  const updatedReminder = await Reminder.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )
  .populate('contactId', 'name phone type email')
  .populate('loanId', 'totalAmount remainingAmount dueDate loanType');

  res.json({
    success: true,
    data: updatedReminder
  });
});

/**
 * @desc    Delete reminder
 * @route   DELETE /reminders/:id
 * @access  Private
 */
const deleteReminder = asyncHandler(async (req, res) => {
  const reminder = await Reminder.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!reminder) {
    return res.status(404).json({
      success: false,
      message: 'Reminder not found'
    });
  }

  // Soft delete
  reminder.isActive = false;
  await reminder.save();

  res.json({
    success: true,
    message: 'Reminder deleted successfully'
  });
});

/**
 * @desc    Send reminder now
 * @route   POST /reminders/:id/send
 * @access  Private
 */
const sendReminderNow = asyncHandler(async (req, res) => {
  const reminder = await Reminder.findOne({
    _id: req.params.id,
    userId: req.user._id,
    isActive: true
  })
  .populate('contactId', 'name phone type email')
  .populate('loanId', 'totalAmount remainingAmount dueDate loanType');

  if (!reminder) {
    return res.status(404).json({
      success: false,
      message: 'Reminder not found'
    });
  }

  if (reminder.status === 'sent') {
    return res.status(400).json({
      success: false,
      message: 'Reminder already sent'
    });
  }

  try {
    // Determine contact information
    let contactName = 'Contact';
    let contactPhone = null;

    if (reminder.customContact && reminder.customContact.phone) {
      // Use custom contact
      contactName = reminder.customContact.name || 'Contact';
      contactPhone = reminder.customContact.phone;
    } else if (reminder.contactId && reminder.contactId.phone) {
      // Use linked contact
      contactName = reminder.contactId.name || 'Contact';
      contactPhone = reminder.contactId.phone;
    }

    if (!contactPhone) {
      return res.status(400).json({
        success: false,
        message: 'No phone number available for this reminder'
      });
    }

    // Generate personalized message with loan details if available
    let message = reminder.message;
    if (reminder.loanId) {
      // Replace placeholders with loan details
      message = message
        .replace(/{contactName}/g, contactName)
        .replace(/{amount}/g, reminder.loanId.amount?.toLocaleString() || '0')
        .replace(/{dueDate}/g, new Date(reminder.loanId.dueDate).toLocaleDateString())
        .replace(/{remainingAmount}/g, reminder.loanId.remainingAmount?.toLocaleString() || '0');
    } else {
      // Replace basic placeholders
      message = message
        .replace(/{contactName}/g, contactName)
        .replace(/{date}/g, new Date().toLocaleDateString())
        .replace(/{time}/g, new Date().toLocaleTimeString());
    }

    // Send SMS
    const smsResult = await smsService.sendSMS(contactPhone, message, 'SmartMoney');

    if (smsResult.success) {
      // Mark as sent
      reminder.status = 'sent';
      reminder.sentAt = new Date();
      reminder.smsMessageId = smsResult.messageId;
      reminder.smsCost = smsResult.cost;
      await reminder.save();

      // Schedule next recurrence if applicable
      if (reminder.recurrence !== 'none') {
        await reminder.scheduleNext();
      }

      res.json({
        success: true,
        data: {
          reminderId: reminder._id,
          contactName: contactName,
          phone: contactPhone,
          message: message,
          smsResult: smsResult
        },
        message: 'Reminder sent successfully'
      });
    } else {
      // Mark as failed
      reminder.status = 'failed';
      reminder.lastAttempt = new Date();
      reminder.errorMessage = smsResult.error;
      await reminder.save();

      res.status(500).json({
        success: false,
        message: 'Failed to send SMS',
        error: smsResult.error,
        details: smsResult.details
      });
    }
  } catch (error) {
    // Mark as failed
    reminder.status = 'failed';
    reminder.lastAttempt = new Date();
    reminder.errorMessage = error.message;
    await reminder.save();

    res.status(500).json({
      success: false,
      message: 'Failed to send reminder',
      error: error.message
    });
  }
});

/**
 * @desc    Get reminder statistics
 * @route   GET /reminders/stats
 * @access  Private
 */
const getReminderStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const stats = await Reminder.aggregate([
    { $match: { userId: userId, isActive: true } },
    {
      $group: {
        _id: null,
        totalReminders: { $sum: 1 },
        scheduledReminders: {
          $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] }
        },
        sentReminders: {
          $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
        },
        failedReminders: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        overdueReminders: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$status', 'scheduled'] },
                  { $lt: ['$scheduledDate', new Date()] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  const typeStats = await Reminder.aggregate([
    { $match: { userId: userId, isActive: true } },
    {
      $group: {
        _id: '$reminderType',
        count: { $sum: 1 },
        scheduled: {
          $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] }
        },
        sent: {
          $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
        }
      }
    }
  ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalReminders: 0,
          scheduledReminders: 0,
          sentReminders: 0,
          failedReminders: 0,
          overdueReminders: 0
        },
        byType: typeStats
      }
    });
  } catch (error) {
    console.error('Reminder stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reminder statistics',
      error: error.message
    });
  }
});

/**
 * @desc    Get due reminders (reminders that are due to be sent)
 * @route   GET /reminders/due
 * @access  Private
 */
const getDueReminders = asyncHandler(async (req, res) => {
  const now = new Date();
  const dueReminders = await Reminder.find({
    userId: req.user._id,
    scheduledDate: { $lte: now },
    status: 'scheduled',
    isActive: true
  })
  .populate('contactId', 'name phone type email')
  .populate('loanId', 'totalAmount remainingAmount dueDate loanType')
  .sort({ scheduledDate: 1 });

  res.json({
    success: true,
    data: dueReminders
  });
});

/**
 * @desc    Get overdue reminders
 * @route   GET /reminders/overdue
 * @access  Private
 */
const getOverdueReminders = asyncHandler(async (req, res) => {
  const overdueReminders = await Reminder.find({
    userId: req.user._id,
    scheduledDate: { $lt: new Date() },
    status: 'scheduled',
    isActive: true
  })
  .populate('contactId', 'name phone type email')
  .populate('loanId', 'totalAmount remainingAmount dueDate loanType')
  .sort({ scheduledDate: 1 });

  res.json({
    success: true,
    data: overdueReminders
  });
});

/**
 * @desc    Bulk create loan payment reminders
 * @route   POST /reminders/bulk-loan-reminders
 * @access  Private
 */
const bulkCreateLoanReminders = asyncHandler(async (req, res) => {
  const { daysBefore = [7, 3, 1], messageTemplate } = req.body;

  // Get all active loans
  const loans = await Loan.find({
    userId: req.user._id,
    status: 'active',
    isActive: true
  }).populate('contactId', 'name phone type email');

  const reminders = [];

  for (const loan of loans) {
    for (const days of daysBefore) {
      const reminderDate = new Date(loan.dueDate);
      reminderDate.setDate(reminderDate.getDate() - days);

      // Skip if reminder date is in the past
      if (reminderDate < new Date()) continue;

      // Check if reminder already exists
      const existingReminder = await Reminder.findOne({
        userId: req.user._id,
        loanId: loan._id,
        scheduledDate: reminderDate,
        isActive: true
      });

      if (existingReminder) continue;

      const message = messageTemplate
        ? messageTemplate
            .replace('{contactName}', loan.contactId.name)
            .replace('{amount}', loan.remainingAmount.toLocaleString())
            .replace('{dueDate}', loan.dueDate.toLocaleDateString())
        : `Hi ${loan.contactId.name}, this is a friendly reminder that you have a loan payment of FRW ${loan.remainingAmount.toLocaleString()} due on ${loan.dueDate.toLocaleDateString()}. Please ensure payment is made on time. Thank you!`;

      reminders.push({
        userId: req.user._id,
        contactId: loan.contactId._id,
        loanId: loan._id,
        reminderType: 'loan_payment',
        title: `Payment reminder - ${loan.contactId.name}`,
        message,
        scheduledDate: reminderDate,
        priority: days === 1 ? 'high' : days === 3 ? 'medium' : 'low',
        sendMethod: 'sms',
        tags: ['loan', 'payment', `day-${days}`]
      });
    }
  }

  if (reminders.length > 0) {
    const createdReminders = await Reminder.insertMany(reminders);
    res.json({
      success: true,
      data: {
        created: createdReminders.length,
        total: reminders.length
      },
      message: `Created ${createdReminders.length} loan payment reminders`
    });
  } else {
    res.json({
      success: true,
      data: {
        created: 0,
        total: 0
      },
      message: 'No new reminders needed'
    });
  }
});

/**
 * @desc    Send bulk reminders immediately
 * @route   POST /reminders/bulk-send
 * @access  Private
 */
const sendBulkReminders = asyncHandler(async (req, res) => {
  const { reminderIds } = req.body;

  if (!reminderIds || !Array.isArray(reminderIds) || reminderIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Reminder IDs array is required'
    });
  }

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (const reminderId of reminderIds) {
    try {
      const reminder = await Reminder.findOne({
        _id: reminderId,
        userId: req.user._id,
        isActive: true
      }).populate('contactId', 'name phone type email');

      if (!reminder) {
        results.push({
          reminderId,
          success: false,
          error: 'Reminder not found'
        });
        failCount++;
        continue;
      }

      if (reminder.status === 'sent') {
        results.push({
          reminderId,
          success: false,
          error: 'Already sent'
        });
        failCount++;
        continue;
      }

      if (!reminder.contactId || !reminder.contactId.phone) {
        results.push({
          reminderId,
          success: false,
          error: 'No phone number'
        });
        failCount++;
        continue;
      }

      // Generate personalized message
      const message = smsService.generateMessage(reminder.messageTemplate, {
        name: reminder.contactId.name,
        contactName: reminder.contactId.name,
        date: new Date().toLocaleDateString('en-RW'),
        time: new Date().toLocaleTimeString('en-RW')
      });

      // Send SMS
      const smsResult = await smsService.sendSMS(
        reminder.contactId.phone,
        message,
        'SmartMoney'
      );

      if (smsResult.success) {
        // Update reminder status
        reminder.status = 'sent';
        reminder.sentAt = new Date();
        reminder.smsMessageId = smsResult.messageId;
        reminder.smsCost = smsResult.cost;
        await reminder.save();

        results.push({
          reminderId,
          success: true,
          contactName: reminder.contactId.name,
          phone: reminder.contactId.phone,
          smsResult: smsResult
        });
        successCount++;
      } else {
        // Update reminder status to failed
        reminder.status = 'failed';
        reminder.lastAttempt = new Date();
        reminder.errorMessage = smsResult.error;
        await reminder.save();

        results.push({
          reminderId,
          success: false,
          error: smsResult.error
        });
        failCount++;
      }

      // Add small delay between messages
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      results.push({
        reminderId,
        success: false,
        error: error.message
      });
      failCount++;
    }
  }

  res.json({
    success: true,
    data: {
      total: reminderIds.length,
      success: successCount,
      failed: failCount,
      results: results
    },
    message: `Sent ${successCount} reminders successfully, ${failCount} failed`
  });
});

module.exports = {
  getReminders,
  getReminder,
  createReminder,
  updateReminder,
  deleteReminder,
  sendReminderNow,
  sendBulkReminders,
  getReminderStats,
  getDueReminders,
  getOverdueReminders,
  bulkCreateLoanReminders
};