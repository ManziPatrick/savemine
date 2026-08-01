const express = require('express');
const router = express.Router();
const {
  getDocuments,
  getDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
  getDocumentStats
} = require('../controllers/documentController');
const { authenticateToken } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// All routes require authentication
router.use(authenticateToken);

router.get('/stats', getDocumentStats);
router.post('/upload', uploadSingle('file'), uploadDocument);

router.route('/')
  .get(getDocuments);

router.route('/:id')
  .get(getDocument)
  .put(updateDocument)
  .delete(deleteDocument);

module.exports = router;
