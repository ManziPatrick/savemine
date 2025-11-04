const express = require('express');
const router = express.Router();
const {
  getLoans,
  getLoan,
  createLoan,
  updateLoan,
  addPayment,
  deleteLoan,
  getLoanStats,
  getLoanSources,
  getOverdueLoans,
  bulkImportLoans
} = require('../controllers/loanController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Loan routes
router.get('/', getLoans);
router.get('/stats', getLoanStats);
router.get('/sources', getLoanSources);
router.get('/overdue', getOverdueLoans);
router.get('/:id', getLoan);
router.post('/', createLoan);
router.post('/bulk-import', bulkImportLoans);
router.put('/:id', updateLoan);
router.post('/:id/payments', addPayment);
router.delete('/:id', deleteLoan);

module.exports = router;