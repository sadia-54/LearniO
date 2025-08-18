const express = require('express');
const { generateQuickPlans } = require('../controllers/quickPlanController');

const router = express.Router();

// Quick plans for one or more free-text goals (no DB writes)
router.post('/quick-plans', generateQuickPlans);

module.exports = router;
