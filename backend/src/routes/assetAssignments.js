const express = require('express');
const router = express.Router();
const {
  getAssetAssignments,
  getAssetAssignment,
  createAssetAssignment,
  updateAssetAssignment,
  deleteAssetAssignment,
  getAssetAssignmentStats,
  addCheckIn,
  addPayment,
  markAsReturned
} = require('../controllers/assetAssignmentController');
const { authenticateToken } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Asset Assignments
 *   description: Asset assignment management
 */

/**
 * @swagger
 * /asset-assignments:
 *   get:
 *     summary: Get all asset assignments for user
 *     tags: [Asset Assignments]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, returned, overdue, lost, damaged, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: assignmentType
 *         schema:
 *           type: string
 *           enum: [loan, rental, temporary, permanent, maintenance, storage, other]
 *         description: Filter by assignment type
 *       - in: query
 *         name: assetCategory
 *         schema:
 *           type: string
 *           enum: [vehicle, equipment, property, livestock, electronics, furniture, tools, other]
 *         description: Filter by asset category
 *       - in: query
 *         name: overdue
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter overdue assignments
 *     responses:
 *       200:
 *         description: Asset assignments retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, validatePagination, getAssetAssignments);

/**
 * @swagger
 * /asset-assignments/stats:
 *   get:
 *     summary: Get asset assignment statistics
 *     tags: [Asset Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Asset assignment statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', authenticateToken, getAssetAssignmentStats);

/**
 * @swagger
 * /asset-assignments/{id}:
 *   get:
 *     summary: Get single asset assignment
 *     tags: [Asset Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset assignment ID
 *     responses:
 *       200:
 *         description: Asset assignment retrieved successfully
 *       404:
 *         description: Asset assignment not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authenticateToken, validateObjectId('id'), getAssetAssignment);

/**
 * @swagger
 * /asset-assignments:
 *   post:
 *     summary: Create new asset assignment
 *     tags: [Asset Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contactId
 *               - assignmentType
 *               - assetDescription
 *               - assetCategory
 *               - assetValue
 *             properties:
 *               contactId:
 *                 type: string
 *               assetId:
 *                 type: string
 *               assignmentType:
 *                 type: string
 *                 enum: [loan, rental, temporary, permanent, maintenance, storage, other]
 *               assetDescription:
 *                 type: string
 *               assetCategory:
 *                 type: string
 *                 enum: [vehicle, equipment, property, livestock, electronics, furniture, tools, other]
 *               assetValue:
 *                 type: number
 *               currency:
 *                 type: string
 *                 enum: [FRW, USD, EUR, GBP]
 *               assignmentDate:
 *                 type: string
 *                 format: date-time
 *               expectedReturnDate:
 *                 type: string
 *                 format: date-time
 *               depositAmount:
 *                 type: number
 *               rentalAmount:
 *                 type: number
 *               paymentFrequency:
 *                 type: string
 *                 enum: [one-time, daily, weekly, monthly, quarterly, yearly]
 *               currentLocation:
 *                 type: string
 *               originalLocation:
 *                 type: string
 *               contract:
 *                 type: object
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Asset assignment created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateToken, createAssetAssignment);

/**
 * @swagger
 * /asset-assignments/{id}:
 *   put:
 *     summary: Update asset assignment
 *     tags: [Asset Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assignmentType:
 *                 type: string
 *               assetDescription:
 *                 type: string
 *               assetCategory:
 *                 type: string
 *               assetValue:
 *                 type: number
 *               expectedReturnDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [active, returned, overdue, lost, damaged, cancelled]
 *               condition:
 *                 type: string
 *                 enum: [excellent, good, fair, poor, damaged]
 *               currentLocation:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Asset assignment updated successfully
 *       400:
 *         description: Validation error or cannot update returned assignment
 *       404:
 *         description: Asset assignment not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authenticateToken, validateObjectId('id'), updateAssetAssignment);

/**
 * @swagger
 * /asset-assignments/{id}:
 *   delete:
 *     summary: Delete asset assignment
 *     tags: [Asset Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset assignment ID
 *     responses:
 *       200:
 *         description: Asset assignment deleted successfully
 *       404:
 *         description: Asset assignment not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authenticateToken, validateObjectId('id'), deleteAssetAssignment);

/**
 * @swagger
 * /asset-assignments/{id}/check-in:
 *   post:
 *     summary: Add check-in to asset assignment
 *     tags: [Asset Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - location
 *               - condition
 *             properties:
 *               location:
 *                 type: string
 *               condition:
 *                 type: string
 *                 enum: [excellent, good, fair, poor, damaged]
 *               notes:
 *                 type: string
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Check-in added successfully
 *       404:
 *         description: Asset assignment not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/check-in', authenticateToken, validateObjectId('id'), addCheckIn);

/**
 * @swagger
 * /asset-assignments/{id}/payments:
 *   post:
 *     summary: Add payment to asset assignment
 *     tags: [Asset Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMethod
 *             properties:
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment added successfully
 *       404:
 *         description: Asset assignment not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/payments', authenticateToken, validateObjectId('id'), addPayment);

/**
 * @swagger
 * /asset-assignments/{id}/return:
 *   post:
 *     summary: Mark asset assignment as returned
 *     tags: [Asset Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               returnDate:
 *                 type: string
 *                 format: date-time
 *               condition:
 *                 type: string
 *                 enum: [excellent, good, fair, poor, damaged]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Asset assignment marked as returned
 *       404:
 *         description: Asset assignment not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/return', authenticateToken, validateObjectId('id'), markAsReturned);

module.exports = router;

