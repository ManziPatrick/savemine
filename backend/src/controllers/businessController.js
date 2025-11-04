const mongoose = require('mongoose');
const Business = require('../models/Business');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPaginationParams, getSortParams, createPaginatedResponse } = require('../utils/pagination');

/**
 * @desc    Get all businesses for user
 * @route   GET /businesses
 * @access  Private
 */
const getBusinesses = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const sort = getSortParams(req.query, ['startDate', 'name', 'createdAt']);
  
  const filter = { userId: req.user._id, isActive: true };
  
  // Add business type filter
  if (req.query.businessType) {
    filter.businessType = req.query.businessType;
  }
  
  // Add status filter
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const businesses = await Business.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Business.countDocuments(filter);

  res.json(createPaginatedResponse(businesses, page, limit, total));
});

/**
 * @desc    Get single business
 * @route   GET /businesses/:id
 * @access  Private
 */
const getBusiness = asyncHandler(async (req, res) => {
  const business = await Business.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  res.json({
    success: true,
    data: business
  });
});

/**
 * @desc    Create new business
 * @route   POST /businesses
 * @access  Private
 */
const createBusiness = asyncHandler(async (req, res) => {
  const {
    businessType,
    name,
    description,
    location,
    startDate,
    status,
    initialInvestment,
    monthlyRevenue,
    monthlyExpenses,
    animals,
    milestones,
    goals,
    tags,
    notes
  } = req.body;

  const businessData = {
    userId: req.user._id,
    businessType: businessType || 'animal_farming',
    name,
    description: description || '',
    location: location || '',
    startDate: new Date(startDate || new Date()),
    status: status || 'active',
    initialInvestment: initialInvestment || 0,
    monthlyRevenue: monthlyRevenue || 0,
    monthlyExpenses: monthlyExpenses || 0,
    animals: animals || [],
    milestones: milestones || [],
    goals: goals || [],
    tags: tags || [],
    notes: notes || ''
  };

  const business = await Business.create(businessData);

  res.status(201).json({
    success: true,
    data: business
  });
});

/**
 * @desc    Update business
 * @route   PUT /businesses/:id
 * @access  Private
 */
const updateBusiness = asyncHandler(async (req, res) => {
  const business = await Business.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  const updatedBusiness = await Business.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: updatedBusiness
  });
});

/**
 * @desc    Delete business
 * @route   DELETE /businesses/:id
 * @access  Private
 */
const deleteBusiness = asyncHandler(async (req, res) => {
  const business = await Business.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  // Soft delete
  business.isActive = false;
  await business.save();

  res.json({
    success: true,
    message: 'Business deleted successfully'
  });
});

/**
 * @desc    Get business statistics
 * @route   GET /businesses/stats
 * @access  Private
 */
const getBusinessStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const stats = await Business.aggregate([
    { $match: { userId: userId, isActive: true } },
    {
      $group: {
        _id: null,
        totalBusinesses: { $sum: 1 },
        activeBusinesses: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        totalRevenue: { $sum: '$totalRevenue' },
        totalExpenses: { $sum: '$totalExpenses' },
        totalProfit: { $sum: { $subtract: ['$totalRevenue', '$totalExpenses'] } },
        totalInvestment: { $sum: '$initialInvestment' }
      }
    }
  ]);

  const typeStats = await Business.aggregate([
    { $match: { userId: userId, isActive: true } },
    {
      $group: {
        _id: '$businessType',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$totalRevenue' },
        totalExpenses: { $sum: '$totalExpenses' },
        totalProfit: { $sum: { $subtract: ['$totalRevenue', '$totalExpenses'] } },
        averageROI: {
          $avg: {
            $cond: [
              { $gt: ['$initialInvestment', 0] },
              { $multiply: [{ $divide: [{ $subtract: ['$totalRevenue', '$totalExpenses'] }, '$initialInvestment'] }, 100] },
              0
            ]
          }
        }
      }
    }
  ]);

  const statusStats = await Business.aggregate([
    { $match: { userId: userId, isActive: true } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$totalRevenue' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      overview: stats[0] || {
        totalBusinesses: 0,
        activeBusinesses: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        totalProfit: 0,
        totalInvestment: 0
      },
      byType: typeStats,
      byStatus: statusStats
    }
  });
});

module.exports = {
  getBusinesses,
  getBusiness,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getBusinessStats
};