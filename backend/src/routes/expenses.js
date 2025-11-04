const express = require('express');
const {
  getExpenses,
  createExpense,
  getExpenseStats
} = require('../controllers/expenseController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.route('/')
  .get(getExpenses)
  .post(createExpense);

router.route('/stats').get(getExpenseStats);

module.exports = router;

