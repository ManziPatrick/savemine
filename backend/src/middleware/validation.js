const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

/**
 * User registration validation
 */
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

/**
 * User login validation
 */
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

/**
 * Contact validation
 */
const validateContact = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('phone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  body('type')
    .isIn(['debtor', 'creditor', 'partner'])
    .withMessage('Type must be debtor, creditor, or partner'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  handleValidationErrors
];

/**
 * Transaction validation
 */
const validateTransaction = [
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be income or expense'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category is required and must be less than 50 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO date'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
  handleValidationErrors
];

/**
 * Loan validation
 */
const validateLoan = [
  body('contactId')
    .isMongoId()
    .withMessage('Contact ID must be a valid MongoDB ObjectId'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('givenDate')
    .isISO8601()
    .withMessage('Given date must be a valid ISO date'),
  body('dueDate')
    .isISO8601()
    .withMessage('Due date must be a valid ISO date'),
  body('interestRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Interest rate must be between 0 and 100'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
  handleValidationErrors
];

/**
 * Savings validation
 */
const validateSavings = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('location')
    .isIn(['SACCO', 'MTN MoMo', 'Bank', 'Cash'])
    .withMessage('Location must be SACCO, MTN MoMo, Bank, or Cash'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('targetAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Target amount must be a positive number'),
  body('targetDate')
    .optional()
    .isISO8601()
    .withMessage('Target date must be a valid ISO date'),
  handleValidationErrors
];

/**
 * Asset validation
 */
const validateAsset = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('value')
    .isFloat({ min: 0 })
    .withMessage('Value must be a positive number'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category is required and must be less than 50 characters'),
  body('status')
    .optional()
    .isIn(['owned', 'loaned', 'shared'])
    .withMessage('Status must be owned, loaned, or shared'),
  body('purchaseDate')
    .optional()
    .isISO8601()
    .withMessage('Purchase date must be a valid ISO date'),
  handleValidationErrors
];

/**
 * Business Project validation
 */
const validateBusinessProject = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category is required and must be less than 50 characters'),
  body('capitalInvested')
    .isFloat({ min: 0 })
    .withMessage('Capital invested must be a positive number'),
  body('progressPercent')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Progress must be between 0 and 100'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid ISO date'),
  body('status')
    .optional()
    .isIn(['planning', 'active', 'paused', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  handleValidationErrors
];

/**
 * Reminder validation
 */
const validateReminder = [
  body('modelType')
    .isIn(['loan', 'transaction', 'custom'])
    .withMessage('Model type must be loan, transaction, or custom'),
  body('modelId')
    .isMongoId()
    .withMessage('Model ID must be a valid MongoDB ObjectId'),
  body('title')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters'),
  body('sendAt')
    .isISO8601()
    .withMessage('Send date must be a valid ISO date'),
  body('messageTemplate')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Message template must be between 10 and 500 characters'),
  body('channels')
    .optional()
    .isArray()
    .withMessage('Channels must be an array'),
  body('channels.*')
    .optional()
    .isIn(['sms', 'whatsapp', 'email'])
    .withMessage('Each channel must be sms, whatsapp, or email'),
  handleValidationErrors
];

/**
 * MongoDB ObjectId validation
 */
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`${paramName} must be a valid MongoDB ObjectId`),
  handleValidationErrors
];

/**
 * Pagination validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .custom((value) => {
      const limit = parseInt(value);
      if (isNaN(limit) || limit < 1) {
        throw new Error('Limit must be a positive integer');
      }
      // Allow up to 10000 when limit >= 1000 (for bulk operations like fetching all contacts)
      // Otherwise max 100 for normal pagination
      const maxLimit = limit >= 1000 ? 10000 : 100;
      if (limit > maxLimit) {
        throw new Error(`Limit must be between 1 and ${maxLimit}`);
      }
      return true;
    }),
  query('sortBy')
    .optional()
    .isString()
    .withMessage('Sort by must be a string'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  handleValidationErrors
];

/**
 * Date range validation
 */
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO date'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateContact,
  validateTransaction,
  validateLoan,
  validateSavings,
  validateAsset,
  validateBusinessProject,
  validateReminder,
  validateObjectId,
  validatePagination,
  validateDateRange
};


