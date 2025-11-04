/**
 * Utility functions for pagination
 */

/**
 * Create pagination object
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Pagination object
 */
const createPagination = (page = 1, limit = 10, total = 0) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    currentPage: parseInt(page),
    totalPages,
    totalItems: total,
    itemsPerPage: parseInt(limit),
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};

/**
 * Get pagination parameters from query
 * @param {Object} query - Express request query object
 * @returns {Object} Pagination parameters
 */
const getPaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  // Validate pagination parameters
  const validatedPage = Math.max(1, page);
  // Allow higher limit when explicitly requested (up to 10000 for bulk operations)
  // If limit >= 1000, allow up to 10000; otherwise max 100
  const maxLimit = limit >= 1000 ? 10000 : 100;
  const validatedLimit = Math.min(Math.max(1, limit), maxLimit);
  const validatedSkip = (validatedPage - 1) * validatedLimit;

  return {
    page: validatedPage,
    limit: validatedLimit,
    skip: validatedSkip
  };
};

/**
 * Get sort parameters from query
 * @param {Object} query - Express request query object
 * @param {Array} allowedFields - Allowed fields for sorting
 * @returns {Object} Sort parameters
 */
const getSortParams = (query, allowedFields = []) => {
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  // Validate sort field
  const validatedSortBy = allowedFields.includes(sortBy) ? sortBy : 'createdAt';

  return {
    [validatedSortBy]: sortOrder
  };
};

/**
 * Create paginated response
 * @param {Array} data - Array of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Paginated response
 */
const createPaginatedResponse = (data, page, limit, total) => {
  const pagination = createPagination(page, limit, total);

  return {
    success: true,
    data,
    pagination
  };
};

/**
 * Apply pagination to Mongoose query
 * @param {Object} query - Mongoose query object
 * @param {Object} options - Pagination options
 * @returns {Object} Modified query
 */
const applyPagination = (query, options = {}) => {
  const { page = 1, limit = 10, sort = {} } = options;
  const skip = (page - 1) * limit;

  return query
    .skip(skip)
    .limit(limit)
    .sort(sort);
};

/**
 * Get date range parameters
 * @param {Object} query - Express request query object
 * @returns {Object} Date range parameters
 */
const getDateRangeParams = (query) => {
  const startDate = query.startDate ? new Date(query.startDate) : null;
  const endDate = query.endDate ? new Date(query.endDate) : null;

  // Validate dates
  if (startDate && isNaN(startDate.getTime())) {
    throw new Error('Invalid start date');
  }
  if (endDate && isNaN(endDate.getTime())) {
    throw new Error('Invalid end date');
  }

  // Set end date to end of day if provided
  if (endDate) {
    endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
};

/**
 * Create date range filter for MongoDB
 * @param {Object} query - Express request query object
 * @param {string} dateField - Field name for date filtering
 * @returns {Object} MongoDB date filter
 */
const createDateRangeFilter = (query, dateField = 'createdAt') => {
  const { startDate, endDate } = getDateRangeParams(query);
  
  const filter = {};
  
  if (startDate || endDate) {
    filter[dateField] = {};
    
    if (startDate) {
      filter[dateField].$gte = startDate;
    }
    
    if (endDate) {
      filter[dateField].$lte = endDate;
    }
  }
  
  return filter;
};

/**
 * Calculate offset for pagination
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {number} Offset value
 */
const calculateOffset = (page, limit) => {
  return Math.max(0, (page - 1) * limit);
};

/**
 * Validate pagination parameters
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Validated parameters
 */
const validatePaginationParams = (page, limit) => {
  const validatedPage = Math.max(1, parseInt(page) || 1);
  const validatedLimit = Math.min(Math.max(1, parseInt(limit) || 10), 100);
  
  return {
    page: validatedPage,
    limit: validatedLimit
  };
};

module.exports = {
  createPagination,
  getPaginationParams,
  getSortParams,
  createPaginatedResponse,
  applyPagination,
  getDateRangeParams,
  createDateRangeFilter,
  calculateOffset,
  validatePaginationParams
};


