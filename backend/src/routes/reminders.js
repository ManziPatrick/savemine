const express = require('express');
const router = express.Router();
const {
  getReminders,
  getReminder,
  createReminder,
  updateReminder,
  deleteReminder,
  sendReminderNow,
  sendBulkReminders,
  getDueReminders,
  getOverdueReminders,
  getReminderStats,
  bulkCreateLoanReminders
} = require('../controllers/reminderController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateReminder, validateObjectId, validatePagination } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Reminders
 *   description: Reminder management and SMS/WhatsApp notifications
 */

/**
 * @swagger
 * /reminders:
 *   get:
 *     summary: Get all reminders for user
 *     tags: [Reminders]
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
 *           enum: [scheduled, sent, failed, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: modelType
 *         schema:
 *           type: string
 *           enum: [loan, transaction, custom]
 *         description: Filter by model type
 *     responses:
 *       200:
 *         description: Reminders retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, validatePagination, getReminders);

/**
 * @swagger
 * /reminders/due:
 *   get:
 *     summary: Get due reminders
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Due reminders retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/due', authenticateToken, getDueReminders);

/**
 * @swagger
 * /reminders/stats:
 *   get:
 *     summary: Get reminder statistics
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reminder statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', authenticateToken, getReminderStats);

/**
 * @swagger
 * /reminders/bulk-send:
 *   post:
 *     summary: Send multiple reminders immediately
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reminderIds
 *             properties:
 *               reminderIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of reminder IDs to send
 *     responses:
 *       200:
 *         description: Bulk reminders sent successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/bulk-send', authenticateToken, sendBulkReminders);

/**
 * @swagger
 * /reminders/{id}:
 *   get:
 *     summary: Get single reminder
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reminder ID
 *     responses:
 *       200:
 *         description: Reminder retrieved successfully
 *       404:
 *         description: Reminder not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authenticateToken, validateObjectId('id'), getReminder);

/**
 * @swagger
 * /reminders:
 *   post:
 *     summary: Create new reminder
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modelType
 *               - modelId
 *               - title
 *               - sendAt
 *               - messageTemplate
 *             properties:
 *               modelType:
 *                 type: string
 *                 enum: [loan, transaction, custom]
 *               modelId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               sendAt:
 *                 type: string
 *                 format: date-time
 *               repeatRule:
 *                 type: object
 *                 properties:
 *                   frequency:
 *                     type: string
 *                     enum: [none, daily, weekly, monthly, yearly]
 *                   interval:
 *                     type: integer
 *                   endDate:
 *                     type: string
 *                     format: date
 *               messageTemplate:
 *                 type: string
 *               autoSend:
 *                 type: boolean
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [sms, whatsapp, email]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *     responses:
 *       201:
 *         description: Reminder created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateToken, validateReminder, createReminder);

/**
 * @swagger
 * /reminders/{id}:
 *   put:
 *     summary: Update reminder
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reminder ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               sendAt:
 *                 type: string
 *                 format: date-time
 *               repeatRule:
 *                 type: object
 *               messageTemplate:
 *                 type: string
 *               autoSend:
 *                 type: boolean
 *               channels:
 *                 type: array
 *               priority:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [scheduled, sent, failed, cancelled]
 *     responses:
 *       200:
 *         description: Reminder updated successfully
 *       400:
 *         description: Validation error or cannot update sent reminder
 *       404:
 *         description: Reminder not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authenticateToken, validateObjectId('id'), updateReminder);

/**
 * @swagger
 * /reminders/{id}:
 *   delete:
 *     summary: Delete reminder
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reminder ID
 *     responses:
 *       200:
 *         description: Reminder deleted successfully
 *       404:
 *         description: Reminder not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authenticateToken, validateObjectId('id'), deleteReminder);

/**
 * @swagger
 * /reminders/{id}/send-now:
 *   post:
 *     summary: Send reminder immediately
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reminder ID
 *     responses:
 *       200:
 *         description: Reminder sent successfully
 *       400:
 *         description: Reminder already sent or no contact phone available
 *       404:
 *         description: Reminder not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to send reminder
 */
router.post('/:id/send-now', authenticateToken, validateObjectId('id'), sendReminderNow);

module.exports = router;


