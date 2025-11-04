const mongoose = require('mongoose');
const AssetAssignment = require('../models/AssetAssignment');
const Contact = require('../models/Contact');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPaginationParams, getSortParams, createPaginatedResponse } = require('../utils/pagination');

/**
 * @desc    Get all asset assignments for user
 * @route   GET /asset-assignments
 * @access  Private
 */
const getAssetAssignments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const sort = getSortParams(req.query, ['assignmentDate', 'expectedReturnDate', 'assetValue', 'status', 'createdAt']);
  
  const filter = { userId: req.user._id, isActive: true };
  
  // Add status filter
  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  // Add assignment type filter
  if (req.query.assignmentType) {
    filter.assignmentType = req.query.assignmentType;
  }
  
  // Add category filter
  if (req.query.assetCategory) {
    filter.assetCategory = req.query.assetCategory;
  }
  
  // Add overdue filter
  if (req.query.overdue === 'true') {
    filter.expectedReturnDate = { $lt: new Date() };
    filter.status = 'active';
  }

  const assetAssignments = await AssetAssignment.find(filter)
    .populate('contactId', 'name phone type email')
    .populate('assetId', 'name category value')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await AssetAssignment.countDocuments(filter);

  res.json(createPaginatedResponse(assetAssignments, page, limit, total));
});

/**
 * @desc    Get single asset assignment
 * @route   GET /asset-assignments/:id
 * @access  Private
 */
const getAssetAssignment = asyncHandler(async (req, res) => {
  const assetAssignment = await AssetAssignment.findOne({
    _id: req.params.id,
    userId: req.user._id
  })
  .populate('contactId', 'name phone type email address')
  .populate('assetId', 'name category value description location');

  if (!assetAssignment) {
    return res.status(404).json({
      success: false,
      message: 'Asset assignment not found'
    });
  }

  res.json({
    success: true,
    data: assetAssignment
  });
});

/**
 * @desc    Create new asset assignment
 * @route   POST /asset-assignments
 * @access  Private
 */
const createAssetAssignment = asyncHandler(async (req, res) => {
  const {
    contactId,
    assetId,
    assignmentType,
    assetDescription,
    assetCategory,
    assetValue,
    currency,
    assignmentDate,
    expectedReturnDate,
    depositAmount,
    rentalAmount,
    paymentFrequency,
    currentLocation,
    originalLocation,
    contract,
    photos,
    documents,
    tags,
    notes
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

  const assetAssignmentData = {
    userId: req.user._id,
    contactId,
    assetId: assetId || null,
    assignmentType,
    assetDescription,
    assetCategory,
    assetValue,
    currency: currency || 'FRW',
    assignmentDate: new Date(assignmentDate || new Date()),
    expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
    depositAmount: depositAmount || 0,
    rentalAmount: rentalAmount || 0,
    paymentFrequency: paymentFrequency || 'one-time',
    currentLocation: currentLocation || originalLocation,
    originalLocation,
    contract: contract || {},
    photos: photos || [],
    documents: documents || [],
    tags: tags || [],
    notes: notes || ''
  };

  const assetAssignment = await AssetAssignment.create(assetAssignmentData);

  // Populate contact and asset info
  await assetAssignment.populate('contactId', 'name phone type email');
  if (assetId) {
    await assetAssignment.populate('assetId', 'name category value');
  }

  res.status(201).json({
    success: true,
    data: assetAssignment
  });
});

/**
 * @desc    Update asset assignment
 * @route   PUT /asset-assignments/:id
 * @access  Private
 */
const updateAssetAssignment = asyncHandler(async (req, res) => {
  const assetAssignment = await AssetAssignment.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!assetAssignment) {
    return res.status(404).json({
      success: false,
      message: 'Asset assignment not found'
    });
  }

  // Don't allow updating returned assignments
  if (assetAssignment.status === 'returned') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update returned asset assignment'
    });
  }

  const updatedAssetAssignment = await AssetAssignment.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )
  .populate('contactId', 'name phone type email')
  .populate('assetId', 'name category value');

  res.json({
    success: true,
    data: updatedAssetAssignment
  });
});

/**
 * @desc    Delete asset assignment
 * @route   DELETE /asset-assignments/:id
 * @access  Private
 */
const deleteAssetAssignment = asyncHandler(async (req, res) => {
  const assetAssignment = await AssetAssignment.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!assetAssignment) {
    return res.status(404).json({
      success: false,
      message: 'Asset assignment not found'
    });
  }

  // Soft delete
  assetAssignment.isActive = false;
  await assetAssignment.save();

  res.json({
    success: true,
    message: 'Asset assignment deleted successfully'
  });
});

/**
 * @desc    Get asset assignment statistics
 * @route   GET /asset-assignments/stats
 * @access  Private
 */
const getAssetAssignmentStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const stats = await AssetAssignment.aggregate([
      { $match: { userId: userId, isActive: true } },
      {
        $group: {
          _id: null,
          totalAssignments: { $sum: 1 },
          totalValue: { $sum: '$assetValue' },
          totalDeposits: { $sum: '$depositAmount' },
          totalRentals: { $sum: '$rentalAmount' },
          activeAssignments: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          overdueAssignments: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'active'] },
                    { $lt: ['$expectedReturnDate', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          },
          returnedAssignments: {
            $sum: { $cond: [{ $eq: ['$status', 'returned'] }, 1, 0] }
          },
          lostAssignments: {
            $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] }
          }
        }
      }
    ]);

    const typeStats = await AssetAssignment.aggregate([
      { $match: { userId: userId, isActive: true } },
      {
        $group: {
          _id: '$assignmentType',
          count: { $sum: 1 },
          totalValue: { $sum: '$assetValue' },
          totalDeposits: { $sum: '$depositAmount' },
          totalRentals: { $sum: '$rentalAmount' }
        }
      }
    ]);

    const categoryStats = await AssetAssignment.aggregate([
      { $match: { userId: userId, isActive: true } },
      {
        $group: {
          _id: '$assetCategory',
          count: { $sum: 1 },
          totalValue: { $sum: '$assetValue' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalAssignments: 0,
          totalValue: 0,
          totalDeposits: 0,
          totalRentals: 0,
          activeAssignments: 0,
          overdueAssignments: 0,
          returnedAssignments: 0,
          lostAssignments: 0
        },
        byType: typeStats,
        byCategory: categoryStats
      }
    });
  } catch (error) {
    console.error('Asset assignment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get asset assignment statistics',
      error: error.message
    });
  }
});

/**
 * @desc    Add check-in to asset assignment
 * @route   POST /asset-assignments/:id/check-in
 * @access  Private
 */
const addCheckIn = asyncHandler(async (req, res) => {
  const { location, condition, notes, photos } = req.body;

  const assetAssignment = await AssetAssignment.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!assetAssignment) {
    return res.status(404).json({
      success: false,
      message: 'Asset assignment not found'
    });
  }

  await assetAssignment.addCheckIn(location, condition, notes, photos);
  await assetAssignment.populate('contactId', 'name phone type email');

  res.json({
    success: true,
    data: assetAssignment,
    message: 'Check-in added successfully'
  });
});

/**
 * @desc    Add payment to asset assignment
 * @route   POST /asset-assignments/:id/payments
 * @access  Private
 */
const addPayment = asyncHandler(async (req, res) => {
  const { amount, paymentMethod, notes } = req.body;

  const assetAssignment = await AssetAssignment.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!assetAssignment) {
    return res.status(404).json({
      success: false,
      message: 'Asset assignment not found'
    });
  }

  await assetAssignment.addPayment(amount, paymentMethod, notes);
  await assetAssignment.populate('contactId', 'name phone type email');

  res.json({
    success: true,
    data: assetAssignment,
    message: 'Payment added successfully'
  });
});

/**
 * @desc    Mark asset assignment as returned
 * @route   POST /asset-assignments/:id/return
 * @access  Private
 */
const markAsReturned = asyncHandler(async (req, res) => {
  const { returnDate, condition, notes } = req.body;

  const assetAssignment = await AssetAssignment.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!assetAssignment) {
    return res.status(404).json({
      success: false,
      message: 'Asset assignment not found'
    });
  }

  await assetAssignment.markAsReturned(returnDate, condition, notes);
  await assetAssignment.populate('contactId', 'name phone type email');

  res.json({
    success: true,
    data: assetAssignment,
    message: 'Asset assignment marked as returned'
  });
});

module.exports = {
  getAssetAssignments,
  getAssetAssignment,
  createAssetAssignment,
  updateAssetAssignment,
  deleteAssetAssignment,
  getAssetAssignmentStats,
  addCheckIn,
  addPayment,
  markAsReturned
};

