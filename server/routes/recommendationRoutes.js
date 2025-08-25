const express = require('express');
const router = express.Router();
const { generateRecommendations, getRecommendations } = require('../controllers/recommendationController');

// POST /api/users/:userId/recommendations/generate - Generate new AI recommendations
router.post('/users/:userId/recommendations/generate', generateRecommendations);

// GET /api/users/:userId/recommendations - List recent AI recommendations
router.get('/users/:userId/recommendations', getRecommendations);

module.exports = router;
