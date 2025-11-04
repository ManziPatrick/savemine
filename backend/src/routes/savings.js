const express = require('express');
const router = express.Router();
const {
  getSavings,
  getSaving,
  createSavings,
  updateSavings,
  deleteSavings,
  addAmount,
  withdrawAmount,
  getSavingsStats,
  getSavingsByLocation
} = require('../controllers/savingsController');
const { authenticateToken } = require('../middleware/auth');
const { validateSavings, validateObjectId, validatePagination } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Savings
 *   description: Savings management
 */

/**
 * @swagger
 * /savings:
 *   get:
 *     summary: Get all savings for user
 *     tags: [Savings]
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
 *         name: location
 *         schema:
 *           type: string
 *           enum: [SACCO, MTN MoMo, Bank, Cash]
 *         description: Filter by location
 *     responses:
 *       200:
 *         description: Savings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, validatePagination, getSavings);

/**
 * @swagger
 * /savings/stats:
 *   get:
 *     summary: Get savings statistics
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Savings statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', authenticateToken, getSavingsStats);

/**
 * @swagger
 * /savings/location/{location}:
 *   get:
 *     summary: Get savings by location
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: location
 *         required: true
 *         schema:
 *           type: string
 *           enum: [SACCO, MTN MoMo, Bank, Cash]
 *         description: Savings location
 *     responses:
 *       200:
 *         description: Savings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/location/:location', authenticateToken, getSavingsByLocation);

/**
 * @swagger
 * /savings/{id}:
 *   get:
 *     summary: Get single savings
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Savings ID
 *     responses:
 *       200:
 *         description: Savings retrieved successfully
 *       404:
 *         description: Savings not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authenticateToken, validateObjectId('id'), getSaving);

/**
 * @swagger
 * /savings:
 *   post:
 *     summary: Create new savings
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *                 enum: [SACCO, MTN MoMo, Bank, Cash]
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: FRW
 *               targetAmount:
 *                 type: number
 *               targetDate:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               notes:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               interestRate:
 *                 type: number
 *     responses:
 *       201:
 *         description: Savings created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateToken, validateSavings, createSavings);

/**
 * @swagger
 * /savings/{id}:
 *   put:
 *     summary: Update savings
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Savings ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               targetAmount:
 *                 type: number
 *               targetDate:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               notes:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               interestRate:
 *                 type: number
 *     responses:
 *       200:
 *         description: Savings updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Savings not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authenticateToken, validateObjectId('id'), updateSavings);

/**
 * @swagger
 * /savings/{id}:
 *   delete:
 *     summary: Delete savings
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Savings ID
 *     responses:
 *       200:
 *         description: Savings deleted successfully
 *       404:
 *         description: Savings not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authenticateToken, validateObjectId('id'), deleteSavings);

/**
 * @swagger
 * /savings/{id}/add:
 *   post:
 *     summary: Add amount to savings
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Savings ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Amount added successfully
 *       400:
 *         description: Amount must be positive
 *       404:
 *         description: Savings not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/add', authenticateToken, validateObjectId('id'), addAmount);

/**
 * @swagger
 * /savings/{id}/withdraw:
 *   post:
 *     summary: Withdraw amount from savings
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Savings ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Amount withdrawn successfully
 *       400:
 *         description: Amount must be positive or insufficient funds
 *       404:
 *         description: Savings not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/withdraw', authenticateToken, validateObjectId('id'), withdrawAmount);

module.exports = router;


