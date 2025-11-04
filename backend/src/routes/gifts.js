const express = require('express');
const {
  getGifts,
  getGift,
  createGift,
  updateGift,
  deleteGift,
  getGiftStats
} = require('../controllers/giftController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.route('/')
  .get(getGifts)
  .post(createGift);

router.route('/stats').get(getGiftStats);

router.route('/:id')
  .get(getGift)
  .put(updateGift)
  .delete(deleteGift);

module.exports = router;

