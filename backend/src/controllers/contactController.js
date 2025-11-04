const Contact = require('../models/Contact');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPaginationParams, getSortParams, createPaginatedResponse } = require('../utils/pagination');

/**
 * @desc    Get all contacts for user
 * @route   GET /contacts
 * @access  Private
 */
const getContacts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const sort = getSortParams(req.query, ['name', 'type', 'createdAt']);
  
  const filter = { userId: req.user._id, isActive: true };
  
  // Add type filter
  if (req.query.type) {
    filter.type = req.query.type;
  }
  
  // Add search filter
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { phone: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const contacts = await Contact.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Contact.countDocuments(filter);

  res.json(createPaginatedResponse(contacts, page, limit, total));
});

/**
 * @desc    Get single contact
 * @route   GET /contacts/:id
 * @access  Private
 */
const getContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact not found'
    });
  }

  res.json({
    success: true,
    data: { contact }
  });
});

/**
 * @desc    Create new contact
 * @route   POST /contacts
 * @access  Private
 */
const createContact = asyncHandler(async (req, res) => {
  const { name, phone, type, email, address, notes, tags } = req.body;

  // Check if contact with same phone already exists for this user
  const existingContact = await Contact.findOne({
    userId: req.user._id,
    phone: phone
  });

  if (existingContact) {
    return res.status(400).json({
      success: false,
      message: 'Contact with this phone number already exists'
    });
  }

  const contactData = {
    userId: req.user._id,
    name,
    phone,
    type,
    email,
    address,
    notes,
    tags: tags || []
  };

  const contact = await Contact.create(contactData);

  res.status(201).json({
    success: true,
    message: 'Contact created successfully',
    data: { contact }
  });
});

/**
 * @desc    Update contact
 * @route   PUT /contacts/:id
 * @access  Private
 */
const updateContact = asyncHandler(async (req, res) => {
  const { name, phone, type, email, address, notes, tags } = req.body;

  const contact = await Contact.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact not found'
    });
  }

  // Check if new phone number conflicts with existing contact
  if (phone && phone !== contact.phone) {
    const existingContact = await Contact.findOne({
      userId: req.user._id,
      phone: phone,
      _id: { $ne: req.params.id }
    });

    if (existingContact) {
      return res.status(400).json({
        success: false,
        message: 'Contact with this phone number already exists'
      });
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (type !== undefined) updateData.type = type;
  if (email !== undefined) updateData.email = email;
  if (address !== undefined) updateData.address = address;
  if (notes !== undefined) updateData.notes = notes;
  if (tags !== undefined) updateData.tags = tags;

  const updatedContact = await Contact.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Contact updated successfully',
    data: { contact: updatedContact }
  });
});

/**
 * @desc    Delete contact (soft delete)
 * @route   DELETE /contacts/:id
 * @access  Private
 */
const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact not found'
    });
  }

  // Soft delete by setting isActive to false
  contact.isActive = false;
  await contact.save();

  res.json({
    success: true,
    message: 'Contact deleted successfully'
  });
});

/**
 * @desc    Get contacts by type
 * @route   GET /contacts/type/:type
 * @access  Private
 */
const getContactsByType = asyncHandler(async (req, res) => {
  const { type } = req.params;
  
  if (!['debtor', 'creditor', 'partner'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid contact type'
    });
  }

  const contacts = await Contact.find({
    userId: req.user._id,
    type: type,
    isActive: true
  }).sort({ name: 1 });

  res.json({
    success: true,
    data: { contacts }
  });
});

/**
 * @desc    Search contacts
 * @route   GET /contacts/search
 * @access  Private
 */
const searchContacts = asyncHandler(async (req, res) => {
  const { q, type } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Search query must be at least 2 characters'
    });
  }

  const filter = {
    userId: req.user._id,
    isActive: true,
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } }
    ]
  };

  if (type) {
    filter.type = type;
  }

  const contacts = await Contact.find(filter)
    .sort({ name: 1 })
    .limit(20);

  res.json({
    success: true,
    data: { contacts }
  });
});

/**
 * @desc    Get contact statistics
 * @route   GET /contacts/stats
 * @access  Private
 */
const getContactStats = asyncHandler(async (req, res) => {
  const stats = await Contact.aggregate([
    { $match: { userId: req.user._id, isActive: true } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalContacts = await Contact.countDocuments({
    userId: req.user._id,
    isActive: true
  });

  const typeBreakdown = stats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      totalContacts,
      typeBreakdown
    }
  });
});

/**
 * @desc    Bulk import contacts
 * @route   POST /contacts/bulk-import
 * @access  Private
 */
const bulkImportContacts = asyncHandler(async (req, res) => {
  const { contacts, replaceAll = false } = req.body;

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Contacts array is required and must not be empty'
    });
  }

  const results = {
    success: 0,
    updated: 0,
    created: 0,
    failed: 0,
    deleted: 0,
    errors: []
  };

  // If replaceAll is true, delete all existing contacts for this user
  if (replaceAll) {
    try {
      const deleteResult = await Contact.deleteMany({ 
        userId: req.user._id,
        isActive: true 
      });
      results.deleted = deleteResult.deletedCount;
    } catch (error) {
      results.errors.push(`Failed to delete existing contacts: ${error.message}`);
    }
  }

  const contactsToCreate = [];

  for (let i = 0; i < contacts.length; i++) {
    const contactData = contacts[i];
    
    try {
      // Validate required fields
      if (!contactData.name || !contactData.phone) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: Missing name or phone`);
        continue;
      }

      // Check if contact already exists
      const existingContact = await Contact.findOne({
        userId: req.user._id,
        phone: contactData.phone,
        isActive: true
      });

      if (existingContact) {
        // Update existing contact instead of skipping
        try {
          await Contact.findByIdAndUpdate(existingContact._id, {
            name: contactData.name.trim(),
            type: contactData.type || 'debtor',
            email: contactData.email ? contactData.email.trim() : undefined,
            address: contactData.address ? contactData.address.trim() : undefined,
            notes: contactData.notes ? contactData.notes.trim() : undefined,
            organization: contactData.organization ? contactData.organization.trim() : undefined,
            updatedAt: new Date()
          });
          results.success++;
          results.updated++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Failed to update existing contact: ${error.message}`);
        }
        continue;
      }

      // Prepare contact data
      const newContact = {
        userId: req.user._id,
        name: contactData.name.trim(),
        phone: contactData.phone.trim(),
        type: contactData.type || 'debtor',
        email: contactData.email ? contactData.email.trim() : undefined,
        address: contactData.address ? contactData.address.trim() : undefined,
        notes: contactData.notes ? contactData.notes.trim() : undefined,
        organization: contactData.organization ? contactData.organization.trim() : undefined
      };

      contactsToCreate.push(newContact);
    } catch (error) {
      results.failed++;
      results.errors.push(`Row ${i + 1}: ${error.message}`);
    }
  }

  // Bulk create contacts
  if (contactsToCreate.length > 0) {
    try {
      const createdContacts = await Contact.insertMany(contactsToCreate, { 
        ordered: false // Continue inserting even if some fail due to duplicates
      });
      results.success += createdContacts.length;
      results.created = createdContacts.length;
    } catch (error) {
      // Handle partial success (some contacts inserted, some failed)
      if (error.writeErrors) {
        const createdCount = contactsToCreate.length - error.writeErrors.length;
        results.success += createdCount;
        results.created = createdCount;
        results.failed += error.writeErrors.length;
        // Only log non-duplicate errors
        const nonDuplicateErrors = error.writeErrors.filter(err => 
          !err.err.errmsg.includes('duplicate key')
        );
        if (nonDuplicateErrors.length > 0) {
          results.errors.push(`Some contacts failed to import: ${nonDuplicateErrors[0].err.errmsg}`);
        }
      } else {
        results.failed += contactsToCreate.length;
        results.errors.push(`Bulk insert failed: ${error.message}`);
      }
    }
  }

  res.json({
    success: true,
    data: {
      imported: results.success,
      created: results.created,
      updated: results.updated,
      deleted: results.deleted,
      failed: results.failed,
      total: contacts.length,
      errors: results.errors
    }
  });
});

module.exports = {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  getContactsByType,
  searchContacts,
  getContactStats,
  bulkImportContacts
};
