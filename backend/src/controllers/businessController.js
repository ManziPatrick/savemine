const mongoose = require('mongoose');
const Business = require('../models/Business');
const Project = require('../models/Project');
const Expense = require('../models/Expense');
const { asyncHandler } = require('../middleware/errorHandler');
const { purseTake } = require('../services/purse');
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
  const projects = await Project.find({
    userId: req.user._id,
    businessId: { $in: businesses.map((business) => business._id) },
    isActive: { $ne: false }
  }).select('_id businessId');
  const projectBusiness = new Map(projects.map((project) => [String(project._id), String(project.businessId)]));
  const spent = await Expense.find({
    userId: req.user._id,
    isActive: true,
    $or: [
      { projectId: { $in: projects.map((project) => project._id) } },
      { category: 'agriculture' }
    ]
  }).select('projectId category amount');
  const invested = {};
  spent.forEach((expense) => {
    const fromProject = projectBusiness.get(String(expense.projectId || ''));
    const farmBusiness = !fromProject && expense.category === 'agriculture'
      ? businesses.find((business) => business.businessType === 'agriculture')
      : null;
    const businessId = fromProject || (farmBusiness ? String(farmBusiness._id) : '');
    if (!businessId) return;
    invested[businessId] = (invested[businessId] || 0) + Number(expense.amount || 0);
  });
  const rows = businesses.map((business) => {
    const plain = business.toObject();
    const proposed = Number(plain.initialInvestment || 0);
    const used = invested[String(business._id)] || 0;
    plain.invested = used;
    plain.investmentGap = used - proposed;
    plain.investmentStanding = used === proposed ? 'level' : used > proposed ? 'above' : 'below';
    return plain;
  });

  const total = await Business.countDocuments(filter);

  res.json(createPaginatedResponse(rows, page, limit, total));
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
    locationMode,
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
    locationMode: locationMode === 'online' ? 'online' : 'place',
    location: locationMode === 'online' ? 'Online' : (location || ''),
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
 * @desc    Add monthly income to a business
 * @route   POST /businesses/:id/income
 * @access  Private
 */
const addMonthlyIncome = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be positive'
    });
  }

  const business = await Business.findOne({
    _id: req.params.id,
    userId: req.user._id,
    isActive: true
  });

  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  business.monthlyRevenue = (business.monthlyRevenue || 0) + Number(amount);
  business.totalRevenue = (business.totalRevenue || 0) + Number(amount);
  await business.save();

  res.json({
    success: true,
    message: 'Income recorded successfully',
    data: { business }
  });
});

/**
 * @desc    Add monthly expense to a business
 * @route   POST /businesses/:id/expense
 * @access  Private
 */
const addMonthlyExpense = asyncHandler(async (req, res) => {
  const { amount, source } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be positive'
    });
  }

  const business = await Business.findOne({
    _id: req.params.id,
    userId: req.user._id,
    isActive: true
  });

  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  const purse = source && source.type ? source : { type: 'cash', sourceName: 'Wallet' };
  try {
    await purseTake(req.user._id, purse, Number(amount), `Business expense: ${business.name}`);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message || 'Could not take that money' });
  }
  business.monthlyExpenses = (business.monthlyExpenses || 0) + Number(amount);
  business.totalExpenses = (business.totalExpenses || 0) + Number(amount);
  await business.save();

  res.json({
    success: true,
    message: 'Expense recorded successfully',
    data: { business }
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
        totalInvestment: { $sum: '$initialInvestment' },
        monthlyRevenue: { $sum: '$monthlyRevenue' },
        monthlyExpenses: { $sum: '$monthlyExpenses' },
        monthlyProfit: { $sum: { $subtract: ['$monthlyRevenue', '$monthlyExpenses'] } }
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
        totalInvestment: 0,
        monthlyRevenue: 0,
        monthlyExpenses: 0,
        monthlyProfit: 0
      },
      byType: typeStats,
      byStatus: statusStats
    }
  });
});

/**
 * @desc    Choose which projects belong to this business
 * @route   PUT /businesses/:id/projects
 * @access  Private
 */
const setBusinessProjects = asyncHandler(async (req, res) => {
  const business = await Business.findOne({
    _id: req.params.id,
    userId: req.user._id,
    isActive: true
  });

  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  const requested = Array.isArray(req.body.projectIds) ? req.body.projectIds : [];
  const validIds = requested.filter((id) => mongoose.isValidObjectId(id));
  const projects = await Project.find({
    _id: { $in: validIds },
    userId: req.user._id,
    isActive: true
  }).select('_id');
  const ids = projects.map((project) => project._id);

  await Project.updateMany(
    { userId: req.user._id, businessId: business._id, _id: { $nin: ids } },
    { $set: { businessId: null } }
  );
  if (ids.length) {
    await Project.updateMany(
      { userId: req.user._id, _id: { $in: ids } },
      { $set: { businessId: business._id } }
    );
  }

  res.json({
    success: true,
    data: { projectIds: ids }
  });
});

module.exports = {
  getBusinesses,
  getBusiness,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  addMonthlyIncome,
  addMonthlyExpense,
  getBusinessStats,
  setBusinessProjects
};