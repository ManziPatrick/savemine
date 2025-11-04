const express = require('express');
const router = express.Router();
const {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  getContactsByType,
  searchContacts,
  getContactStats,
  bulkImportContacts
} = require('../controllers/contactController');
const { authenticateToken } = require('../middleware/auth');
const { validateContact, validateObjectId, validatePagination } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Contacts
 *   description: Contact management
 */

/**
 * @swagger
 * /contacts:
 *   get:
 *     summary: Get all contacts for user
 *     tags: [Contacts]
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
 *           enum: [debtor, creditor, partner]
 *         description: Filter by contact type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name, phone, or email
 *     responses:
 *       200:
 *         description: Contacts retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, validatePagination, getContacts);

/**
 * @swagger
 * /contacts/stats:
 *   get:
 *     summary: Get contact statistics
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contact statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', authenticateToken, getContactStats);

/**
 * @swagger
 * /contacts/search:
 *   get:
 *     summary: Search contacts
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [debtor, creditor, partner]
 *         description: Filter by contact type
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/search', authenticateToken, searchContacts);

/**
 * @swagger
 * /contacts/type/{type}:
 *   get:
 *     summary: Get contacts by type
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [debtor, creditor, partner]
 *         description: Contact type
 *     responses:
 *       200:
 *         description: Contacts retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/type/:type', authenticateToken, getContactsByType);

/**
 * @swagger
 * /contacts/{id}:
 *   get:
 *     summary: Get single contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *     responses:
 *       200:
 *         description: Contact retrieved successfully
 *       404:
 *         description: Contact not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authenticateToken, validateObjectId('id'), getContact);

/**
 * @swagger
 * /contacts:
 *   post:
 *     summary: Create new contact
 *     tags: [Contacts]
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
 *               - phone
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [debtor, creditor, partner]
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               notes:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Contact created successfully
 *       400:
 *         description: Validation error or contact already exists
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateToken, validateContact, createContact);

/**
 * @swagger
 * /contacts/{id}:
 *   put:
 *     summary: Update contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               type:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               notes:
 *                 type: string
 *               tags:
 *                 type: array
 *     responses:
 *       200:
 *         description: Contact updated successfully
 *       400:
 *         description: Validation error or phone already exists
 *       404:
 *         description: Contact not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authenticateToken, validateObjectId('id'), updateContact);

/**
 * @swagger
 * /contacts/{id}:
 *   delete:
 *     summary: Delete contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *     responses:
 *       200:
 *         description: Contact deleted successfully
 *       404:
 *         description: Contact not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authenticateToken, validateObjectId('id'), deleteContact);

/**
 * @swagger
 * /contacts/bulk-import:
 *   post:
 *     summary: Bulk import contacts from CSV
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contacts
 *             properties:
 *               contacts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - phone
 *                   properties:
 *                     name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [debtor, creditor, partner]
 *                     email:
 *                       type: string
 *                     address:
 *                       type: string
 *                     notes:
 *                       type: string
 *     responses:
 *       200:
 *         description: Contacts imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     imported:
 *                       type: integer
 *                     failed:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/bulk-import', authenticateToken, bulkImportContacts);

module.exports = router;
