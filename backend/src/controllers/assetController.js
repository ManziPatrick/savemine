const Asset = require('../models/Asset');
const Contact = require('../models/Contact');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPaginationParams, getSortParams, createPaginatedResponse } = require('../utils/pagination');

/**
 * @desc    Get all assets for user
 * @route   GET /assets
 * @access  Private
 */
const getAssets = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const sort = getSortParams(req.query, ['name', 'value', 'category', 'status', 'createdAt']);
  
  const filter = { userId: req.user._id, isActive: true };
  
  // Add status filter
  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  // Add category filter
  if (req.query.category) {
    filter.category = req.query.category;
  }

  const assets = await Asset.find(filter)
    .populate('ownerContactId', 'name phone type')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Asset.countDocuments(filter);

  res.json(createPaginatedResponse(assets, page, limit, total));
});

/**
 * @desc    Get single asset
 * @route   GET /assets/:id
 * @access  Private
 */
const getAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findOne({
    _id: req.params.id,
    userId: req.user._id
  }).populate('ownerContactId', 'name phone type email');

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: 'Asset not found'
    });
  }

  res.json({
    success: true,
    data: { asset }
  });
});

/**
 * @desc    Create new asset
 * @route   POST /assets
 * @access  Private
 */
const createAsset = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    value,
    currency,
    category,
    status,
    ownerContactId,
    purchaseDate,
    depreciationRate,
    location,
    serialNumber,
    notes,
    tags
  } = req.body;

  // Verify contact belongs to user if provided
  if (ownerContactId) {
    const contact = await Contact.findOne({
      _id: ownerContactId,
      userId: req.user._id
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
  }

  const assetData = {
    userId: req.user._id,
    name,
    description,
    value,
    currency: currency || 'FRW',
    category,
    status: status || 'owned',
    ownerContactId,
    purchaseDate,
    depreciationRate: depreciationRate || 0,
    location,
    serialNumber,
    notes,
    tags: tags || []
  };

  const asset = await Asset.create(assetData);

  // Populate the created asset
  await asset.populate('ownerContactId', 'name phone type');

  res.status(201).json({
    success: true,
    message: 'Asset created successfully',
    data: { asset }
  });
});

/**
 * @desc    Update asset
 * @route   PUT /assets/:id
 * @access  Private
 */
const updateAsset = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    value,
    currency,
    category,
    status,
    ownerContactId,
    purchaseDate,
    depreciationRate,
    location,
    serialNumber,
    notes,
    tags
  } = req.body;

  const asset = await Asset.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: 'Asset not found'
    });
  }

  // Verify contact belongs to user if provided
  if (ownerContactId) {
    const contact = await Contact.findOne({
      _id: ownerContactId,
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
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (value !== undefined) updateData.value = value;
  if (currency !== undefined) updateData.currency = currency;
  if (category !== undefined) updateData.category = category;
  if (status !== undefined) updateData.status = status;
  if (ownerContactId !== undefined) updateData.ownerContactId = ownerContactId;
  if (purchaseDate !== undefined) updateData.purchaseDate = purchaseDate;
  if (depreciationRate !== undefined) updateData.depreciationRate = depreciationRate;
  if (location !== undefined) updateData.location = location;
  if (serialNumber !== undefined) updateData.serialNumber = serialNumber;
  if (notes !== undefined) updateData.notes = notes;
  if (tags !== undefined) updateData.tags = tags;

  const updatedAsset = await Asset.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('ownerContactId', 'name phone type');

  res.json({
    success: true,
    message: 'Asset updated successfully',
    data: { asset: updatedAsset }
  });
});

/**
 * @desc    Delete asset (soft delete)
 * @route   DELETE /assets/:id
 * @access  Private
 */
const deleteAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: 'Asset not found'
    });
  }

  // Soft delete by setting isActive to false
  asset.isActive = false;
  await asset.save();

  res.json({
    success: true,
    message: 'Asset deleted successfully'
  });
});

/**
 * @desc    Update asset value
 * @route   POST /assets/:id/update-value
 * @access  Private
 */
const updateValue = asyncHandler(async (req, res) => {
  const { value, depreciationRate } = req.body;

  if (!value || value <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Value must be positive'
    });
  }

  const asset = await Asset.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: 'Asset not found'
    });
  }

  await asset.updateValue(value, depreciationRate);

  res.json({
    success: true,
    message: 'Asset value updated successfully',
    data: { asset }
  });
});

/**
 * @desc    Get asset statistics
 * @route   GET /assets/stats
 * @access  Private
 */
const getAssetStats = asyncHandler(async (req, res) => {
  const stats = await Asset.aggregate([
    { $match: { userId: req.user._id, isActive: true } },
    {
      $group: {
        _id: '$category',
        totalValue: { $sum: '$value' },
        currentValue: { $sum: { $subtract: ['$value', { $multiply: ['$value', { $divide: ['$depreciationRate', 100] }] }] } },
        count: { $sum: 1 },
        avgValue: { $avg: '$value' }
      }
    }
  ]);

  const statusStats = await Asset.aggregate([
    { $match: { userId: req.user._id, isActive: true } },
    {
      $group: {
        _id: '$status',
        totalValue: { $sum: '$value' },
        count: { $sum: 1 }
      }
    }
  ]);

  const totalAssets = await Asset.aggregate([
    { $match: { userId: req.user._id, isActive: true } },
    {
      $group: {
        _id: null,
        totalValue: { $sum: '$value' },
        totalCurrentValue: { $sum: { $subtract: ['$value', { $multiply: ['$value', { $divide: ['$depreciationRate', 100] }] }] } },
        count: { $sum: 1 }
      }
    }
  ]);

  const categoryBreakdown = stats.reduce((acc, stat) => {
    acc[stat._id] = {
      totalValue: stat.totalValue,
      currentValue: stat.currentValue,
      count: stat.count,
      avgValue: stat.avgValue
    };
    return acc;
  }, {});

  const statusBreakdown = statusStats.reduce((acc, stat) => {
    acc[stat._id] = {
      totalValue: stat.totalValue,
      count: stat.count
    };
    return acc;
  }, {});

  const overall = totalAssets[0] || { totalValue: 0, totalCurrentValue: 0, count: 0 };

  res.json({
    success: true,
    data: {
      overall,
      categoryBreakdown,
      statusBreakdown
    }
  });
});

/**
 * @desc    Get assets by category
 * @route   GET /assets/category/:category
 * @access  Private
 */
const getAssetsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;

  const assets = await Asset.find({
    userId: req.user._id,
    category: category,
    isActive: true
  })
    .populate('ownerContactId', 'name phone type')
    .sort({ name: 1 });

  res.json({
    success: true,
    data: { assets }
  });
});

/**
 * @desc    Upload proof document for asset
 * @route   POST /assets/:id/proof
 * @access  Private
 */
const uploadProof = asyncHandler(async (req, res) => {
  const asset = await Asset.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: 'Asset not found'
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Proof file is required'
    });
  }

  // Update asset with proof path
  asset.proofPath = req.file.path;
  await asset.save();

  res.json({
    success: true,
    message: 'Proof uploaded successfully',
    data: {
      proofPath: asset.proofPath
    }
  });
});

module.exports = {
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  updateValue,
  getAssetStats,
  getAssetsByCategory,
  uploadProof
};


