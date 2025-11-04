const mongoose = require('mongoose');
const Gift = require('../models/Gift');
const Contact = require('../models/Contact');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPaginationParams, getSortParams, createPaginatedResponse } = require('../utils/pagination');

/**
 * @desc    Get all gifts for user
 * @route   GET /gifts
 * @access  Private
 */
const getGifts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const sort = getSortParams(req.query, ['giftDate', 'amount', 'createdAt']);
  
  const filter = { userId: req.user._id, isActive: true };
  
  // Add gift type filter
  if (req.query.giftType) {
    filter.giftType = req.query.giftType;
  }
  
  // Add category filter
  if (req.query.category) {
    filter.category = req.query.category;
  }
  
  // Add occasion filter
  if (req.query.occasion) {
    filter.occasion = req.query.occasion;
  }

  const gifts = await Gift.find(filter)
    .populate('contactId', 'name phone type email')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Gift.countDocuments(filter);

  res.json(createPaginatedResponse(gifts, page, limit, total));
});

/**
 * @desc    Get single gift
 * @route   GET /gifts/:id
 * @access  Private
 */
const getGift = asyncHandler(async (req, res) => {
  const gift = await Gift.findOne({
    _id: req.params.id,
    userId: req.user._id
  }).populate('contactId', 'name phone type email address');

  if (!gift) {
    return res.status(404).json({
      success: false,
      message: 'Gift not found'
    });
  }

  res.json({
    success: true,
    data: gift
  });
});

/**
 * @desc    Create new gift
 * @route   POST /gifts
 * @access  Private
 */
const createGift = asyncHandler(async (req, res) => {
  const {
    contactId,
    giftType,
    category,
    title,
    description,
    amount,
    currency,
    quantity,
    unitPrice,
    giftDate,
    occasion,
    location,
    tags,
    notes,
    receipt,
    photos
  } = req.body;

  // Validate contact exists if provided
  if (contactId) {
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
  }

  const giftData = {
    userId: req.user._id,
    contactId: contactId || null,
    giftType: giftType || 'given',
    category: category || 'money',
    title,
    description: description || '',
    amount,
    currency: currency || 'FRW',
    quantity: quantity || 1,
    unitPrice: unitPrice || null,
    giftDate: new Date(giftDate || new Date()),
    occasion: occasion || 'none',
    location: location || '',
    tags: tags || [],
    notes: notes || '',
    receipt: receipt || '',
    photos: photos || []
  };

  const gift = await Gift.create(giftData);

  // Populate contact info if available
  if (contactId) {
    await gift.populate('contactId', 'name phone type email');
  }

  res.status(201).json({
    success: true,
    data: gift
  });
});

/**
 * @desc    Update gift
 * @route   PUT /gifts/:id
 * @access  Private
 */
const updateGift = asyncHandler(async (req, res) => {
  const gift = await Gift.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!gift) {
    return res.status(404).json({
      success: false,
      message: 'Gift not found'
    });
  }

  const updatedGift = await Gift.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('contactId', 'name phone type email');

  res.json({
    success: true,
    data: updatedGift
  });
});

/**
 * @desc    Delete gift
 * @route   DELETE /gifts/:id
 * @access  Private
 */
const deleteGift = asyncHandler(async (req, res) => {
  const gift = await Gift.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!gift) {
    return res.status(404).json({
      success: false,
      message: 'Gift not found'
    });
  }

  // Soft delete
  gift.isActive = false;
  await gift.save();

  res.json({
    success: true,
    message: 'Gift deleted successfully'
  });
});

/**
 * @desc    Get gift statistics
 * @route   GET /gifts/stats
 * @access  Private
 */
const getGiftStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const stats = await Gift.aggregate([
      { $match: { userId: userId, isActive: true } },
    {
      $group: {
        _id: null,
        totalGifts: { $sum: 1 },
        totalGiven: {
          $sum: { 
            $cond: [
              { $in: ['$giftType', ['given', 'donation', 'charity']] }, 
              1, 
              0
            ] 
          }
        },
        totalReceived: {
          $sum: { $cond: [{ $eq: ['$giftType', 'received'] }, 1, 0] }
        },
        totalAmountGiven: {
          $sum: {
            $cond: [
              { $in: ['$giftType', ['given', 'donation', 'charity']] }, 
              '$amount', 
              0
            ]
          }
        },
        totalAmountReceived: {
          $sum: {
            $cond: [{ $eq: ['$giftType', 'received'] }, '$amount', 0]
          }
        },
        averageGiftAmount: { $avg: '$amount' }
      }
    }
  ]);

  const typeStats = await Gift.aggregate([
    { $match: { userId: userId, isActive: true } },
    {
      $group: {
        _id: '$giftType',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        averageAmount: { $avg: '$amount' }
      }
    }
  ]);

  const categoryStats = await Gift.aggregate([
    { $match: { userId: userId, isActive: true } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalGifts: 0,
          totalGiven: 0,
          totalReceived: 0,
          totalAmountGiven: 0,
          totalAmountReceived: 0,
          averageGiftAmount: 0
        },
        byType: typeStats,
        byCategory: categoryStats
      }
    });
  } catch (error) {
    console.error('Gift stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get gift statistics',
      error: error.message
    });
  }
});

module.exports = {
  getGifts,
  getGift,
  createGift,
  updateGift,
  deleteGift,
  getGiftStats
};
