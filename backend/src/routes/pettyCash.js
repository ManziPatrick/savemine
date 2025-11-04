const express = require('express');
const router = express.Router();
const {
  getPettyCash,
  updatePettyCash,
  addDeposit,
  makeWithdrawal,
  getTransactions,
  getPettyCashStats
} = require('../controllers/pettyCashController');
const { authenticateToken } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Petty Cash
 *   description: Petty cash management
 */

/**
 * @swagger
 * /petty-cash:
 *   get:
 *     summary: Get petty cash account
 *     tags: [Petty Cash]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Petty cash account retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, getPettyCash);

/**
 * @swagger
 * /petty-cash/stats:
 *   get:
 *     summary: Get petty cash statistics
 *     tags: [Petty Cash]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Petty cash statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', authenticateToken, getPettyCashStats);

/**
 * @swagger
 * /petty-cash/transactions:
 *   get:
 *     summary: Get petty cash transactions
 *     tags: [Petty Cash]
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
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/transactions', authenticateToken, validatePagination, getTransactions);

/**
 * @swagger
 * /petty-cash:
 *   put:
 *     summary: Update petty cash account
 *     tags: [Petty Cash]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               settings:
 *                 type: object
 *                 properties:
 *                   lowBalanceThreshold:
 *                     type: number
 *                   autoReplenish:
 *                     type: object
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Petty cash account updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put('/', authenticateToken, updatePettyCash);

/**
 * @swagger
 * /petty-cash/deposit:
 *   post:
 *     summary: Add money to petty cash
 *     tags: [Petty Cash]
 *     security:
 *       - bearerAuth: []
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
 *                 minimum: 0.01
 *               description:
 *                 type: string
 *               source:
 *                 type: string
 *     responses:
 *       200:
 *         description: Money added successfully
 *       400:
 *         description: Invalid amount
 *       401:
 *         description: Unauthorized
 */
router.post('/deposit', authenticateToken, addDeposit);

/**
 * @swagger
 * /petty-cash/withdraw:
 *   post:
 *     summary: Withdraw money from petty cash
 *     tags: [Petty Cash]
 *     security:
 *       - bearerAuth: []
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
 *                 minimum: 0.01
 *               description:
 *                 type: string
 *               purpose:
 *                 type: string
 *     responses:
 *       200:
 *         description: Money withdrawn successfully
 *       400:
 *         description: Invalid amount or insufficient funds
 *       401:
 *         description: Unauthorized
 */
router.post('/withdraw', authenticateToken, makeWithdrawal);

module.exports = router;

