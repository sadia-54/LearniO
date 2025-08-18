const express = require('express');
const { getUserProgressSummary } = require('../controllers/progressController');

const router = express.Router();

// GET /api/progress/:userId/summary
router.get('/progress/:userId/summary', getUserProgressSummary);

module.exports = router;
