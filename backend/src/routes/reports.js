const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getReport, saveReportSettings, sendReport } = require('../controllers/reportController');

const router = express.Router();

router.use(authenticateToken);
router.get('/', getReport);
router.put('/settings', saveReportSettings);
router.post('/send', sendReport);

module.exports = router;
