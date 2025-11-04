const express = require('express');
const router = express.Router();
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  getTransactionsByCategory,
  uploadAttachment
} = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/auth');
const { validateTransaction, validateObjectId, validatePagination, validateDateRange } = require('../middleware/validation');
const { uploadSingle } = require('../middleware/upload');

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transaction management
 */

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Get all transactions for user
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *         description: Filter by transaction type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: contactId
 *         schema:
 *           type: string
 *         description: Filter by contact
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions before this date
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, validatePagination, validateDateRange, getTransactions);

/**
 * @swagger
 * /transactions/stats:
 *   get:
 *     summary: Get transaction statistics
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics
 *     responses:
 *       200:
 *         description: Transaction statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', authenticateToken, validateDateRange, getTransactionStats);

/**
 * @swagger
 * /transactions/categories:
 *   get:
 *     summary: Get transactions by category
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *         description: Filter by transaction type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: Category statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/categories', authenticateToken, validateDateRange, getTransactionsByCategory);

/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     summary: Get single transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authenticateToken, validateObjectId('id'), getTransaction);

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Create new transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - amount
 *               - category
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: FRW
 *               category:
 *                 type: string
 *               subcategory:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               notes:
 *                 type: string
 *               contactId:
 *                 type: string
 *               tags:
 *                 type: array
 *               isRecurring:
 *                 type: boolean
 *               recurringPattern:
 *                 type: object
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateToken, validateTransaction, createTransaction);

/**
 * @swagger
 * /transactions/{id}:
 *   put:
 *     summary: Update transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               category:
 *                 type: string
 *               subcategory:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               notes:
 *                 type: string
 *               contactId:
 *                 type: string
 *               tags:
 *                 type: array
 *               status:
 *                 type: string
 *                 enum: [pending, completed, cancelled]
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authenticateToken, validateObjectId('id'), updateTransaction);

/**
 * @swagger
 * /transactions/{id}:
 *   delete:
 *     summary: Delete transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authenticateToken, validateObjectId('id'), deleteTransaction);

/**
 * @swagger
 * /transactions/{id}/attachment:
 *   post:
 *     summary: Upload attachment for transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Receipt or proof document (image or PDF)
 *     responses:
 *       200:
 *         description: Attachment uploaded successfully
 *       400:
 *         description: File required
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/attachment', authenticateToken, validateObjectId('id'), uploadSingle('file'), uploadAttachment);

module.exports = router;


