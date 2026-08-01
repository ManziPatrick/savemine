const express = require('express');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addExpense,
  removeExpense,
  addIncome,
  removeIncome,
  getProjectStats
} = require('../controllers/projectController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/stats').get(getProjectStats);

router.route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

router.route('/:id/expenses')
  .post(addExpense);

router.route('/:id/expenses/:expenseId')
  .delete(removeExpense);

router.route('/:id/incomes')
  .post(addIncome);

router.route('/:id/incomes/:incomeId')
  .delete(removeIncome);

module.exports = router;
