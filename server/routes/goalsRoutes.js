
const express = require('express');
const router = express.Router();
const goalsController = require('../controllers/goalsController');

router.post('/', goalsController.createGoal);

module.exports = router;
