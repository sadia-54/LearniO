
const express = require('express');
const router = express.Router();
const goalsController = require('../controllers/goalsController');

router.post('/', goalsController.createGoal);
router.get('/user/:userId', goalsController.getGoalsByUserId);
router.put('/:goalId', goalsController.updateGoal);
router.delete('/:goalId', goalsController.deleteGoal);

module.exports = router;
