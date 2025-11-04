const express = require('express');
const {
  getInvestments,
  getInvestment,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  updateInvestmentValue,
  addDividend,
  getInvestmentStats
} = require('../controllers/investmentController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.route('/')
  .get(getInvestments)
  .post(createInvestment);

router.route('/stats').get(getInvestmentStats);

router.route('/:id')
  .get(getInvestment)
  .put(updateInvestment)
  .delete(deleteInvestment);

router.route('/:id/update-value').post(updateInvestmentValue);
router.route('/:id/dividends').post(addDividend);

module.exports = router;

