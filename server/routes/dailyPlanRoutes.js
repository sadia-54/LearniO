const express = require('express');
const router = express.Router();
const dailyPlanController = require('../controllers/dailyPlanController');

// Get daily plans for a specific goal
router.get('/goals/:goalId/daily-plans', dailyPlanController.getDailyPlansByGoalId);

// Get today's plan for a specific goal
router.get('/goals/:goalId/today-plan', dailyPlanController.getTodayPlan);

// Generate a new daily plan using AI
router.post('/goals/:goalId/generate-plan', dailyPlanController.generateDailyPlan);

// Generate plans for the entire goal date range
router.post('/goals/:goalId/generate-range', dailyPlanController.generateRange);

// Update task status
router.put('/tasks/:taskId/status', dailyPlanController.updateTaskStatus);

// Create a new daily plan manually
router.post('/daily-plans', dailyPlanController.createDailyPlan);
 
 // Fetch all user plans by date
 router.get('/users/:userId/daily-plans', dailyPlanController.getUserPlansByDate);

module.exports = router;
