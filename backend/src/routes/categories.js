const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { listCategories, createCategory } = require('../controllers/categoryController');

const router = express.Router();

router.use(authenticateToken);
router.get('/', listCategories);
router.post('/', createCategory);

module.exports = router;
