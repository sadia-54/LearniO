const express = require('express');
const { recomputeProgress, getProgressRow } = require('../controllers/progressWriteController');

const router = express.Router();

// POST /api/users/:userId/progress/recompute -> recompute from tasks and upsert
router.post('/users/:userId/progress/recompute', recomputeProgress);

// GET /api/users/:userId/progress -> fetch raw Progress row
router.get('/users/:userId/progress', getProgressRow);

module.exports = router;
