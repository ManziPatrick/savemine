const path = require('path');
const mongoose = require('mongoose');
const Document = require('../models/Document');
const { asyncHandler } = require('../middleware/errorHandler');
const { deleteFile } = require('../middleware/upload');
const { getPaginationParams, getSortParams, createPaginatedResponse } = require('../utils/pagination');

const VALID_DOCUMENT_TYPES = [
  'receipt', 'invoice', 'contract', 'agreement', 'photo', 'identity_document',
  'proof_of_payment', 'insurance', 'warranty', 'certificate', 'report',
  'statement', 'tax_document', 'other'
];

const VALID_RELATED_ENTITIES = ['loan', 'contact', 'asset', 'investment', 'business', 'expense', 'gift', 'general'];

/**
 * @desc    Get all documents for user
 * @route   GET /documents
 * @access  Private
 */
const getDocuments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const sort = getSortParams(req.query, ['uploadDate', 'title', 'documentType', 'createdAt']);

  const filter = { userId: req.user._id, isActive: true };

  if (req.query.documentType) {
    filter.documentType = req.query.documentType;
  }
  if (req.query.relatedEntity) {
    filter.relatedEntity = req.query.relatedEntity;
  }
  if (req.query.relatedEntityId) {
    filter.relatedEntityId = req.query.relatedEntityId;
  }
  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
      { originalFileName: { $regex: req.query.search, $options: 'i' } },
      { tags: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  // Upcoming / expired filters
  if (req.query.expiring === 'true') {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + (parseInt(req.query.days) || 30));
    filter.expiryDate = { $lte: futureDate, $gte: new Date() };
  }
  if (req.query.expired === 'true') {
    filter.expiryDate = { $lt: new Date() };
  }

  const documents = await Document.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Document.countDocuments(filter);

  res.json(createPaginatedResponse(documents, page, limit, total));
});

/**
 * @desc    Get single document
 * @route   GET /documents/:id
 * @access  Private
 */
const getDocument = asyncHandler(async (req, res) => {
  const document = await Document.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!document || !document.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  res.json({
    success: true,
    data: { document }
  });
});

/**
 * @desc    Upload a new document
 * @route   POST /documents/upload
 * @access  Private
 */
const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const {
    title,
    relatedEntity = 'general',
    relatedEntityId,
    documentType = 'other',
    description,
    expiryDate,
    isPublic,
    tags,
    notes
  } = req.body;

  // Clean up uploaded file if validation fails
  const rejectUpload = (message) => {
    deleteFile(req.file.path);
    return res.status(400).json({
      success: false,
      message
    });
  };

  if (!title) {
    return rejectUpload('Title is required');
  }

  if (!VALID_RELATED_ENTITIES.includes(relatedEntity)) {
    return rejectUpload(`Invalid relatedEntity. Must be one of: ${VALID_RELATED_ENTITIES.join(', ')}`);
  }

  if (!VALID_DOCUMENT_TYPES.includes(documentType)) {
    return rejectUpload(`Invalid documentType. Must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}`);
  }

  if (relatedEntityId && !mongoose.isValidObjectId(relatedEntityId)) {
    return rejectUpload('Invalid relatedEntityId format');
  }

  let parsedExpiryDate;
  if (expiryDate) {
    parsedExpiryDate = new Date(expiryDate);
    if (Number.isNaN(parsedExpiryDate.getTime())) {
      return rejectUpload('Invalid expiryDate format');
    }
  }

  const fileExtension = path.extname(req.file.originalname).replace('.', '').toLowerCase() || 'unknown';
  // Prefer a configured API URL over the client-supplied Host header
  const baseUrl = (process.env.API_URL || process.env.PRODUCTION_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

  let document;
  try {
    document = await Document.create({
      userId: req.user._id,
      relatedEntity,
      relatedEntityId: relatedEntityId || null,
      documentType,
      title,
      description: description || '',
      originalFileName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileUrl,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileExtension,
      uploadDate: new Date(),
      expiryDate: parsedExpiryDate,
      isPublic: isPublic === 'true' || isPublic === true,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
      notes: notes || ''
    });
  } catch (error) {
    // Don't leave an orphaned file behind if the DB insert fails
    deleteFile(req.file.path);
    throw error;
  }

  res.status(201).json({
    success: true,
    message: 'Document uploaded successfully',
    data: { document }
  });
});

/**
 * @desc    Update document metadata
 * @route   PUT /documents/:id
 * @access  Private
 */
const updateDocument = asyncHandler(async (req, res) => {
  const document = await Document.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!document || !document.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  const updateData = {};
  const { title, description, documentType, relatedEntity, relatedEntityId, expiryDate, isPublic, tags, notes } = req.body;

  if (relatedEntityId !== undefined && relatedEntityId && !mongoose.isValidObjectId(relatedEntityId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid relatedEntityId format'
    });
  }

  let parsedExpiryDate;
  if (expiryDate !== undefined && expiryDate) {
    parsedExpiryDate = new Date(expiryDate);
    if (Number.isNaN(parsedExpiryDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expiryDate format'
      });
    }
  }

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (notes !== undefined) updateData.notes = notes;
  if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? parsedExpiryDate : null;
  if (isPublic !== undefined) updateData.isPublic = isPublic === true || isPublic === 'true';
  if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [tags];
  if (relatedEntityId !== undefined) updateData.relatedEntityId = relatedEntityId || null;

  if (documentType !== undefined) {
    if (!VALID_DOCUMENT_TYPES.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid documentType. Must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}`
      });
    }
    updateData.documentType = documentType;
  }

  if (relatedEntity !== undefined) {
    if (!VALID_RELATED_ENTITIES.includes(relatedEntity)) {
      return res.status(400).json({
        success: false,
        message: `Invalid relatedEntity. Must be one of: ${VALID_RELATED_ENTITIES.join(', ')}`
      });
    }
    updateData.relatedEntity = relatedEntity;
  }

  const updatedDocument = await Document.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Document updated successfully',
    data: { document: updatedDocument }
  });
});

/**
 * @desc    Delete document (soft delete + remove file)
 * @route   DELETE /documents/:id
 * @access  Private
 */
const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!document || !document.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  // Soft delete
  document.isActive = false;
  await document.save();

  // Best-effort file removal (don't fail if file is already gone)
  deleteFile(document.filePath);

  res.json({
    success: true,
    message: 'Document deleted successfully'
  });
});

/**
 * @desc    Get document statistics
 * @route   GET /documents/stats
 * @access  Private
 */
const getDocumentStats = asyncHandler(async (req, res) => {
  const filter = { userId: req.user._id, isActive: true };

  const totalDocuments = await Document.countDocuments(filter);
  const totalSize = await Document.aggregate([
    { $match: filter },
    { $group: { _id: null, total: { $sum: '$fileSize' } } }
  ]);

  const byType = await Document.aggregate([
    { $match: filter },
    { $group: { _id: '$documentType', count: { $sum: 1 }, size: { $sum: '$fileSize' } } }
  ]);

  const byEntity = await Document.aggregate([
    { $match: filter },
    { $group: { _id: '$relatedEntity', count: { $sum: 1 } } }
  ]);

  // Expiring soon (next 30 days)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const expiringSoon = await Document.countDocuments({
    userId: req.user._id,
    isActive: true,
    expiryDate: { $lte: futureDate, $gte: new Date() }
  });

  const expired = await Document.countDocuments({
    userId: req.user._id,
    isActive: true,
    expiryDate: { $lt: new Date() }
  });

  res.json({
    success: true,
    data: {
      totalDocuments,
      totalSize: totalSize[0]?.total || 0,
      expiringSoon,
      expired,
      byType,
      byEntity
    }
  });
});

module.exports = {
  getDocuments,
  getDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
  getDocumentStats
};
