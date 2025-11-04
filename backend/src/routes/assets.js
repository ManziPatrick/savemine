const express = require('express');
const router = express.Router();
const {
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  updateValue,
  getAssetStats,
  getAssetsByCategory,
  uploadProof
} = require('../controllers/assetController');
const { authenticateToken } = require('../middleware/auth');
const { validateAsset, validateObjectId, validatePagination } = require('../middleware/validation');
const { uploadSingle } = require('../middleware/upload');

/**
 * @swagger
 * tags:
 *   name: Assets
 *   description: Asset management
 */

/**
 * @swagger
 * /assets:
 *   get:
 *     summary: Get all assets for user
 *     tags: [Assets]
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
 *           enum: [owned, loaned, shared]
 *         description: Filter by status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: Assets retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, validatePagination, getAssets);

/**
 * @swagger
 * /assets/stats:
 *   get:
 *     summary: Get asset statistics
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Asset statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', authenticateToken, getAssetStats);

/**
 * @swagger
 * /assets/category/{category}:
 *   get:
 *     summary: Get assets by category
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset category
 *     responses:
 *       200:
 *         description: Assets retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/category/:category', authenticateToken, getAssetsByCategory);

/**
 * @swagger
 * /assets/{id}:
 *   get:
 *     summary: Get single asset
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset ID
 *     responses:
 *       200:
 *         description: Asset retrieved successfully
 *       404:
 *         description: Asset not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authenticateToken, validateObjectId('id'), getAsset);

/**
 * @swagger
 * /assets:
 *   post:
 *     summary: Create new asset
 *     tags: [Assets]
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
 *               - value
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               value:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: FRW
 *               category:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [owned, loaned, shared]
 *               ownerContactId:
 *                 type: string
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *               depreciationRate:
 *                 type: number
 *               location:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *               notes:
 *                 type: string
 *               tags:
 *                 type: array
 *     responses:
 *       201:
 *         description: Asset created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateToken, validateAsset, createAsset);

/**
 * @swagger
 * /assets/{id}:
 *   put:
 *     summary: Update asset
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset ID
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
 *               value:
 *                 type: number
 *               currency:
 *                 type: string
 *               category:
 *                 type: string
 *               status:
 *                 type: string
 *               ownerContactId:
 *                 type: string
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *               depreciationRate:
 *                 type: number
 *               location:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *               notes:
 *                 type: string
 *               tags:
 *                 type: array
 *     responses:
 *       200:
 *         description: Asset updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Asset not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authenticateToken, validateObjectId('id'), updateAsset);

/**
 * @swagger
 * /assets/{id}:
 *   delete:
 *     summary: Delete asset
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset ID
 *     responses:
 *       200:
 *         description: Asset deleted successfully
 *       404:
 *         description: Asset not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authenticateToken, validateObjectId('id'), deleteAsset);

/**
 * @swagger
 * /assets/{id}/update-value:
 *   post:
 *     summary: Update asset value
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: number
 *               depreciationRate:
 *                 type: number
 *     responses:
 *       200:
 *         description: Asset value updated successfully
 *       400:
 *         description: Value must be positive
 *       404:
 *         description: Asset not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/update-value', authenticateToken, validateObjectId('id'), updateValue);

/**
 * @swagger
 * /assets/{id}/proof:
 *   post:
 *     summary: Upload proof document for asset
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset ID
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
 *                 description: Proof document (image or PDF)
 *     responses:
 *       200:
 *         description: Proof uploaded successfully
 *       400:
 *         description: File required
 *       404:
 *         description: Asset not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/proof', authenticateToken, validateObjectId('id'), uploadSingle('file'), uploadProof);

module.exports = router;


