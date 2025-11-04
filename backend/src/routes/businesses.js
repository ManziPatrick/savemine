const express = require('express');
const {
  getBusinesses,
  getBusiness,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getBusinessStats
} = require('../controllers/businessController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.route('/')
  .get(getBusinesses)
  .post(createBusiness);

router.route('/stats').get(getBusinessStats);

router.route('/:id')
  .get(getBusiness)
  .put(updateBusiness)
  .delete(deleteBusiness);

module.exports = router;